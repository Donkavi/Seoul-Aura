import mongoose, { Schema, Document } from "mongoose";

export interface IHeroSlide {
  url: string;
  type: "image" | "video";
  label: string;
}

export interface IVideoShowcase {
  videoUrl: string;
  posterUrl: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
}

export interface ISettings extends Document {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  announcementText: string;
  announcementEnabled: boolean;
  currencyCode: string;
  currencySymbol: string;
  shippingFee: number;
  freeShippingThreshold: number;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  tiktokUrl: string;
  heroSlides: IHeroSlide[];
  videoShowcase: IVideoShowcase;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    label: { type: String, default: "" },
  },
  { _id: false }
);

const VideoShowcaseSchema = new Schema<IVideoShowcase>(
  {
    videoUrl: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    badge: { type: String, default: "The Seoul Aura Ritual" },
    title: { type: String, default: "Skincare is a" },
    highlight: { type: String, default: "love language." },
    description: { type: String, default: "Slow mornings, glass skin, and the quiet luxury of authentic Korean rituals — now within reach." },
    cta1Label: { type: String, default: "Shop The Ritual" },
    cta1Href: { type: String, default: "/shop?origin=Korea" },
    cta2Label: { type: String, default: "Discover Subscriptions" },
    cta2Href: { type: String, default: "/subscriptions" },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "Seoul Aura" },
    storeEmail: { type: String, default: "" },
    storePhone: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    announcementText: { type: String, default: "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY" },
    announcementEnabled: { type: Boolean, default: true },
    currencyCode: { type: String, default: "LKR" },
    currencySymbol: { type: String, default: "Rs." },
    shippingFee: { type: Number, default: 350 },
    freeShippingThreshold: { type: Number, default: 5000 },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    tiktokUrl: { type: String, default: "" },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    videoShowcase: { type: VideoShowcaseSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
