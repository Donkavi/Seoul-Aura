import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)[1].trim();

const csvPath = new URL("../data/koombiyo-delivery-rates.csv", import.meta.url);
const raw = readFileSync(csvPath, "utf8");

// Minimal RFC4180 CSV line parser — handles quoted fields with embedded commas.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(raw);
const header = rows[0];
const dataRows = rows.slice(1);

// Columns: From Branch, To District, To City, Charge for 1st kg, Charge per additional 1kg
const rates = new Map(); // key: `${district}||${city}` -> charge

for (const cols of dataRows) {
  if (cols.length < 4) continue;
  const district = (cols[1] ?? "").trim();
  const city = (cols[2] ?? "").trim();
  const charge = parseFloat(cols[3]);

  if (!district || !city || Number.isNaN(charge)) continue;

  rates.set(`${district}||${city}`, charge);
}

console.log(`Parsed ${dataRows.length} rows → ${rates.size} unique district/city rates.`);

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const col = db.collection("deliveryrates");

await col.createIndex({ district: 1, city: 1 }, { unique: true });

let upserted = 0;
const ops = [...rates.entries()].map(([key, charge]) => {
  const [district, city] = key.split("||");
  upserted++;
  return {
    updateOne: {
      filter: { district, city },
      update: { $set: { district, city, charge, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      upsert: true,
    },
  };
});

const BATCH = 500;
for (let i = 0; i < ops.length; i += BATCH) {
  await col.bulkWrite(ops.slice(i, i + BATCH));
  console.log(`  ...${Math.min(i + BATCH, ops.length)}/${ops.length}`);
}

console.log(`\n✅ Done — upserted ${upserted} district/city delivery rates.`);
await client.close();
