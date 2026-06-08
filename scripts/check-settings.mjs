import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

// Read MONGODB_URI from .env.local
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)[1].trim();

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const doc = await db.collection("settings").findOne({});
console.log("=== Settings document keys ===");
console.log(Object.keys(doc));
console.log("\n=== homeSections ===");
console.log(JSON.stringify(doc.homeSections, null, 2));
await client.close();
