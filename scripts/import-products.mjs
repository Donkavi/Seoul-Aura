import { MongoClient, ObjectId } from "mongodb";
import { readFileSync } from "fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)[1].trim();

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function urls(str) {
  if (!str) return [];
  return str.split(/\s+/).map(s => s.trim()).filter(s => s.startsWith("http"));
}

function subtype(name) {
  const n = name.toLowerCase();
  if (n.includes("sun") || n.includes("spf")) return "Sunscreen";
  if (n.includes("eye")) return "Eye Care";
  if (n.includes("lip")) return "Lip Care";
  if (n.includes("travel kit") || n.includes("set")) return "Set";
  if (n.includes("mask") || n.includes("pad")) return "Mask";
  if (n.includes("foam") || n.includes("cleanser") || n.includes("cleansing") || n.includes("wash") || n.includes("gel foam")) return "Cleanser";
  if (n.includes("toner")) return "Toner";
  if (n.includes("cream") || n.includes("moisturi") || n.includes("jelly cream") || n.includes("lotion") || n.includes("balm") || n.includes("baume")) return "Moisturizer";
  if (n.includes("serum") || n.includes("ampoule") || n.includes("essence") || n.includes("shot") || n.includes("emulsion")) return "Serum";
  return "Skincare";
}

function tags(name) {
  const n = name.toLowerCase();
  const t = new Set(["k-beauty"]);
  if (n.includes("centella")) { t.add("centella"); t.add("calming"); }
  if (n.includes("niacinamide")) { t.add("niacinamide"); t.add("brightening"); }
  if (n.includes("snail")) { t.add("snail"); t.add("repair"); }
  if (n.includes("spf") || n.includes("sun")) t.add("sunscreen");
  if (n.includes("retinol") || n.includes("retinoid") || n.includes("retinal")) { t.add("retinol"); t.add("anti-aging"); }
  if (n.includes("glycolic") || n.includes("aha")) { t.add("aha"); t.add("exfoliating"); }
  if (n.includes("salicylic") || n.includes("bha")) { t.add("bha"); t.add("acne"); }
  if (n.includes("hyaluron") || n.includes("moisture")) t.add("hydrating");
  if (n.includes("propolis")) t.add("propolis");
  if (n.includes("rice")) t.add("rice");
  if (n.includes("glow") || n.includes("brightening")) t.add("brightening");
  if (n.includes("ceramide")) t.add("ceramide");
  if (n.includes("heartleaf")) t.add("heartleaf");
  if (n.includes("probio") || n.includes("probiotic")) t.add("probiotics");
  if (n.includes("soothing")) t.add("soothing");
  if (n.includes("dark spot")) t.add("dark-spot");
  if (n.includes("collagen")) { t.add("collagen"); t.add("anti-aging"); }
  if (n.includes("azelaic")) { t.add("azelaic-acid"); t.add("brightening"); }
  if (n.includes("peach")) t.add("peach");
  return [...t];
}

function concerns(name) {
  const n = name.toLowerCase();
  const c = new Set();
  if (n.includes("brightening") || n.includes("glow") || n.includes("tone") || n.includes("niacinamide") || n.includes("propolis") || n.includes("azelaic") || n.includes("dark spot") || n.includes("niacin")) c.add("Brightening");
  if (n.includes("moisture") || n.includes("hydrat") || n.includes("ceramide") || n.includes("hyaluron") || n.includes("ampoule") || n.includes("essence") || n.includes("cream") || n.includes("panthenol")) c.add("Hydration");
  if (n.includes("salicylic") || n.includes("bha") || n.includes("pore") || n.includes("acne")) c.add("Acne & Blemishes");
  if (n.includes("retinol") || n.includes("retinoid") || n.includes("collagen") || n.includes("retinal")) c.add("Anti-Aging");
  if (n.includes("centella") || n.includes("calming") || n.includes("soothing") || n.includes("heartleaf") || n.includes("ceramide") || n.includes("gentle")) c.add("Sensitive Skin");
  if (c.size === 0) c.add("Hydration");
  return [...c];
}

const ALL_PRODUCTS = [
  // ── SKIN1004 ──────────────────────────────────────────────
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Ampoule 100ml", price: 7632, comparePrice: 8990, shortDescription: "Intensive centella ampoule for calming and soothing sensitive skin.", images: urls("http://skin1004korea.com/web/product/extra/big/202108/a1297249dbf3dd129274b3256464d96c.png https://skin1004korea.com/web/product/extra/big/202509/863da67cb3c3fdb7909937438da1dbd3.webp https://www.skin1004.com/cdn/shop/products/skin1004-best-duo-centella-toner-210ml-centella-ampoule-100ml-36690982797558_1440x.png?v=1677148802") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Quick Calming Toner Pad 130ml (70 Sheets)", price: 6949, comparePrice: 6990, shortDescription: "Calming toner pads with centella extract for gentle daily exfoliation.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-mask-pad-70-pads-130ml-centella-quick-calming-pad-38642832474358_1440x.png?v=1677149423 https://www.skin1004.com/cdn/shop/products/skin1004-mask-pad-70-pads-130ml-centella-quick-calming-pad-38409144566006_1440x.jpg?v=1677149128 https://www.skin1004.com/cdn/shop/products/skin1004-mask-pad-70-pads-130ml-centella-quick-calming-pad-38409144762614_1440x.jpg?v=1677149128") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Light Cleansing Oil 200ml", price: 7415, comparePrice: 9585, shortDescription: "Gentle cleansing oil that removes makeup while soothing with centella.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-centella-light-cleansing-oil-38642994282742_1440x.png?v=1677151214 https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-centella-light-cleansing-oil-38409133654262_1440x.jpg?v=1677151102") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Ampoule Foam 125ml", price: 5682, comparePrice: 5990, shortDescription: "Foaming cleanser infused with centella for a calm, clean finish.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-centella-ampoule-foam-38642819825910_1440x.png?v=1677149057 https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-centella-ampoule-foam-38409123397878_1440x.jpg?v=1717738201") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Hyalu-Cica Water Fit Sun Serum SPF50+ PA++++ 50ml", price: 6332, comparePrice: 6500, shortDescription: "Lightweight SPF50+ sun serum that hydrates and calms with centella & hyaluron.", images: urls("https://www.skin1004.com/cdn/shop/files/skin1004-50ml-hyalu-cica-water-fit-sun-serum-uv-1204112543_1440x.png?v=1762764544 https://www.skin1004.com/cdn/shop/files/skin1004-50ml-hyalu-cica-water-fit-sun-serum-uv-1204822257_1440x.jpg?v=1763095744 https://www.skin1004.com/cdn/shop/files/skin1004-hyalu-cica-water-fit-sun-serum-uv-1233347068_1440x.jpg?v=1776768550") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Probio-Cica Intensive Ampoule 95ml", price: 9365, comparePrice: null, shortDescription: "Probiotic-powered centella ampoule for deep soothing and barrier repair.", images: urls("https://www.skin1004.com/cdn/shop/files/skin1004-ampoule-serum-probio-cica-intensive-ampoule-1231480392_1440x.jpg?v=1775623808 https://www.skin1004.com/cdn/shop/files/skin1004-ampoule-serum-95-ml-probio-cica-intensive-ampoule-40753719476470_1440x.png?v=1775619368") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Probio-Cica Intensive Ampoule 50ml", price: 7370, comparePrice: null, shortDescription: "Concentrated probiotic centella ampoule in a travel-friendly 50ml size.", images: [] },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Soothing Cream 75ml", price: 6982, comparePrice: 7990, shortDescription: "Rich centella cream that deeply soothes irritated and sensitive skin.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cream-centella-soothing-cream-38642833588470_1440x.png?v=1677149426 https://www.skin1004.com/cdn/shop/products/skin1004-cream-centella-soothing-cream-38409109831926_1440x.jpg?v=1677149146") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Cream 75ml", price: 7632, comparePrice: 7990, shortDescription: "Classic centella cream for balanced hydration and barrier support.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cream-centella-cream-38642822906102_1440x.png?v=1677149063 https://www.skin1004.com/cdn/shop/products/skin1004-cream-centella-cream-38409119170806_1440x.jpg?v=1677148989 https://www.skin1004.com/cdn/shop/products/skin1004-cream-centella-cream-38409119269110_1440x.jpg?v=1677148988") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Watergel Sheet Ampoule Mask 25ml x 5EA", price: 4899, comparePrice: null, shortDescription: "Cooling watergel sheet masks soaked in centella ampoule for instant calm.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-mask-pad-centella-watergel-sheet-ampoule-mask-38642839388406_1440x.png?v=1677149612 https://www.skin1004.com/cdn/shop/products/skin1004-mask-pad-madagascar-centella-watergel-sheet-ampoule-mask-36440530321654_1440x.jpg?v=1677149235") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Travel Kit 5 Types", price: 9065, comparePrice: 12500, shortDescription: "Complete centella skincare travel set with 5 bestselling mini products.", images: urls("https://www.skin1004.com/cdn/shop/files/skin1004-others-centella-travel-kit-1219913357_1440x.png?v=1770720429 https://www.skin1004.com/cdn/shop/files/skin1004-others-centella-travel-kit-40032160940278_1440x.png?v=1770709864") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Tone Brightening Capsule Ampoule 100ml", price: 7849, comparePrice: 8990, shortDescription: "Brightening capsule ampoule that targets dullness and uneven skin tone.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-ampoule-serum-100ml-brightening-capsule-ampoule-38642788630774_1440x.png?v=1677148702 https://www.skin1004.com/cdn/shop/products/skin1004-ampoule-serum-100ml-madagascar-centella-tone-brightening-capsule-ampoule-36440330895606_1440x.jpg?v=1677148510") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Retinol 0.2 Boosting Shot Ampoule 30ml", price: 8715, comparePrice: null, shortDescription: "Gentle retinol ampoule for anti-aging and skin renewal with centella.", images: urls("https://www.skin1004.com/cdn/shop/files/skin1004-30ml-retinol-0-2-boosting-shot-ampoule-1170007504_1440x.png?v=1750078128 https://www.skin1004.com/cdn/shop/files/skin1004-30ml-retinol-0-2-boosting-shot-ampoule-1170007502_1440x.png?v=1750078128 https://www.skin1004.com/cdn/shop/files/skin1004-30ml-retinol-0-2-boosting-shot-ampoule-1170007501_1440x.png?v=1750078128") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Tone Brightening Cleansing Gel Foam 125ml", price: 5682, comparePrice: 5990, shortDescription: "Brightening gel foam cleanser that evens skin tone while removing impurities.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-125ml-tone-brightening-cleansing-gel-foam-38642975965430_1440x.png?v=1677151217 https://www.skin1004.com/cdn/shop/products/skin1004-cleanser-125ml-madagascar-centella-tone-brightening-cleansing-gel-foam-36440353407222_1440x.jpg?v=1677150964") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Tone Brightening Capsule Cream 75ml", price: 7632, comparePrice: 7990, shortDescription: "Brightening capsule cream that targets dark spots and boosts radiance.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-cream-tone-brightening-capsule-cream-38642938314998_1440x.png?v=1677150683 https://www.skin1004.com/cdn/shop/products/skin1004-madagascar-centella-tone-brightening-capsule-cream-75m-37793803436278_1440x.png?v=1677150487") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Poremizing Deep Cleansing Foam 125ml", price: 5682, comparePrice: 5990, shortDescription: "Deep cleansing foam that minimises pores and removes excess sebum.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-poremizing-deep-cleansing-foam-38642870223094_1440x.png?v=1677149782 https://www.skin1004.com/cdn/shop/products/skin1004-poremizing-deep-cleansing-foam-38174108844278_1440x.png?v=1677149683") },
  { brand: "SKIN1004", origin: "Korea", name: "SKIN1004 Madagascar Centella Tone Brightening Boosting Toner 210ml", price: 6982, comparePrice: 7500, shortDescription: "Hydrating brightening toner that preps skin and boosts absorption.", images: urls("https://www.skin1004.com/cdn/shop/products/skin1004-toner-210ml-tone-brightening-boosting-toner-38642937135350_1440x.png?v=1677150680 https://www.skin1004.com/cdn/shop/products/skin1004-toner-210ml-madagascar-centella-tone-brightening-boosting-toner-36440310350070_1440x.jpg?v=1677150471") },

  // ── Beauty of Joseon ──────────────────────────────────────
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+ PA++++ 50ml", price: 5899, comparePrice: 6500, shortDescription: "Lightweight rice-powered sunscreen with SPF50+ that leaves no white cast.", images: urls("https://beautyofjoseon.com/cdn/shop/files/relief-sunscreen-1-front.webp?v=1770603160&width=3000") },
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Glow Serum: Propolis + Niacinamide 30ml", price: 5682, comparePrice: 6400, shortDescription: "Brightening serum with propolis and niacinamide for a glass-skin glow.", images: urls("https://beautyofjoseon.co.kr/web/product/small/202504/7bc9abdc871325e5ac2bd647816d319a.jpg") },
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Revive Eye Serum: Ginseng + Retinal 30ml", price: 5682, comparePrice: 6500, shortDescription: "Anti-aging eye serum with ginseng and retinal to firm and brighten the eye area.", images: urls("https://beautyofjoseon.co.kr/web/product/small/202504/a8965551fee5d58ef5df9aab9f321f1c.jpg") },
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Ground Rice and Honey Glow Mask 150ml", price: 5899, comparePrice: 6990, shortDescription: "Wash-off glow mask with ground rice and honey for instant radiance.", images: urls("https://beautyofjoseon.com/cdn/shop/files/ground-rice-honey-glow-mask-1-front.webp?v=1770286001&width=3000") },
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Relief Sun Aqua-Fresh: Rice + B5 SPF50+ PA++++ 50ml", price: 5899, comparePrice: 6500, shortDescription: "Fresh aqua sunscreen with rice and vitamin B5 for hydrated, protected skin.", images: urls("https://beautyofjoseon.com/cdn/shop/files/relief-sunscreen-aqua-fresh-1.webp?v=1770602802&width=3000") },
  { brand: "Beauty of Joseon", origin: "Korea", name: "Beauty of Joseon Glow Replenishing Rice Milk 150ml", price: 6500, comparePrice: null, shortDescription: "Nourishing rice milk essence that replenishes moisture and brightens skin tone.", images: [] },

  // ── AXIS-Y ────────────────────────────────────────────────
  { brand: "AXIS-Y", origin: "Korea", name: "AXIS-Y Dark Spot Correcting Glow Serum 50ml", price: 6915, comparePrice: 6950, shortDescription: "Targeted dark spot serum that visibly corrects and brightens uneven skin tone.", images: urls("https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0023/A00000023179902ko.jpeg?l=ko&QT=85&SF=webp&sharpen=1x0.5") },

  // ── ANUA ──────────────────────────────────────────────────
  { brand: "ANUA", origin: "Korea", name: "Anua Niacinamide 10% + TXA 4% Dark Spot Correcting Serum 30ml", price: 7250, comparePrice: null, shortDescription: "High-concentration niacinamide serum that tackles dark spots and hyperpigmentation.", images: urls("https://anua.kr/web/product/extra/small/202505/5a19b589f463c2718d1a332324dbed9d.png") },
  { brand: "ANUA", origin: "Korea", name: "Anua Azelaic Acid 10 Hyaluron Redness Soothing Serum 30ml", price: 8850, comparePrice: null, shortDescription: "Azelaic acid serum that soothes redness and calms reactive skin.", images: urls("https://anua.com/cdn/shop/files/anua-us-ampoule-serum-azelaic-acid-10-hyaluron-redness-soothing-serum-1239193732.jpg?v=1779177969&width=1000") },
  { brand: "ANUA", origin: "Korea", name: "Anua Heartleaf 77 Hyaluron Soothing Toner 250ml", price: 6650, comparePrice: null, shortDescription: "Hydrating heartleaf toner that instantly calms and plumps sensitive skin.", images: urls("https://anua.com/cdn/shop/files/anua-us-toner-heartleaf-77-soothing-toner-1239193744.jpg?v=1779181932&width=1000") },
  { brand: "ANUA", origin: "Korea", name: "Anua Rice 70 Glow Milky Toner 250ml", price: 6950, comparePrice: null, shortDescription: "Milky rice toner that brightens and softens skin with every application.", images: urls("https://anua.kr/web/product/extra/small/202412/9040cbcb2feddf1c4cc9597fa97154f3.png https://anua.kr/web/product/extra/small/202412/6c191fdf24e56ade040b62a38e11d76e.png") },
  { brand: "ANUA", origin: "Korea", name: "Anua Peach 70 Niacin Serum 30ml", price: 6649, comparePrice: null, shortDescription: "Peachy-fresh niacinamide serum for a brighter, more even complexion.", images: urls("https://anua.com/cdn/shop/files/anua-global-ampoule-serum-peach-70-niacinamide-serum-1239193727.jpg?v=1779177611&width=1000 https://anua.kr/web/product/extra/small/202412/d9202939d90684f19bfc73e71b4e5eb0.png") },
  { brand: "ANUA", origin: "Korea", name: "Anua 3 Ceramide Panthenol Moisture Barrier Cream 100ml", price: 8948, comparePrice: null, shortDescription: "Triple ceramide cream that rebuilds the moisture barrier for resilient, hydrated skin.", images: urls("https://anua.com/cdn/shop/files/anua-us-moisturizer-3-ceramide-panthenol-moisture-barrier-cream-1239193739.jpg?v=1779177070&width=2000") },

  // ── Haruharu Wonder ───────────────────────────────────────
  { brand: "Haruharu Wonder", origin: "Korea", name: "Haruharu Wonder Black Rice Moisture Airyfit Daily Sunscreen SPF50+ PA++++ 50ml", price: 6482, comparePrice: 6500, shortDescription: "Airy-finish sunscreen with black rice extract for daily moisture and SPF50+ protection.", images: urls("https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0024/A00000024497501ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5") },
  { brand: "Haruharu Wonder", origin: "Korea", name: "Haruharu Wonder Black Rice Triple AHA Gentle Cleansing Gel Unscented 100ml", price: 5500, comparePrice: null, shortDescription: "Gentle AHA cleansing gel with black rice for smooth, refined skin texture.", images: [] },

  // ── COSRX ─────────────────────────────────────────────────
  { brand: "COSRX", origin: "Korea", name: "COSRX Advanced Snail 96 Mucin Power Essence 100ml", price: 6550, comparePrice: null, shortDescription: "96% snail secretion filtrate essence for intense repair and deep hydration.", images: [] },
  { brand: "COSRX", origin: "Korea", name: "COSRX Aloe Soothing Sun Cream SPF50 PA+++ 50ml", price: 4772, comparePrice: 4950, shortDescription: "Aloe-infused sun cream with SPF50 for calming, lightweight daily protection.", images: [] },

  // ── Medicube ──────────────────────────────────────────────
  { brand: "Medicube", origin: "Korea", name: "Medicube Collagen Jelly Cream 50ml", price: 6250, comparePrice: null, shortDescription: "Bouncy collagen jelly cream that plumps and firms for a youthful complexion.", images: urls("https://cafe24img.poxo.com/medicube0/web/product/big/202410/e2e3c48e892986d0fed626e7213ba10c.png https://cafe24img.poxo.com/medicube0/web/product/extra/big/202306/91e96f97b96a2e22c478f2a7d03de3cc.png") },
  { brand: "Medicube", origin: "Korea", name: "Medicube Collagen Jelly Cream 110ml", price: 10450, comparePrice: null, shortDescription: "Full-size bouncy collagen cream for lasting firmness and deep hydration.", images: urls("https://cafe24img.poxo.com/medicube0/web/product/big/202410/e2e3c48e892986d0fed626e7213ba10c.png") },

  // ── APLB ──────────────────────────────────────────────────
  { brand: "APLB", origin: "Korea", name: "APLB Snail Mucin Ginseng Facial Cream 55ml", price: 4990, comparePrice: null, shortDescription: "Snail mucin and ginseng facial cream for intensive repair and anti-aging.", images: [] },
  { brand: "APLB", origin: "Korea", name: "APLB Snail Mucin Ginseng Ampoule Serum 40ml", price: 4990, comparePrice: null, shortDescription: "Potent snail mucin ginseng serum that repairs and rejuvenates stressed skin.", images: [] },

  // ── The Ordinary (Global) ─────────────────────────────────
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Niacinamide 10% + Zinc 1% 30ml", price: 4884, comparePrice: 6930, shortDescription: "High-strength niacinamide serum that reduces blemishes and balances oil.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwce8a7cdf/Images/products/The%20Ordinary/rdn-niacinamide-10pct-zinc-1pct-30ml.png?sw=860&sh=860&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Glycolic Acid 7% Exfoliating Toner 100ml", price: 9583, comparePrice: null, shortDescription: "Gentle glycolic acid toner for refined texture, brightness, and smooth skin.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw8b57fa2b/Images/products/The%20Ordinary/ord-glyc-acid-7pct-100ml-Aug-UPC.png?sw=860&sh=860&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Glycolic Acid 7% Exfoliating Toner 240ml", price: 6661, comparePrice: 11190, shortDescription: "Economy-size glycolic acid toner for smooth, exfoliated, radiant skin.", images: [] },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Salicylic Acid 2% Solution 30ml", price: 7525, comparePrice: null, shortDescription: "BHA solution that unclogs pores, reduces blackheads and controls breakouts.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwcece52fb/Images/products/The%20Ordinary/rdn-salicylic-acid-2pct-solution-30ml.png?sw=800&sh=800&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Squalane + Amino Acids Lip Balm 15ml", price: 8000, comparePrice: null, shortDescription: "Nourishing lip balm with squalane and amino acids for soft, plump lips.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw99c8c0a6/Images/products/The%20Ordinary/ord-squalane-amino-acids-lip-balm-15ml.png?sw=800&sh=800&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Granactive Retinoid 2% Emulsion 30ml", price: 9690, comparePrice: null, shortDescription: "Advanced retinoid emulsion for visible anti-aging with minimal irritation.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw66368c91/Images/products/The%20Ordinary/rdn-granactive-retinoid-2pct-emulsion-30ml.png?sw=800&sh=800&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Glucoside Foaming Cleanser 150ml", price: 7116, comparePrice: 9500, shortDescription: "Gentle foaming cleanser with glucosides for a clean, balanced complexion.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwf372b319/Images/products/The%20Ordinary/rdn-glucoside-foaming-cleanser-150ml.png?sw=800&sh=800&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Natural Moisturizing Factors + Beta Glucan 30ml", price: 7500, comparePrice: null, shortDescription: "Lightweight moisturizer with NMF and beta-glucan for lasting hydration.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwf7afd35c/Images/products/The%20Ordinary/ord-nmf-bg-30mL-packshot-Resized.png?sw=800&sh=800&sm=fit") },
  { brand: "The Ordinary", origin: "Global", name: "The Ordinary Natural Moisturizing Factors + Beta Glucan 100ml", price: 6940, comparePrice: 7588, shortDescription: "Full-size NMF moisturizer with beta-glucan for supple, well-hydrated skin.", images: urls("https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwd8d41f86/Images/products/The%20Ordinary/rdn-natural-moisturizing-factors-beta-glucan-100ml.png?sw=800&sh=800&sm=fit") },
];

// ── Run import ────────────────────────────────────────────────────────────────
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const productCol = db.collection("products");
const brandCol   = db.collection("brands");

let created = 0, skipped = 0;

for (const p of ALL_PRODUCTS) {
  // Upsert brand
  await brandCol.updateOne(
    { name: p.brand },
    { $setOnInsert: { name: p.brand, origin: p.origin, createdAt: new Date() } },
    { upsert: true }
  );

  // Skip if product already exists
  const exists = await productCol.findOne({ name: p.name });
  if (exists) { skipped++; continue; }

  const cp = (p.comparePrice && p.comparePrice > p.price) ? p.comparePrice : undefined;

  await productCol.insertOne({
    _id: new ObjectId(),
    name: p.name.trim(),
    slug: slugify(p.name),
    shortDescription: p.shortDescription,
    description: "",
    brand: p.brand,
    price: p.price,
    ...(cp ? { comparePrice: cp } : {}),
    origin: p.origin,
    type: "Cosmetics",
    subtype: subtype(p.name),
    images: p.images,
    stock: 0,
    tags: tags(p.name),
    concerns: concerns(p.name),
    variants: [],
    active: true,
    isPreOrder: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  created++;
  console.log(`✓ ${p.name}`);
}

console.log(`\n✅ Done — Created: ${created}, Skipped (already exist): ${skipped}`);
await client.close();
