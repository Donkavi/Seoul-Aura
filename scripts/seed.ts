import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import Product from "../models/Product";
import Category from "../models/Category";
import Review from "../models/Review";
import User from "../models/User";
import NavMenu from "../models/NavMenu";
import Concern from "../models/Concern";
import SubscriptionPlan from "../models/SubscriptionPlan";
import Subscription from "../models/Subscription";
import Admin from "../models/Admin";
import { slugify } from "../lib/utils";

const MONGODB_URI = process.env.MONGODB_URI!;

const categories = [
  {
    type: "Cosmetics",
    subtypes: ["Skincare", "Makeup", "Haircare", "Bodycare", "Sunscreen", "Devices"],
  },
  {
    type: "Food",
    subtypes: ["Snacks", "Ramen", "Beverages", "Condiments", "Sweets", "Dates"],
  },
];

const skincareImages = [
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=800&h=800&fit=crop",
];

const sunscreenImages = [
  "https://images.unsplash.com/photo-1556228841-7d0e75a23d5d?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=800&fit=crop",
];

const maskImages = [
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
];

const haircareImages = [
  "https://images.unsplash.com/photo-1626015449829-93761d4716c5?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1599733589046-833caccbbd03?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1522335789203-aaa6f8e54c46?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
];

const datesImages = [
  "https://images.unsplash.com/photo-1601493700518-4f9f5a8fcb3a?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&h=800&fit=crop",
];

const chocolateImages = [
  "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1605207616227-7e1b1c5ce6e0?w=800&h=800&fit=crop",
];

const ramenImages = [
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&h=800&fit=crop",
];

const snackImages = [
  "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1599785209707-a456fc1337f7?w=800&h=800&fit=crop",
];

const products = [
  {
    name: "Beauty of Joseon Glow Serum · Propolis + Niacinamide",
    description:
      "A nourishing, brightening serum that combines pure propolis extract with niacinamide. Lightweight, fast-absorbing, suitable for all skin types.",
    shortDescription: "Brightening serum with propolis & niacinamide.",
    price: 6950,
    comparePrice: 7500,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: skincareImages,
    stock: 24,
    tags: ["serum", "brightening"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 4.8,
    reviewCount: 211,
  },
  {
    name: "COSRX Snail Mucin 96 Power Essence · 100ml",
    description:
      "Hydrates and repairs damaged skin with 96% snail mucin. A K-Beauty cult favorite.",
    shortDescription: "Hydrating snail mucin essence.",
    price: 7250,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: skincareImages.slice().reverse(),
    stock: 35,
    tags: ["essence", "snail-mucin", "hydration"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    averageRating: 4.9,
    reviewCount: 412,
  },
  {
    name: "ANUA Heartleaf Calming Daily Sun Water · 50ml",
    description: "Lightweight daily sunscreen infused with calming heartleaf extract.",
    shortDescription: "Calming daily SPF.",
    price: 7400,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Sunscreen",
    images: sunscreenImages,
    stock: 20,
    tags: ["sunscreen", "spf50"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 4.9,
    reviewCount: 142,
  },
  {
    name: "Medicube PDRN Pink Vita Coating Mask · Sheet Mask",
    description: "Brightening sheet mask infused with PDRN for radiant glass skin.",
    shortDescription: "PDRN brightening sheet mask.",
    price: 3950,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: maskImages,
    stock: 60,
    tags: ["mask", "brightening"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 4.7,
    reviewCount: 38,
  },
  {
    name: "Innisfree Volcanic Pore Clay Mask · 100ml",
    description: "Deep cleansing clay mask with Jeju volcanic ash.",
    shortDescription: "Volcanic pore-clearing clay mask.",
    price: 4850,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: maskImages.slice().reverse(),
    stock: 0,
    tags: ["mask", "clay", "pore"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 4.5,
    reviewCount: 92,
  },
  {
    name: "Mielle Rosemary Mint Scalp Strengthening Oil · 60ml",
    description: "Strengthening hair oil with rosemary and mint.",
    shortDescription: "Rosemary mint scalp oil.",
    price: 8650,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Haircare",
    images: haircareImages,
    stock: 19,
    tags: ["hair", "oil"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 4.7,
    reviewCount: 178,
  },
  {
    name: "Bateel Premium Date Selection · Dubai Gift Box",
    description: "Hand-selected premium dates from Dubai.",
    shortDescription: "Premium dates gift box from Dubai.",
    price: 12500,
    origin: "Dubai",
    type: "Food",
    subtype: "Dates",
    images: datesImages,
    stock: 8,
    tags: ["dates", "gift", "premium"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    averageRating: 5.0,
    reviewCount: 47,
  },
  {
    name: "Patchi Mixed Chocolate Selection · 250g",
    description: "Luxury Dubai-imported chocolate assortment.",
    shortDescription: "Mixed Dubai chocolate selection.",
    price: 8950,
    origin: "Dubai",
    type: "Food",
    subtype: "Sweets",
    images: chocolateImages,
    stock: 14,
    tags: ["chocolate", "gift"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 4.8,
    reviewCount: 63,
  },
  {
    name: "Shin Ramyun Black · Premium Korean Ramen (4 Pack)",
    description: "Premium Shin Ramyun Black noodles with rich beef bone broth.",
    shortDescription: "Premium Korean instant ramen.",
    price: 1850,
    origin: "Korea",
    type: "Food",
    subtype: "Ramen",
    images: ramenImages,
    stock: 80,
    tags: ["ramen", "instant"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    averageRating: 4.6,
    reviewCount: 134,
  },
  {
    name: "Pepero Almond Chocolate Sticks · 32g",
    description: "Crunchy almond chocolate biscuit sticks — Korea's beloved snack.",
    shortDescription: "Korean almond chocolate sticks.",
    price: 450,
    origin: "Korea",
    type: "Food",
    subtype: "Snacks",
    images: snackImages,
    stock: 120,
    tags: ["snack", "chocolate"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 4.4,
    reviewCount: 67,
  },
];

const reviewImagePool = [
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1601493700518-4f9f5a8fcb3a?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1626015449829-93761d4716c5?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1599733589046-833caccbbd03?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop",
];

function pickRandomImages(count: number, productImages: string[]): string[] {
  const pool = [...productImages, ...reviewImagePool];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const reviewTemplates = [
  {
    userName: "Sanduni P.",
    rating: 5,
    title: "Skin transformation in a month",
    comment:
      "I've been using this product for a month and I'm amazed at how much it brightened up dark spots on my face. Helped maintain moisture on my dry skin and overall brightened my complexion! Worth every single rupee. The packaging is so cute too — I always look forward to unboxing.",
    isVerifiedBuyer: true,
    imageCount: 2,
  },
  {
    userName: "Krishani R.",
    rating: 5,
    title: "Genuine products, fast delivery",
    comment:
      "A 'go-to' place for genuine products at reasonable prices. Very much satisfied with their super fast delivery service. Got my order in 2 days! Highly recommended.",
    isVerifiedBuyer: true,
    imageCount: 1,
  },
  {
    userName: "Tharushi M.",
    rating: 5,
    title: "Repurchased twice already",
    comment:
      "Loves how soft and clean it left my skin. I have repurchased twice already. The texture is divine and the smell is so subtle yet luxurious.",
    isVerifiedBuyer: true,
    imageCount: 3,
  },
  {
    userName: "Imesha A.",
    rating: 4,
    title: "Authentic & high quality",
    comment:
      "Incredibly impressed with the authenticity and quality. My skin has never looked this radiant. The packaging is gorgeous too — feels like opening a gift every time. Knocking off one star only because shipping took 4 days.",
    isVerifiedBuyer: true,
    imageCount: 2,
  },
  {
    userName: "Nadeesha K.",
    rating: 5,
    title: "Worth every rupee",
    comment:
      "Love the variety in their range. Found my new favorite Korean product through Seoul Aura. The customer service team is so helpful with recommendations.",
    isVerifiedBuyer: true,
    imageCount: 0,
  },
  {
    userName: "Dinithi W.",
    rating: 5,
    title: "Glass skin achieved!",
    comment:
      "After 3 weeks of using this consistently, my skin looks like literal glass. Bouncy, dewy, and even-toned. My morning routine is now my favorite part of the day.",
    isVerifiedBuyer: true,
    imageCount: 2,
  },
  {
    userName: "Yohani N.",
    rating: 5,
    title: "It's amazing",
    comment:
      "Honestly didn't expect this much from a single product. My partner keeps asking what changed. I love that it's lightweight and absorbs so fast.",
    isVerifiedBuyer: true,
    imageCount: 1,
  },
  {
    userName: "Asitha G.",
    rating: 4,
    title: "Great taste, premium packaging",
    comment:
      "The dates were so fresh and the packaging is gift-ready — bought it for my mother-in-law and she loved it. Will be back for more!",
    isVerifiedBuyer: true,
    imageCount: 2,
  },
  {
    userName: "Hashini D.",
    rating: 5,
    title: "Cult product for a reason",
    comment:
      "Now I understand the hype. This is unlike anything I've tried in Sri Lanka before. My hyperpigmentation is fading visibly.",
    isVerifiedBuyer: true,
    imageCount: 1,
  },
  {
    userName: "Pavithra J.",
    rating: 5,
    title: "Subscription box was perfect",
    comment:
      "My first monthly box arrived with such thoughtful curation — including products I would never have picked myself but ended up loving. 10/10.",
    isVerifiedBuyer: true,
    imageCount: 3,
  },
];

async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Clearing existing data (dropping collections to reset indexes)…");
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  const existing = collections.map((c) => c.name);
  for (const name of ["categories", "products", "reviews", "users", "navmenuitems", "concerns", "subscriptionplans", "subscriptions", "admins"]) {
    if (existing.includes(name)) await db.dropCollection(name);
  }

  console.log("Seeding categories…");
  await Promise.all(
    categories.map((c) =>
      Category.create({
        type: c.type,
        slug: slugify(c.type),
        subtypes: c.subtypes.map((s) => ({ name: s, slug: slugify(s) })),
      })
    )
  );

  console.log("Seeding products…");
  const created = await Promise.all(
    products.map((p) =>
      Product.create({ ...p, slug: slugify(p.name) })
    )
  );

  console.log("Seeding reviews with images…");
  for (const product of created) {
    const count = Math.floor(Math.random() * 4) + 3;
    const usedNames = new Set<string>();
    for (let i = 0; i < count; i++) {
      const available = reviewTemplates.filter((t) => !usedNames.has(t.userName));
      const tpl =
        available[Math.floor(Math.random() * available.length)] ?? reviewTemplates[0];
      usedNames.add(tpl.userName);

      const images = tpl.imageCount > 0 ? pickRandomImages(tpl.imageCount, product.images) : [];

      await Review.create({
        userName: tpl.userName,
        rating: tpl.rating,
        title: tpl.title,
        comment: tpl.comment,
        isVerifiedBuyer: tpl.isVerifiedBuyer,
        images,
        productId: product._id,
        isApproved: true,
        helpfulVotes: Math.floor(Math.random() * 25),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000),
      });
    }
  }

  console.log("Seeding sample users…");
  await User.create([
    {
      name: "Sanduni Perera",
      email: "sanduni@example.com",
      subscriptionStatus: "active",
      subscriptionPlan: "k-beauty-luxe",
    },
    {
      name: "Krishani Rajapaksa",
      email: "krishani@example.com",
      subscriptionStatus: "active",
      subscriptionPlan: "dubai-snack-box",
    },
    {
      name: "Tharushi Mendis",
      email: "tharushi@example.com",
      subscriptionStatus: "none",
    },
  ]);

  console.log("Seeding subscription plans…");
  const seededPlans = await SubscriptionPlan.insertMany([
    {
      name: "K-Beauty Essentials", description: "A curated taste of Korean skincare delivered monthly.",
      price: 6500, origin: "Korea", badge: "Starter", featured: false, active: true, order: 0,
      items: ["4-5 deluxe samples", "1 full-size hero product", "Monthly beauty newsletter", "Free islandwide shipping"],
    },
    {
      name: "K-Beauty Luxe", description: "The ultimate K-Beauty experience, hand-picked by our experts.",
      price: 12500, origin: "Korea", badge: "Most Popular", featured: true, active: true, order: 1,
      items: ["3 full-size luxury products", "Premium gift packaging", "Quarterly tool/device bonus", "VIP early access", "Free islandwide shipping"],
    },
    {
      name: "Dubai Snack Box", description: "Exotic dates, chocolates and sweets straight from Dubai.",
      price: 7800, origin: "Dubai", badge: "Foodie Favorite", featured: false, active: true, order: 2,
      items: ["8-10 specialty snacks", "Premium dates selection", "Cultural insight card", "Free islandwide shipping"],
    },
    {
      name: "Seoul x Dubai Mixed", description: "Best of both worlds — beauty essentials and exotic treats.",
      price: 9500, origin: "Mixed", badge: "Best Value", featured: false, active: true, order: 3,
      items: ["3 K-Beauty products", "4-5 Dubai specialties", "Mini lifestyle magazine", "Free islandwide shipping"],
    },
  ]);

  const [essentials, luxe, dubaiSnack, mixed] = seededPlans;
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  console.log("Seeding sample subscriptions…");
  await Subscription.insertMany([
    {
      customerName: "Sanduni Perera",
      customerEmail: "sanduni@example.com",
      phoneNumber: "+94 77 123 4567",
      planId: luxe._id.toString(),
      planName: luxe.name,
      planPrice: luxe.price,
      origin: luxe.origin,
      status: "active",
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      nextBillingDate: nextMonth,
      shippingAddress: { line1: "45 Galle Road", city: "Colombo 03", country: "Sri Lanka" },
      notes: "No fragrance products please",
    },
    {
      customerName: "Krishani Rajapaksa",
      customerEmail: "krishani@example.com",
      phoneNumber: "+94 71 987 6543",
      planId: dubaiSnack._id.toString(),
      planName: dubaiSnack.name,
      planPrice: dubaiSnack.price,
      origin: dubaiSnack.origin,
      status: "active",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      nextBillingDate: nextMonth,
      shippingAddress: { line1: "12 Kandy Road", city: "Kandy", country: "Sri Lanka" },
    },
    {
      customerName: "Tharushi Mendis",
      customerEmail: "tharushi@example.com",
      phoneNumber: "+94 76 555 0001",
      planId: essentials._id.toString(),
      planName: essentials.name,
      planPrice: essentials.price,
      origin: essentials.origin,
      status: "active",
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      nextBillingDate: nextMonth,
      shippingAddress: { line1: "78 Marine Drive", city: "Negombo", country: "Sri Lanka" },
    },
    {
      customerName: "Imesha Alwis",
      customerEmail: "imesha@example.com",
      phoneNumber: "+94 70 234 5678",
      planId: mixed._id.toString(),
      planName: mixed.name,
      planPrice: mixed.price,
      origin: mixed.origin,
      status: "paused",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      shippingAddress: { line1: "33 Temple Road", city: "Gampaha", country: "Sri Lanka" },
      notes: "Paused for travel — resumes in 2 months",
    },
    {
      customerName: "Nadeesha Kumari",
      customerEmail: "nadeesha@example.com",
      planId: luxe._id.toString(),
      planName: luxe.name,
      planPrice: luxe.price,
      origin: luxe.origin,
      status: "cancelled",
      startDate: new Date(now.getFullYear(), now.getMonth() - 4, 1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      shippingAddress: { line1: "22 High Street", city: "Matara", country: "Sri Lanka" },
      notes: "Cancelled — moving abroad",
    },
  ]);

  console.log("Seeding concerns…");
  await Concern.insertMany([
    { name: "Brightening", slug: "brightening", description: "Even skin tone and add radiance", order: 0 },
    { name: "Anti-Aging", slug: "anti-aging", description: "Reduce fine lines and wrinkles", order: 1 },
    { name: "Hydration", slug: "hydration", description: "Deep moisture and plumping", order: 2 },
    { name: "Acne & Blemish", slug: "acne", description: "Clear breakouts and prevent blemishes", order: 3 },
    { name: "Pigmentation", slug: "pigmentation", description: "Fade dark spots and hyperpigmentation", order: 4 },
    { name: "Pores", slug: "pores", description: "Minimize and refine pore appearance", order: 5 },
    { name: "Sensitive Skin", slug: "sensitive", description: "Gentle formulas for reactive skin", order: 6 },
    { name: "Firming", slug: "firming", description: "Lift and tighten skin", order: 7 },
    { name: "Soothing", slug: "soothing", description: "Calm redness and irritation", order: 8 },
    { name: "Whitening", slug: "whitening", description: "Brighten and even complexion", order: 9 },
  ]);

  console.log("Seeding admin users…");
  await Admin.create({
    email: "kavinduchamith01@gmail.com",
    name: "Kavindu",
    addedBy: "seed",
  });

  console.log("Seeding nav menu…");
  const navMenuData = [
    { label: "Shop All", href: "/shop", order: 0 },
    {
      label: "Skincare", href: "/shop?subtype=Skincare", order: 1,
      columns: [
        { heading: "By Concern", links: [
          { label: "Brightening", href: "/shop?concern=brightening" },
          { label: "Anti-Aging", href: "/shop?concern=anti-aging" },
          { label: "Hydration", href: "/shop?concern=hydration" },
          { label: "Acne & Blemish", href: "/shop?concern=acne" },
          { label: "Pigmentation", href: "/shop?concern=pigmentation" },
          { label: "Pores", href: "/shop?concern=pores" },
        ]},
        { heading: "By Product", links: [
          { label: "Serums & Essences", href: "/shop?subtype=Skincare&tag=serum" },
          { label: "Cleansers", href: "/shop?subtype=Skincare&tag=cleanser" },
          { label: "Toners", href: "/shop?subtype=Skincare&tag=toner" },
          { label: "Moisturizers", href: "/shop?subtype=Skincare&tag=moisturizer" },
          { label: "Masks & Sheet Masks", href: "/shop?subtype=Skincare&tag=mask" },
          { label: "Sunscreen", href: "/shop?subtype=Sunscreen" },
        ]},
        { heading: "By Origin", links: [
          { label: "K-Beauty Edit", href: "/shop?origin=Korea&type=Cosmetics" },
          { label: "Dubai Luxe", href: "/shop?origin=Dubai&type=Cosmetics" },
          { label: "Bestsellers", href: "/shop?filter=bestseller" },
          { label: "New Arrivals", href: "/shop?filter=new" },
        ]},
      ],
      feature: { title: "Glass Skin Routine", description: "Your 4-step ritual to luminous, dewy skin.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=500&fit=crop", href: "/shop?tag=glass-skin", cta: "Shop the routine" },
    },
    {
      label: "Makeup", href: "/shop?subtype=Makeup", order: 2,
      columns: [
        { heading: "Eye", links: [
          { label: "Eyeshadow", href: "/shop?subtype=Makeup&tag=eyeshadow" },
          { label: "Lashes", href: "/shop?subtype=Makeup&tag=lashes" },
          { label: "Mascara", href: "/shop?subtype=Makeup&tag=mascara" },
          { label: "Eyeliner", href: "/shop?subtype=Makeup&tag=eyeliner" },
          { label: "Eye Brow", href: "/shop?subtype=Makeup&tag=brow" },
        ]},
        { heading: "Face", links: [
          { label: "Foundation", href: "/shop?subtype=Makeup&tag=foundation" },
          { label: "Powder", href: "/shop?subtype=Makeup&tag=powder" },
          { label: "Concealer", href: "/shop?subtype=Makeup&tag=concealer" },
          { label: "Primer & Setting Spray", href: "/shop?subtype=Makeup&tag=primer" },
          { label: "Contour & Bronzer", href: "/shop?subtype=Makeup&tag=contour" },
          { label: "Blush", href: "/shop?subtype=Makeup&tag=blush" },
          { label: "Highlighter", href: "/shop?subtype=Makeup&tag=highlighter" },
        ]},
        { heading: "Lips", links: [
          { label: "Liquid Lipstick", href: "/shop?subtype=Makeup&tag=liquid-lipstick" },
          { label: "Lipstick", href: "/shop?subtype=Makeup&tag=lipstick" },
          { label: "Lip Gloss", href: "/shop?subtype=Makeup&tag=gloss" },
          { label: "Lip Pencil", href: "/shop?subtype=Makeup&tag=pencil" },
          { label: "Lip Balm", href: "/shop?subtype=Makeup&tag=balm" },
        ]},
      ],
    },
    {
      label: "Hair & Body", href: "/shop?subtype=Haircare", order: 3,
      columns: [
        { heading: "Hair Care", links: [
          { label: "Shampoo", href: "/shop?subtype=Haircare&tag=shampoo" },
          { label: "Conditioner", href: "/shop?subtype=Haircare&tag=conditioner" },
          { label: "Hair Oils", href: "/shop?subtype=Haircare&tag=oil" },
          { label: "Hair Masks", href: "/shop?subtype=Haircare&tag=mask" },
          { label: "Styling", href: "/shop?subtype=Haircare&tag=styling" },
          { label: "Scalp Care", href: "/shop?subtype=Haircare&tag=scalp" },
        ]},
        { heading: "Body Care", links: [
          { label: "Body Wash", href: "/shop?subtype=Bodycare&tag=wash" },
          { label: "Body Lotion", href: "/shop?subtype=Bodycare&tag=lotion" },
          { label: "Hand Cream", href: "/shop?subtype=Bodycare&tag=hand" },
          { label: "Body Scrubs", href: "/shop?subtype=Bodycare&tag=scrub" },
          { label: "Bath & Soak", href: "/shop?subtype=Bodycare&tag=bath" },
        ]},
      ],
    },
    {
      label: "K-Beauty", href: "/shop?origin=Korea", order: 4,
      columns: [
        { heading: "Top K-Brands", links: [
          { label: "COSRX", href: "/shop?brand=COSRX" },
          { label: "Beauty of Joseon", href: "/shop?brand=Beauty of Joseon" },
          { label: "ANUA", href: "/shop?brand=ANUA" },
          { label: "Medicube", href: "/shop?brand=Medicube" },
          { label: "Innisfree", href: "/shop?brand=Innisfree" },
          { label: "Laneige", href: "/shop?brand=Laneige" },
        ]},
        { heading: "K-Beauty Edits", links: [
          { label: "Glass Skin Routine", href: "/shop?tag=glass-skin" },
          { label: "Cult Favorites", href: "/shop?filter=bestseller&origin=Korea" },
          { label: "Sheet Masks", href: "/shop?tag=mask&origin=Korea" },
          { label: "Snail Mucin", href: "/shop?tag=snail-mucin" },
          { label: "Korean Sunscreen", href: "/shop?subtype=Sunscreen&origin=Korea" },
        ]},
      ],
      feature: { title: "Seoul Edit", description: "Discover the Korean rituals taking over your feed.", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=500&fit=crop", href: "/shop?origin=Korea", cta: "Shop K-Beauty" },
    },
    {
      label: "Dubai Edit", href: "/shop?origin=Dubai", order: 5,
      columns: [
        { heading: "Food & Sweets", links: [
          { label: "Premium Dates", href: "/shop?subtype=Dates" },
          { label: "Chocolates", href: "/shop?subtype=Sweets" },
          { label: "Arabic Sweets", href: "/shop?subtype=Sweets&tag=arabic" },
          { label: "Gift Boxes", href: "/shop?tag=gift" },
        ]},
        { heading: "Featured Brands", links: [
          { label: "Bateel", href: "/shop?brand=Bateel" },
          { label: "Patchi", href: "/shop?brand=Patchi" },
          { label: "Al Nassma", href: "/shop?brand=Al Nassma" },
        ]},
      ],
      feature: { title: "Taste of Arabia", description: "Hand-selected Dubai delicacies, lovingly packaged.", image: "https://images.unsplash.com/photo-1601493700518-4f9f5a8fcb3a?w=400&h=500&fit=crop", href: "/shop?origin=Dubai", cta: "Explore Dubai" },
    },
    { label: "Subscriptions", href: "/subscriptions", order: 6 },
    { label: "Pre-Order", href: "/pre-order", highlight: true, order: 7 },
  ];
  await NavMenu.insertMany(navMenuData);

  console.log("✓ Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
