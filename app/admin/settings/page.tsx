"use client";

import { useEffect, useState } from "react";
import {
  Save, Store, Megaphone, Truck, Share2, Check,
  Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Film, Video, LayoutGrid,
  Users, Phone, HelpCircle, ShieldCheck, List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeSection {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
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

interface HeroSlide {
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

interface VideoShowcase {
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

interface AboutPage {
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

interface ContactPage {
  heading: string;
  subheading: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  mapEmbed: string;
  formEnabled: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

interface FaqPage {
  heading: string;
  subheading: string;
  items: FaqItem[];
}

interface ProductBadge {
  icon: string;
  text: string;
  enabled: boolean;
}

interface ProductAccordion {
  label: string;
  content: string;
  enabled: boolean;
}

interface Settings {
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
  heroSlides: HeroSlide[];
  videoShowcase: VideoShowcase;
  homeSections: HomeSection[];
  sliderShowArrows: boolean;
  sliderShowDots: boolean;
  showMintpay: boolean;
  showKoko: boolean;
  aboutPage: AboutPage;
  contactPage: ContactPage;
  faqPage: FaqPage;
  productBadges: ProductBadge[];
  productAccordions: ProductAccordion[];
}

const defaultSettings: Settings = {
  storeName: "Seoul Aura",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  announcementText: "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY",
  announcementEnabled: true,
  marqueeItems: ["100% Authentic K-Beauty", "Free Shipping Over Rs. 10,000", "Free Sample with Every Order", "Islandwide Delivery", "Direct From Seoul"],
  currencyCode: "LKR",
  currencySymbol: "Rs.",
  shippingFee: 350,
  freeShippingThreshold: 5000,
  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "",
  tiktokUrl: "",
  heroSlides: [],
  homeSections: DEFAULT_HOME_SECTIONS,
  sliderShowArrows: true,
  sliderShowDots: true,
  showMintpay: true,
  showKoko: true,
  videoShowcase: {
    videoUrl: "",
    posterUrl: "",
    badge: "The Seoul Aura Ritual",
    title: "Skincare is a",
    highlight: "love language.",
    description: "Slow mornings, glass skin, and the quiet luxury of authentic Korean rituals — now within reach.",
    cta1Label: "Shop The Ritual",
    cta1Href: "/shop?origin=Korea",
    cta2Label: "Discover Subscriptions",
    cta2Href: "/subscriptions",
  },
  aboutPage: {
    heroTitle: "Our Story",
    heroSubtitle: "Bringing Seoul to Your Doorstep",
    heroImage: "",
    story:
      "Seoul Aura was born from a deep love for Korean beauty and a desire to share it with Sri Lanka. We believe that great skincare is not a luxury — it's a ritual, a form of self-care that everyone deserves. Our founders traveled to Seoul, discovered the transformative power of authentic K-Beauty, and came home with a mission: to make these products accessible to every skincare lover on the island. From glass-skin essences to gentle cleansers, every product on our shelves is handpicked, verified for authenticity, and shipped with care.",
    mission: "To make authentic K-Beauty accessible to everyone in Sri Lanka.",
    value1Title: "Authentic",
    value1Desc: "100% genuine products sourced directly from Korea",
    value2Title: "Curated",
    value2Desc: "Hand-picked by our K-Beauty experts",
    value3Title: "Delivered",
    value3Desc: "Fast islandwide delivery across Sri Lanka",
  },
  contactPage: {
    heading: "Get In Touch",
    subheading: "We'd love to hear from you",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    mapEmbed: "",
    formEnabled: true,
  },
  faqPage: {
    heading: "Frequently Asked Questions",
    subheading: "Everything you need to know",
    items: [
      { question: "How do I place an order?", answer: "Browse our shop, add items to your cart, and proceed to checkout. We accept card payments and cash on delivery.", category: "Orders" },
      { question: "Can I cancel or change my order?", answer: "Contact us within 24 hours of placing your order and we'll do our best to help.", category: "Orders" },
      { question: "Are your products authentic?", answer: "Yes — 100%. Every product is sourced directly from Korea or authorized distributors.", category: "Products" },
      { question: "Do you have a product warranty?", answer: "We stand behind every product. If you receive a damaged or incorrect item, contact us immediately.", category: "Products" },
      { question: "How long does delivery take?", answer: "We deliver islandwide within 2–5 business days. Colombo orders are typically faster.", category: "Shipping" },
      { question: "What is the shipping fee?", answer: "Standard shipping is Rs. 350. Orders over Rs. 5,000 qualify for free shipping.", category: "Shipping" },
    ],
  },
  productBadges: [
    { icon: "truck", text: "Delivery Charge LKR 350", enabled: true },
    { icon: "shield", text: "Guaranteed 100% Authentic Products", enabled: true },
    { icon: "globe", text: "Imported From {origin}", enabled: true },
    { icon: "lock", text: "Secure Payments", enabled: true },
  ],
  productAccordions: [
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
  ],
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setVS = (key: keyof VideoShowcase, value: string) =>
    setSettings((prev) => ({
      ...prev,
      videoShowcase: { ...prev.videoShowcase, [key]: value },
    }));

  const setAP = (key: keyof AboutPage, value: string) =>
    setSettings((prev) => ({
      ...prev,
      aboutPage: { ...prev.aboutPage, [key]: value },
    }));

  const setCP = (key: keyof ContactPage, value: string | boolean) =>
    setSettings((prev) => ({
      ...prev,
      contactPage: { ...prev.contactPage, [key]: value },
    }));

  const setFAQ = (key: keyof FaqPage, value: string | FaqItem[]) =>
    setSettings((prev) => ({
      ...prev,
      faqPage: { ...prev.faqPage, [key]: value },
    }));

  const addFaqItem = () =>
    setSettings((prev) => ({
      ...prev,
      faqPage: {
        ...prev.faqPage,
        items: [...prev.faqPage.items, { question: "", answer: "", category: "" }],
      },
    }));

  const removeFaqItem = (i: number) =>
    setSettings((prev) => ({
      ...prev,
      faqPage: {
        ...prev.faqPage,
        items: prev.faqPage.items.filter((_, idx) => idx !== i),
      },
    }));

  const updateFaqItem = (i: number, field: keyof FaqItem, value: string) =>
    setSettings((prev) => ({
      ...prev,
      faqPage: {
        ...prev.faqPage,
        items: prev.faqPage.items.map((item, idx) =>
          idx === i ? { ...item, [field]: value } : item
        ),
      },
    }));

  const moveFaqItem = (i: number, dir: "up" | "down") => {
    const items = [...settings.faqPage.items];
    const swap = dir === "up" ? i - 1 : i + 1;
    if (swap < 0 || swap >= items.length) return;
    [items[i], items[swap]] = [items[swap], items[i]];
    setSettings((prev) => ({ ...prev, faqPage: { ...prev.faqPage, items } }));
  };

  // Product badges helpers
  const addBadge = () =>
    setSettings((prev) => ({
      ...prev,
      productBadges: [...prev.productBadges, { icon: "truck", text: "", enabled: true }],
    }));

  const removeBadge = (i: number) =>
    setSettings((prev) => ({
      ...prev,
      productBadges: prev.productBadges.filter((_, idx) => idx !== i),
    }));

  const updateBadge = (i: number, field: keyof ProductBadge, value: string | boolean) =>
    setSettings((prev) => ({
      ...prev,
      productBadges: prev.productBadges.map((b, idx) =>
        idx === i ? { ...b, [field]: value } : b
      ),
    }));

  const moveBadge = (i: number, dir: "up" | "down") => {
    const items = [...settings.productBadges];
    const swap = dir === "up" ? i - 1 : i + 1;
    if (swap < 0 || swap >= items.length) return;
    [items[i], items[swap]] = [items[swap], items[i]];
    setSettings((prev) => ({ ...prev, productBadges: items }));
  };

  // Product accordions helpers
  const addAccordion = () =>
    setSettings((prev) => ({
      ...prev,
      productAccordions: [...prev.productAccordions, { label: "", content: "", enabled: true }],
    }));

  const removeAccordion = (i: number) =>
    setSettings((prev) => ({
      ...prev,
      productAccordions: prev.productAccordions.filter((_, idx) => idx !== i),
    }));

  const updateAccordion = (i: number, field: keyof ProductAccordion, value: string | boolean) =>
    setSettings((prev) => ({
      ...prev,
      productAccordions: prev.productAccordions.map((a, idx) =>
        idx === i ? { ...a, [field]: value } : a
      ),
    }));

  const moveAccordion = (i: number, dir: "up" | "down") => {
    const items = [...settings.productAccordions];
    const swap = dir === "up" ? i - 1 : i + 1;
    if (swap < 0 || swap >= items.length) return;
    [items[i], items[swap]] = [items[swap], items[i]];
    setSettings((prev) => ({ ...prev, productAccordions: items }));
  };

  // New slide input state
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideType, setNewSlideType] = useState<"image" | "video">("image");
  const [newSlideLabel, setNewSlideLabel] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const savedSections: HomeSection[] = data.homeSections ?? [];
          const mergedSections = DEFAULT_HOME_SECTIONS.map((def) => {
            const saved = savedSections.find((s) => s.id === def.id);
            return saved ?? def;
          });
          setSettings({
            ...defaultSettings,
            ...data,
            heroSlides: data.heroSlides ?? [],
            marqueeItems: data.marqueeItems?.length ? data.marqueeItems : defaultSettings.marqueeItems,
            videoShowcase: { ...defaultSettings.videoShowcase, ...(data.videoShowcase ?? {}) },
            homeSections: mergedSections,
            aboutPage: { ...defaultSettings.aboutPage, ...(data.aboutPage ?? {}) },
            contactPage: { ...defaultSettings.contactPage, ...(data.contactPage ?? {}) },
            faqPage: { ...defaultSettings.faqPage, ...(data.faqPage ?? {}), items: data.faqPage?.items ?? defaultSettings.faqPage.items },
            productBadges: data.productBadges?.length ? data.productBadges : defaultSettings.productBadges,
            productAccordions: data.productAccordions?.length ? data.productAccordions : defaultSettings.productAccordions,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: unknown) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Save failed: " + (data.error ?? res.statusText));
        return;
      }
      // Sync state from saved response so UI always reflects DB
      if (data.homeSections?.length) {
        const savedSections: HomeSection[] = data.homeSections;
        const mergedSections = DEFAULT_HOME_SECTIONS.map((def) => {
          const saved = savedSections.find((s) => s.id === def.id);
          return saved ?? def;
        });
        setSettings((prev) => ({ ...prev, homeSections: mergedSections }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Hero slide helpers
  const addSlide = () => {
    const url = newSlideUrl.trim();
    if (!url) return;
    setSettings((prev) => ({
      ...prev,
      heroSlides: [
        ...prev.heroSlides,
        {
          url, type: newSlideType, label: newSlideLabel.trim(),
          badge: "", title: "", highlight: "", subtitle: "", description: "",
          cta: "", ctaHref: "/shop", align: "left" as const,
          showText: true, showButton: true,
        },
      ],
    }));
    setNewSlideUrl("");
    setNewSlideLabel("");
    setNewSlideType("image");
  };

  const removeSlide = (i: number) =>
    setSettings((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, idx) => idx !== i),
    }));

  const moveSlide = (i: number, dir: "up" | "down") => {
    const slides = [...settings.heroSlides];
    const swap = dir === "up" ? i - 1 : i + 1;
    if (swap < 0 || swap >= slides.length) return;
    [slides[i], slides[swap]] = [slides[swap], slides[i]];
    setSettings((prev) => ({ ...prev, heroSlides: slides }));
  };

  const updateSlideField = (i: number, field: keyof HeroSlide, value: string | boolean) =>
    setSettings((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((s, idx) =>
        idx === i ? { ...s, [field]: value } : s
      ),
    }));

  const toggleSection = (id: string, enabled: boolean) =>
    setSettings((prev) => ({
      ...prev,
      homeSections: prev.homeSections.map((s) => s.id === id ? { ...s, enabled } : s),
    }));

  const moveSection = (id: string, dir: "up" | "down") => {
    const sorted = [...settings.homeSections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return;
    const newOrder = sorted[swap].order;
    sorted[swap] = { ...sorted[swap], order: sorted[idx].order };
    sorted[idx] = { ...sorted[idx], order: newOrder };
    setSettings((prev) => ({ ...prev, homeSections: sorted }));
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="p-16 text-center text-sm text-ink-400">Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Configuration
          </p>
          <h1 className="font-display text-4xl text-ink-900">Settings</h1>
          <p className="text-sm text-ink-500 mt-1">Store-wide configuration</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all rounded-sm",
            saved
              ? "bg-green-600 text-white"
              : "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          )}
        >
          {saved ? (
            <><Check size={14} /> Saved</>
          ) : (
            <><Save size={14} /> {saving ? "Saving…" : "Save Changes"}</>
          )}
        </button>
      </header>

      {/* ── Full-width: Homepage Sections ── */}
      <div className="mb-6 bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
          <LayoutGrid size={14} className="text-rose-600" />
          <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">Homepage Sections</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-ink-500 mb-4">
            Toggle sections on or off and reorder them using the arrows. Changes apply after saving.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
            {[...settings.homeSections]
              .sort((a, b) => a.order - b.order)
              .map((section, i, arr) => (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-sm border transition-colors",
                    section.enabled
                      ? "bg-white border-ink-100"
                      : "bg-ink-50 border-ink-100 opacity-60"
                  )}
                >
                  <div className="flex flex-col flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, "up")}
                      disabled={i === 0}
                      className="p-0.5 hover:bg-ink-100 rounded disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, "down")}
                      disabled={i === arr.length - 1}
                      className="p-0.5 hover:bg-ink-100 rounded disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-ink-400 w-4 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs text-ink-700 font-medium truncate">{section.label}</span>
                  <label className="flex items-center gap-1 cursor-pointer select-none flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => toggleSection(section.id, e.target.checked)}
                      className="accent-rose-600"
                    />
                    <span className={cn("text-[11px]", section.enabled ? "text-ink-600" : "text-ink-400")}>
                      {section.enabled ? "On" : "Off"}
                    </span>
                  </label>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Store Info */}
          <Section icon={Store} title="Store Information">
            <Field label="Store Name">
              <input
                value={settings.storeName}
                onChange={(e) => set("storeName", e.target.value)}
                className="input-field"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contact Email">
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => set("storeEmail", e.target.value)}
                  placeholder="hello@seoulaura.lk"
                  className="input-field"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  value={settings.storePhone}
                  onChange={(e) => set("storePhone", e.target.value)}
                  placeholder="+94 77 000 0000"
                  className="input-field"
                />
              </Field>
            </div>
            <Field label="Store Address">
              <textarea
                value={settings.storeAddress}
                onChange={(e) => set("storeAddress", e.target.value)}
                rows={2}
                placeholder="123 Galle Road, Colombo 03, Sri Lanka"
                className="input-field resize-none"
              />
            </Field>
          </Section>

          {/* Announcement Bar */}
          <Section icon={Megaphone} title="Announcement Bar">
            <Field label="">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={settings.announcementEnabled}
                  onChange={(e) => set("announcementEnabled", e.target.checked)}
                  className="accent-rose-600"
                />
                <span className="text-sm text-ink-700">
                  Show announcement bar at top of site
                </span>
              </label>
            </Field>
            <Field label="Announcement Text">
              <input
                value={settings.announcementText}
                onChange={(e) => set("announcementText", e.target.value)}
                placeholder="FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY"
                className="input-field"
                disabled={!settings.announcementEnabled}
              />
              <p className="text-[11px] text-ink-400 mt-1">
                Use · to separate items. Keep it short.
              </p>
            </Field>
          </Section>

          {/* Marquee Strip */}
          <Section icon={Megaphone} title="Hero Marquee Strip">
            <p className="text-xs text-ink-500 mb-3">
              Items scroll across the dark strip below the hero banner. Add, edit or remove each item.
            </p>
            <div className="space-y-2 mb-3">
              {settings.marqueeItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => {
                      const next = [...settings.marqueeItems];
                      next[i] = e.target.value;
                      set("marqueeItems", next);
                    }}
                    className="input-field flex-1"
                    placeholder="e.g. Free Shipping Over Rs. 10,000"
                  />
                  <button
                    type="button"
                    onClick={() => set("marqueeItems", settings.marqueeItems.filter((_, j) => j !== i))}
                    className="p-2 hover:bg-rose-50 text-ink-400 hover:text-rose-600 transition-colors rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("marqueeItems", [...settings.marqueeItems, ""])}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1.5 hover:bg-rose-50 transition-colors"
            >
              <Plus size={11} /> Add Item
            </button>
            <div className="mt-3 p-2 bg-ink-900 rounded-sm overflow-hidden">
              <p className="text-[10px] text-ink-400 uppercase tracking-widest mb-1.5 px-1">Preview</p>
              <p className="text-xs text-white font-medium tracking-widest uppercase truncate px-1">
                {settings.marqueeItems.map((item) => `✦ ${item}`).join(" · ")}
              </p>
            </div>
          </Section>

          {/* Shipping & Currency */}
          <Section icon={Truck} title="Shipping & Currency">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Currency Code">
                <input
                  value={settings.currencyCode}
                  onChange={(e) => set("currencyCode", e.target.value)}
                  placeholder="LKR"
                  className="input-field"
                />
              </Field>
              <Field label="Currency Symbol">
                <input
                  value={settings.currencySymbol}
                  onChange={(e) => set("currencySymbol", e.target.value)}
                  placeholder="Rs."
                  className="input-field"
                />
              </Field>
              <Field label="Shipping Fee">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={settings.shippingFee}
                    onChange={(e) => set("shippingFee", parseFloat(e.target.value) || 0)}
                    className="input-field pl-9"
                  />
                </div>
              </Field>
              <Field label="Free Shipping From">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) =>
                      set("freeShippingThreshold", parseFloat(e.target.value) || 0)
                    }
                    className="input-field pl-9"
                  />
                </div>
                <p className="text-[11px] text-ink-400 mt-1">
                  Set to 0 to disable free shipping.
                </p>
              </Field>
            </div>
          </Section>

          {/* Payment Badges */}
          <Section icon={Store} title="Payment Badges">
            <p className="text-xs text-ink-500 mb-3">
              Toggle installment payment badges shown on the product page.
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMintpay}
                  onChange={(e) => set("showMintpay", e.target.checked)}
                  className="accent-rose-600"
                />
                <span className="text-sm text-ink-700">Show <strong>Mintpay</strong> badge <span className="inline-block bg-ink-900 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold align-middle">mintpay</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showKoko}
                  onChange={(e) => set("showKoko", e.target.checked)}
                  className="accent-rose-600"
                />
                <span className="text-sm text-ink-700">Show <strong>KOKO</strong> badge <span className="inline-block bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold align-middle">KOKO</span></span>
              </label>
            </div>
          </Section>

          {/* Product Badges */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">Product Badges</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Trust badges shown on the product page below the add-to-cart buttons. Use <code className="bg-ink-100 px-1 rounded text-[11px]">{"{origin}"}</code> in text to insert the product&apos;s origin country.
              </p>
              {settings.productBadges.length === 0 ? (
                <p className="text-xs text-ink-400 italic py-3 text-center border border-dashed border-ink-200 rounded-sm">
                  No badges yet. Add one below.
                </p>
              ) : (
                <ul className="space-y-3">
                  {settings.productBadges.map((badge, i) => (
                    <li key={i} className="border border-ink-100 rounded-sm p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex-shrink-0">
                          #{i + 1}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBadge(i, "up")}
                            disabled={i === 0}
                            className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBadge(i, "down")}
                            disabled={i === settings.productBadges.length - 1}
                            className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBadge(i)}
                            className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-ink-600 mb-1 block">Icon</label>
                          <select
                            value={badge.icon}
                            onChange={(e) => updateBadge(i, "icon", e.target.value)}
                            className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                          >
                            <option value="truck">Truck</option>
                            <option value="shield">Shield</option>
                            <option value="globe">Globe</option>
                            <option value="lock">Lock</option>
                            <option value="star">Star</option>
                            <option value="package">Package</option>
                            <option value="heart">Heart</option>
                            <option value="clock">Clock</option>
                            <option value="phone">Phone</option>
                            <option value="mail">Mail</option>
                            <option value="check">Check</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-ink-600 mb-1 block">
                            Text <span className="text-ink-400 font-normal">({"{origin}"} = product origin)</span>
                          </label>
                          <input
                            value={badge.text}
                            onChange={(e) => updateBadge(i, "text", e.target.value)}
                            placeholder="e.g. Imported From {origin}"
                            className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={badge.enabled}
                          onChange={(e) => updateBadge(i, "enabled", e.target.checked)}
                          className="accent-rose-600"
                        />
                        <span className="text-xs text-ink-700">Enabled</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addBadge}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1.5 hover:bg-rose-50 transition-colors"
              >
                <Plus size={11} /> Add Badge
              </button>
              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>

          {/* Product Accordions */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <List size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">Product Accordions</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Expandable sections shown on the product page below the trust badges. The <strong>Description</strong> accordion is built-in and always appears first — only configure additional sections here.
              </p>
              {settings.productAccordions.length === 0 ? (
                <p className="text-xs text-ink-400 italic py-3 text-center border border-dashed border-ink-200 rounded-sm">
                  No accordion sections yet. Add one below.
                </p>
              ) : (
                <ul className="space-y-3">
                  {settings.productAccordions.map((accordion, i) => (
                    <li key={i} className="border border-ink-100 rounded-sm p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex-shrink-0">
                          #{i + 1}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveAccordion(i, "up")}
                            disabled={i === 0}
                            className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAccordion(i, "down")}
                            disabled={i === settings.productAccordions.length - 1}
                            className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAccordion(i)}
                            className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-ink-600 mb-1 block">Label</label>
                        <input
                          value={accordion.label}
                          onChange={(e) => updateAccordion(i, "label", e.target.value)}
                          placeholder="e.g. Shipping Information"
                          className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-ink-600 mb-1 block">Content</label>
                        <textarea
                          value={accordion.content}
                          onChange={(e) => updateAccordion(i, "content", e.target.value)}
                          placeholder="Content shown when expanded…"
                          rows={3}
                          className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 resize-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={accordion.enabled}
                          onChange={(e) => updateAccordion(i, "enabled", e.target.checked)}
                          className="accent-rose-600"
                        />
                        <span className="text-xs text-ink-700">Enabled</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addAccordion}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1.5 hover:bg-rose-50 transition-colors"
              >
                <Plus size={11} /> Add Accordion
              </button>
              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>

          {/* Social Links */}
          <Section icon={Share2} title="Social Links">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Instagram URL">
                <input
                  value={settings.instagramUrl}
                  onChange={(e) => set("instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/seoulaura"
                  className="input-field"
                />
              </Field>
              <Field label="Facebook URL">
                <input
                  value={settings.facebookUrl}
                  onChange={(e) => set("facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/seoulaura"
                  className="input-field"
                />
              </Field>
              <Field label="WhatsApp Number">
                <input
                  value={settings.whatsappNumber}
                  onChange={(e) => set("whatsappNumber", e.target.value)}
                  placeholder="+94770000000"
                  className="input-field"
                />
              </Field>
              <Field label="TikTok URL">
                <input
                  value={settings.tiktokUrl}
                  onChange={(e) => set("tiktokUrl", e.target.value)}
                  placeholder="https://tiktok.com/@seoulaura"
                  className="input-field"
                />
              </Field>
            </div>
          </Section>

          {/* ── Hero Slider ── */}
        <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <ImageIcon size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold flex-1">
                Homepage Slider
              </p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sliderShowArrows}
                  onChange={(e) => set("sliderShowArrows", e.target.checked)}
                  className="accent-rose-600"
                />
                <span className="text-xs text-ink-600">Arrows</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={settings.sliderShowDots}
                  onChange={(e) => set("sliderShowDots", e.target.checked)}
                  className="accent-rose-600"
                />
                <span className="text-xs text-ink-600">Dots</span>
              </label>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Configure each slide&apos;s media, text content, and button. Leave text fields blank to use the default slide content.
              </p>

              {/* Slide list */}
              {settings.heroSlides.length === 0 ? (
                <p className="text-xs text-ink-400 italic py-3 text-center border border-dashed border-ink-200 rounded-sm">
                  No custom media — default images are shown.
                </p>
              ) : (
                <ul className="space-y-2">
                  {settings.heroSlides.map((slide, i) => (
                    <li
                      key={i}
                      className="border border-ink-100 rounded-sm overflow-hidden"
                    >
                      {/* Preview thumbnail */}
                      <div className="relative w-full h-24 bg-ink-100">
                        {slide.type === "video" ? (
                          <video
                            src={slide.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <span className="bg-ink-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            #{i + 1}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5",
                              slide.type === "video"
                                ? "bg-blue-600/80 text-white"
                                : "bg-rose-600/80 text-white"
                            )}
                          >
                            {slide.type === "video" ? (
                              <><Film size={8} /> VIDEO</>
                            ) : (
                              <><ImageIcon size={8} /> IMAGE</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="p-3 space-y-2">
                        {/* Media row */}
                        <div className="flex gap-2">
                          <input
                            value={slide.url}
                            onChange={(e) => updateSlideField(i, "url", e.target.value)}
                            placeholder="Image / video URL…"
                            className="flex-1 text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                          />
                          <select
                            value={slide.type}
                            onChange={(e) => updateSlideField(i, "type", e.target.value)}
                            className="text-xs border border-ink-100 rounded-sm px-2 py-1 text-ink-700 focus:outline-none"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                          <select
                            value={slide.align ?? "left"}
                            onChange={(e) => updateSlideField(i, "align", e.target.value)}
                            className="text-xs border border-ink-100 rounded-sm px-2 py-1 text-ink-700 focus:outline-none"
                          >
                            <option value="left">Text Left</option>
                            <option value="right">Text Right</option>
                          </select>
                        </div>

                        {/* Visibility toggles */}
                        <div className="flex items-center gap-4 py-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.showText ?? true}
                              onChange={(e) => updateSlideField(i, "showText", e.target.checked)}
                              className="accent-rose-600"
                            />
                            <span className="text-xs text-ink-600">Show Text</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.showButton ?? true}
                              onChange={(e) => updateSlideField(i, "showButton", e.target.checked)}
                              className="accent-rose-600"
                            />
                            <span className="text-xs text-ink-600">Show Button</span>
                          </label>
                          <div className="ml-auto flex items-center gap-1">
                            <button type="button" onClick={() => moveSlide(i, "up")} disabled={i === 0} className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"><ChevronUp size={13} /></button>
                            <button type="button" onClick={() => moveSlide(i, "down")} disabled={i === settings.heroSlides.length - 1} className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"><ChevronDown size={13} /></button>
                            <button type="button" onClick={() => removeSlide(i)} className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded"><Trash2 size={13} /></button>
                          </div>
                        </div>

                        {/* Text content */}
                        <div className="border-t border-ink-50 pt-2 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">Text Content</p>
                          <input
                            value={slide.badge ?? ""}
                            onChange={(e) => updateSlideField(i, "badge", e.target.value)}
                            placeholder="Badge (e.g. New Season · K-Beauty Edit)"
                            className="w-full text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              value={slide.title ?? ""}
                              onChange={(e) => updateSlideField(i, "title", e.target.value)}
                              placeholder="Title (e.g. The Ultimate)"
                              className="text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                            />
                            <input
                              value={slide.highlight ?? ""}
                              onChange={(e) => updateSlideField(i, "highlight", e.target.value)}
                              placeholder="Highlight italic (e.g. Glow Booster)"
                              className="text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 italic"
                            />
                          </div>
                          <input
                            value={slide.subtitle ?? ""}
                            onChange={(e) => updateSlideField(i, "subtitle", e.target.value)}
                            placeholder="Subtitle (e.g. from Seoul to your skin)"
                            className="w-full text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                          />
                          <textarea
                            value={slide.description ?? ""}
                            onChange={(e) => updateSlideField(i, "description", e.target.value)}
                            placeholder="Description paragraph…"
                            rows={2}
                            className="w-full text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 resize-none"
                          />
                        </div>

                        {/* Button */}
                        <div className="border-t border-ink-50 pt-2 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">Button</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              value={slide.cta ?? ""}
                              onChange={(e) => updateSlideField(i, "cta", e.target.value)}
                              placeholder="Button label (e.g. Shop Now)"
                              className="text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                            />
                            <input
                              value={slide.ctaHref ?? ""}
                              onChange={(e) => updateSlideField(i, "ctaHref", e.target.value)}
                              placeholder="/shop or https://…"
                              className="text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add new slide */}
              <div className="border-t border-ink-100 pt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                  Add Media
                </p>
                <input
                  value={newSlideLabel}
                  onChange={(e) => setNewSlideLabel(e.target.value)}
                  placeholder="Label (e.g. K-Beauty Edit)"
                  className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                />
                <input
                  value={newSlideUrl}
                  onChange={(e) => setNewSlideUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addSlide(); }
                  }}
                  placeholder="Paste image or video URL…"
                  className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                />
                <div className="flex gap-2">
                  <select
                    value={newSlideType}
                    onChange={(e) => setNewSlideType(e.target.value as "image" | "video")}
                    className="text-xs border border-ink-100 rounded-sm px-2 py-2 text-ink-700 focus:outline-none flex-shrink-0"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <button
                    type="button"
                    onClick={addSlide}
                    disabled={!newSlideUrl.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-ink-900 text-white text-xs py-2 hover:bg-rose-600 transition-colors disabled:opacity-40 rounded-sm"
                  >
                    <Plus size={13} /> Add Slide
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-ink-400">
                Up to 4 slides shown. Extra entries are ignored.
                Hit <strong>Save Changes</strong> above to apply.
              </p>
            </div>
          </div>

          {/* Video Showcase panel */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <Video size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                Video Showcase
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                The full-screen video section mid-homepage. Leave video URL blank to hide it.
              </p>

              {/* Media URLs */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Media</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Video URL (.mp4 / .webm)</label>
                  <input
                    value={settings.videoShowcase.videoUrl}
                    onChange={(e) => setVS("videoUrl", e.target.value)}
                    placeholder="/videos/hero.mp4 or https://…"
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Poster / Fallback Image URL</label>
                  <input
                    value={settings.videoShowcase.posterUrl}
                    onChange={(e) => setVS("posterUrl", e.target.value)}
                    placeholder="https://… (shown while video loads)"
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                  />
                </div>
                {settings.videoShowcase.posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.videoShowcase.posterUrl}
                    alt="poster preview"
                    className="w-full h-24 object-cover rounded-sm border border-ink-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>

              {/* Text content */}
              <div className="space-y-2 border-t border-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Content</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Badge</label>
                  <input
                    value={settings.videoShowcase.badge}
                    onChange={(e) => setVS("badge", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Title (regular)</label>
                  <input
                    value={settings.videoShowcase.title}
                    onChange={(e) => setVS("title", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Title highlight (italic rose)</label>
                  <input
                    value={settings.videoShowcase.highlight}
                    onChange={(e) => setVS("highlight", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300 italic"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Description</label>
                  <textarea
                    value={settings.videoShowcase.description}
                    onChange={(e) => setVS("description", e.target.value)}
                    rows={3}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300 resize-none"
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2 border-t border-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Buttons</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Button 1 label</label>
                    <input
                      value={settings.videoShowcase.cta1Label}
                      onChange={(e) => setVS("cta1Label", e.target.value)}
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Button 1 link</label>
                    <input
                      value={settings.videoShowcase.cta1Href}
                      onChange={(e) => setVS("cta1Href", e.target.value)}
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Button 2 label</label>
                    <input
                      value={settings.videoShowcase.cta2Label}
                      onChange={(e) => setVS("cta2Label", e.target.value)}
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Button 2 link</label>
                    <input
                      value={settings.videoShowcase.cta2Href}
                      onChange={(e) => setVS("cta2Href", e.target.value)}
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>

          {/* ── About Page ── */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <Users size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                About Page
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Edit the content shown on the <strong>/about</strong> page.
              </p>

              <div className="space-y-2 border-b border-ink-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Hero</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Hero Title</label>
                  <input
                    value={settings.aboutPage.heroTitle}
                    onChange={(e) => setAP("heroTitle", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Hero Subtitle</label>
                  <input
                    value={settings.aboutPage.heroSubtitle}
                    onChange={(e) => setAP("heroSubtitle", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Hero Image URL</label>
                  <input
                    value={settings.aboutPage.heroImage}
                    onChange={(e) => setAP("heroImage", e.target.value)}
                    placeholder="https://… (optional)"
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 border-b border-ink-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Story & Mission</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Brand Story</label>
                  <textarea
                    value={settings.aboutPage.story}
                    onChange={(e) => setAP("story", e.target.value)}
                    rows={6}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Mission Statement</label>
                  <input
                    value={settings.aboutPage.mission}
                    onChange={(e) => setAP("mission", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Values</p>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-ink-600 mb-1 block">Value {n} Title</label>
                      <input
                        value={settings.aboutPage[`value${n}Title` as keyof AboutPage] as string}
                        onChange={(e) => setAP(`value${n}Title` as keyof AboutPage, e.target.value)}
                        className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink-600 mb-1 block">Value {n} Description</label>
                      <input
                        value={settings.aboutPage[`value${n}Desc` as keyof AboutPage] as string}
                        onChange={(e) => setAP(`value${n}Desc` as keyof AboutPage, e.target.value)}
                        className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>

          {/* ── Contact Page ── */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <Phone size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                Contact Page
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Edit the content shown on the <strong>/contact</strong> page.
              </p>

              <div className="space-y-2 border-b border-ink-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Header</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Heading</label>
                  <input
                    value={settings.contactPage.heading}
                    onChange={(e) => setCP("heading", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Subheading</label>
                  <input
                    value={settings.contactPage.subheading}
                    onChange={(e) => setCP("subheading", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div className="space-y-2 border-b border-ink-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Contact Info</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={settings.contactPage.email}
                      onChange={(e) => setCP("email", e.target.value)}
                      placeholder="hello@seoulaura.lk"
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Phone</label>
                    <input
                      value={settings.contactPage.phone}
                      onChange={(e) => setCP("phone", e.target.value)}
                      placeholder="+94 77 000 0000"
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">WhatsApp Number</label>
                    <input
                      value={settings.contactPage.whatsapp}
                      onChange={(e) => setCP("whatsapp", e.target.value)}
                      placeholder="+94770000000"
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink-600 mb-1 block">Address</label>
                    <input
                      value={settings.contactPage.address}
                      onChange={(e) => setCP("address", e.target.value)}
                      placeholder="123 Galle Road, Colombo 03"
                      className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Map & Form</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Google Maps Embed src URL</label>
                  <input
                    value={settings.contactPage.mapEmbed}
                    onChange={(e) => setCP("mapEmbed", e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=…"
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">
                    Paste the <em>src</em> URL from a Google Maps embed code.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={settings.contactPage.formEnabled}
                    onChange={(e) => setCP("formEnabled", e.target.checked)}
                    className="accent-rose-600"
                  />
                  <span className="text-sm text-ink-700">Show contact form on page</span>
                </label>
              </div>

              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>

          {/* ── FAQ Page ── */}
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <HelpCircle size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                FAQ Page
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Edit the content shown on the <strong>/faq</strong> page.
              </p>

              <div className="space-y-2 border-b border-ink-100 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Header</p>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Heading</label>
                  <input
                    value={settings.faqPage.heading}
                    onChange={(e) => setFAQ("heading", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-600 mb-1 block">Subheading</label>
                  <input
                    value={settings.faqPage.subheading}
                    onChange={(e) => setFAQ("subheading", e.target.value)}
                    className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 focus:outline-none focus:border-rose-300"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">FAQ Items</p>
                {settings.faqPage.items.length === 0 ? (
                  <p className="text-xs text-ink-400 italic py-3 text-center border border-dashed border-ink-200 rounded-sm">
                    No FAQ items yet. Add one below.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {settings.faqPage.items.map((item, i) => (
                      <li key={i} className="border border-ink-100 rounded-sm p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex-shrink-0">
                            #{i + 1}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveFaqItem(i, "up")}
                              disabled={i === 0}
                              className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFaqItem(i, "down")}
                              disabled={i === settings.faqPage.items.length - 1}
                              className="p-1 hover:bg-ink-50 rounded disabled:opacity-30"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFaqItem(i)}
                              className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-ink-600 mb-1 block">Question</label>
                          <input
                            value={item.question}
                            onChange={(e) => updateFaqItem(i, "question", e.target.value)}
                            placeholder="e.g. How do I place an order?"
                            className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-ink-600 mb-1 block">Answer</label>
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
                            placeholder="Answer text…"
                            rows={2}
                            className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-ink-600 mb-1 block">Category</label>
                          <input
                            value={item.category}
                            onChange={(e) => updateFaqItem(i, "category", e.target.value)}
                            placeholder="e.g. Orders, Shipping, Products"
                            className="w-full text-xs border border-ink-100 rounded-sm px-2.5 py-2 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1.5 hover:bg-rose-50 transition-colors"
                >
                  <Plus size={11} /> Add Item
                </button>
              </div>

              <p className="text-[10px] text-ink-400 pt-1">
                Hit <strong>Save Changes</strong> above to apply to the live site.
              </p>
            </div>
          </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
      <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
        <Icon size={14} className="text-rose-600" />
        <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      )}
      {children}
    </div>
  );
}
