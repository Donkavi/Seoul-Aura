"use client";

import { useEffect, useState } from "react";
import {
  Save, Store, Megaphone, Truck, Share2, Check,
  Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Film, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSlide {
  url: string;
  type: "image" | "video";
  label: string;
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

interface Settings {
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
  heroSlides: HeroSlide[];
  videoShowcase: VideoShowcase;
}

const defaultSettings: Settings = {
  storeName: "Seoul Aura",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  announcementText: "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY",
  announcementEnabled: true,
  currencyCode: "LKR",
  currencySymbol: "Rs.",
  shippingFee: 350,
  freeShippingThreshold: 5000,
  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "",
  tiktokUrl: "",
  heroSlides: [],
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

  // New slide input state
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideType, setNewSlideType] = useState<"image" | "video">("image");
  const [newSlideLabel, setNewSlideLabel] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error)
          setSettings({
            ...defaultSettings,
            ...data,
            heroSlides: data.heroSlides ?? [],
            videoShowcase: { ...defaultSettings.videoShowcase, ...(data.videoShowcase ?? {}) },
          });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: unknown) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
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
        { url, type: newSlideType, label: newSlideLabel.trim() },
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

  const updateSlideField = (i: number, field: keyof HeroSlide, value: string) =>
    setSettings((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((s, idx) =>
        idx === i ? { ...s, [field]: value } : s
      ),
    }));

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

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── Left column: store settings ── */}
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
        </div>

        {/* ── Right column: Hero Slider ── */}
        <div className="space-y-6">
          <div className="bg-white border border-ink-100 rounded-sm overflow-hidden sticky top-6">
            <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
              <ImageIcon size={14} className="text-rose-600" />
              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                Homepage Slider
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-ink-500 leading-relaxed">
                Each entry replaces the background of one homepage slider slide (slide 1, 2, 3…).
                Supports image URLs and direct video file URLs (.mp4, .webm).
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
                      <div className="p-2 space-y-1.5">
                        <input
                          value={slide.label}
                          onChange={(e) => updateSlideField(i, "label", e.target.value)}
                          placeholder={`Slide ${i + 1} label (optional)`}
                          className="w-full text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                        />
                        <input
                          value={slide.url}
                          onChange={(e) => updateSlideField(i, "url", e.target.value)}
                          placeholder="https://…"
                          className="w-full text-xs border border-ink-100 rounded-sm px-2 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 font-mono"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={slide.type}
                            onChange={(e) =>
                              updateSlideField(i, "type", e.target.value)
                            }
                            className="text-xs border border-ink-100 rounded-sm px-2 py-1 text-ink-700 focus:outline-none"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSlide(i, "up")}
                              disabled={i === 0}
                              className="p-1 hover:bg-ink-50 rounded disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSlide(i, "down")}
                              disabled={i === settings.heroSlides.length - 1}
                              className="p-1 hover:bg-ink-50 rounded disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSlide(i)}
                              className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
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
