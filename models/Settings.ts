import mongoose, { Schema, Document } from "mongoose";

export interface IProductBadge {
  icon: string;
  text: string;
  enabled: boolean;
}

export interface IProductAccordion {
  label: string;
  content: string;
  enabled: boolean;
}

export interface IFaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface IFaqPage {
  heading: string;
  subheading: string;
  items: IFaqItem[];
}

export interface IAboutPage {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  story: string;
  mission: string;
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
}

export interface IContactPage {
  heading: string;
  subheading: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  mapEmbed: string;
  formEnabled: boolean;
}

export interface IHeroSlide {
  url: string;
  type: "image" | "video";
  label: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaHref: string;
  align: "left" | "right";
  showText: boolean;
  showButton: boolean;
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

export interface IHomeSection {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

export interface ISettings extends Document {
  productBadges: IProductBadge[];
  productAccordions: IProductAccordion[];
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  announcementText: string;
  announcementEnabled: boolean;
  marqueeItems: string[];
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
  homeSections: IHomeSection[];
  sliderShowArrows: boolean;
  sliderShowDots: boolean;
  showMintpay: boolean;
  showKoko: boolean;
  aboutPage: IAboutPage;
  contactPage: IContactPage;
  faqPage: IFaqPage;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    label: { type: String, default: "" },
    badge: { type: String, default: "" },
    title: { type: String, default: "" },
    highlight: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    cta: { type: String, default: "" },
    ctaHref: { type: String, default: "/shop" },
    align: { type: String, enum: ["left", "right"], default: "left" },
    showText: { type: Boolean, default: true },
    showButton: { type: Boolean, default: true },
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

const AboutPageSchema = new Schema<IAboutPage>(
  {
    heroTitle: { type: String, default: "Our Story" },
    heroSubtitle: { type: String, default: "Bringing Seoul to Your Doorstep" },
    heroImage: { type: String, default: "" },
    story: {
      type: String,
      default:
        "Seoul Aura was born from a deep love for Korean beauty and a desire to share it with Sri Lanka. We believe that great skincare is not a luxury — it's a ritual, a form of self-care that everyone deserves. Our founders traveled to Seoul, discovered the transformative power of authentic K-Beauty, and came home with a mission: to make these products accessible to every skincare lover on the island. From glass-skin essences to gentle cleansers, every product on our shelves is handpicked, verified for authenticity, and shipped with care.",
    },
    mission: {
      type: String,
      default: "To make authentic K-Beauty accessible to everyone in Sri Lanka.",
    },
    value1Title: { type: String, default: "Authentic" },
    value1Desc: { type: String, default: "100% genuine products sourced directly from Korea" },
    value2Title: { type: String, default: "Curated" },
    value2Desc: { type: String, default: "Hand-picked by our K-Beauty experts" },
    value3Title: { type: String, default: "Delivered" },
    value3Desc: { type: String, default: "Fast islandwide delivery across Sri Lanka" },
  },
  { _id: false }
);

const ContactPageSchema = new Schema<IContactPage>(
  {
    heading: { type: String, default: "Get In Touch" },
    subheading: { type: String, default: "We'd love to hear from you" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    address: { type: String, default: "" },
    mapEmbed: { type: String, default: "" },
    formEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const FaqItemSchema = new Schema<IFaqItem>(
  {
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { _id: false }
);

const DEFAULT_FAQ_ITEMS: IFaqItem[] = [
  { question: "How do I place an order?", answer: "Browse our shop, add items to your cart, and proceed to checkout. We accept card payments and cash on delivery.", category: "Orders" },
  { question: "Can I cancel or change my order?", answer: "Contact us within 24 hours of placing your order and we'll do our best to help.", category: "Orders" },
  { question: "Are your products authentic?", answer: "Yes — 100%. Every product is sourced directly from Korea or authorized distributors.", category: "Products" },
  { question: "Do you have a product warranty?", answer: "We stand behind every product. If you receive a damaged or incorrect item, contact us immediately.", category: "Products" },
  { question: "How long does delivery take?", answer: "We deliver islandwide within 2–5 business days. Colombo orders are typically faster.", category: "Shipping" },
  { question: "What is the shipping fee?", answer: "Standard shipping is Rs. 350. Orders over Rs. 5,000 qualify for free shipping.", category: "Shipping" },
];

const FaqPageSchema = new Schema<IFaqPage>(
  {
    heading: { type: String, default: "Frequently Asked Questions" },
    subheading: { type: String, default: "Everything you need to know" },
    items: { type: [FaqItemSchema], default: () => DEFAULT_FAQ_ITEMS },
  },
  { _id: false }
);

const HomeSectionSchema = new Schema<IHomeSection>(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const DEFAULT_HOME_SECTIONS: IHomeSection[] = [
  { id: "hero", label: "Hero Slider", enabled: true, order: 0 },
  { id: "new-arrivals", label: "New Arrivals", enabled: true, order: 1 },
  { id: "community-stats", label: "Community Stats", enabled: true, order: 2 },
  { id: "skin-concerns", label: "Skin Concerns", enabled: true, order: 3 },
  { id: "k-beauty", label: "Best of K-Beauty", enabled: true, order: 4 },
  { id: "video-showcase", label: "Video Showcase", enabled: true, order: 5 },
  { id: "best-sellers", label: "Best Sellers", enabled: true, order: 6 },
  { id: "hair-care", label: "Hair Care", enabled: true, order: 7 },
  { id: "trending", label: "Trending Section", enabled: true, order: 8 },
  { id: "pre-order", label: "Pre-Order CTA", enabled: true, order: 9 },
  { id: "brands", label: "Brand Section", enabled: true, order: 10 },
  { id: "trust-badges", label: "Trust Badges", enabled: true, order: 11 },
  { id: "reviews", label: "Review Carousel", enabled: true, order: 12 },
  { id: "newsletter", label: "Newsletter", enabled: true, order: 13 },
];

const ProductBadgeSchema = new Schema<IProductBadge>(
  {
    icon: { type: String, default: "truck" },
    text: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductAccordionSchema = new Schema<IProductAccordion>(
  {
    label: { type: String, default: "" },
    content: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const DEFAULT_BADGES: IProductBadge[] = [
  { icon: "truck", text: "Delivery Charge LKR 350", enabled: true },
  { icon: "shield", text: "Guaranteed 100% Authentic Products", enabled: true },
  { icon: "globe", text: "Imported From {origin}", enabled: true },
  { icon: "lock", text: "Secure Payments", enabled: true },
];

const DEFAULT_ACCORDIONS: IProductAccordion[] = [
  {
    label: "Shipping Information",
    content:
      "Free islandwide shipping on orders above Rs. 5,000.\nStandard delivery: 3-5 business days · Express: 1-2 business days.\nSame-day delivery available within Colombo for orders placed before 12 PM.",
    enabled: true,
  },
  {
    label: "Ask a Question",
    content:
      "Have a question? Reach out via WhatsApp or email:\n📱 074 166 7016 · ✉️ seoulaurateam@gmail.com\nWe reply within 24 hours, Mon–Sat.",
    enabled: true,
  },
];

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "Seoul Aura" },
    storeEmail: { type: String, default: "" },
    storePhone: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    announcementText: { type: String, default: "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY" },
    announcementEnabled: { type: Boolean, default: true },
    marqueeItems: {
      type: [String],
      default: ["100% Authentic K-Beauty", "Free Shipping Over Rs. 10,000", "Free Sample with Every Order", "Islandwide Delivery", "Direct From Seoul"],
    },
    currencyCode: { type: String, default: "LKR" },
    currencySymbol: { type: String, default: "Rs." },
    shippingFee: { type: Number, default: 350 },
    freeShippingThreshold: { type: Number, default: 5000 },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    tiktokUrl: { type: String, default: "" },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    sliderShowArrows: { type: Boolean, default: true },
    sliderShowDots: { type: Boolean, default: true },
    showMintpay: { type: Boolean, default: true },
    showKoko: { type: Boolean, default: true },
    videoShowcase: { type: VideoShowcaseSchema, default: () => ({}) },
    homeSections: { type: [HomeSectionSchema], default: () => DEFAULT_HOME_SECTIONS },
    aboutPage: { type: AboutPageSchema, default: () => ({}) },
    contactPage: { type: ContactPageSchema, default: () => ({}) },
    faqPage: { type: FaqPageSchema, default: () => ({}) },
    productBadges: { type: [ProductBadgeSchema], default: () => DEFAULT_BADGES },
    productAccordions: { type: [ProductAccordionSchema], default: () => DEFAULT_ACCORDIONS },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
