"use client";

import Link from "next/link";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

interface FooterSettings {
  storePhone: string;
  whatsappNumber: string;
  storeEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

const DEFAULTS: FooterSettings = {
  storePhone: "074 166 7016",
  whatsappNumber: "077 904 4891",
  storeEmail: "seoulaurateam@gmail.com",
  instagramUrl: "https://www.instagram.com/seoul_aura.lk?utm_source=qr",
  facebookUrl: "https://www.facebook.com/share/1HG2QjnAx2/?mibextid=wwXIfr",
  tiktokUrl: "https://www.tiktok.com/@seoul_aura.lk?_r=1&_t=ZS-96cI4KjvXb6",
};

export default function Footer() {
  const [info, setInfo] = useState<FooterSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setInfo({
            storePhone: data.storePhone || DEFAULTS.storePhone,
            whatsappNumber: data.whatsappNumber || DEFAULTS.whatsappNumber,
            storeEmail: data.storeEmail || DEFAULTS.storeEmail,
            instagramUrl: data.instagramUrl || DEFAULTS.instagramUrl,
            facebookUrl: data.facebookUrl || DEFAULTS.facebookUrl,
            tiktokUrl: data.tiktokUrl || DEFAULTS.tiktokUrl,
          });
        }
      })
      .catch(() => {});
  }, []);

  const socialLinks = [
    { href: info.instagramUrl, Icon: Instagram },
    { href: info.facebookUrl, Icon: Facebook },
    { href: info.tiktokUrl, Icon: TikTokIcon },
  ].filter((s) => s.href);

  const phones = [info.storePhone, info.whatsappNumber].filter(Boolean);

  return (
    <footer className="bg-ink-900 text-ink-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <h3 className="font-display text-2xl lg:text-3xl text-white mb-3 tracking-[0.2em] uppercase font-normal">
              Seoul <span className="text-[#C08A98]">Aura</span>
            </h3>
            <p className="text-sm text-ink-300 leading-relaxed mb-6 max-w-xs">
              Curated Korean beauty and Dubai specialty foods, delivered with care to your doorstep.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-ink-700 rounded-full flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link href="/about" className="hover:text-rose-300 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-rose-300 transition-colors">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-rose-300 transition-colors">Journal</Link></li>
              <li><Link href="/faq" className="hover:text-rose-300 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shipping
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link href="/shipping" className="hover:text-rose-300 transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-rose-300 transition-colors">Returns</Link></li>
              <li><Link href="/tracking" className="hover:text-rose-300 transition-colors">Track Order</Link></li>
              <li><Link href="/subscriptions" className="hover:text-rose-300 transition-colors">Subscriptions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Get In Touch
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              {phones.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Phone size={14} /> {p}
                </li>
              ))}
              {info.storeEmail && (
                <li className="flex items-center gap-2">
                  <Mail size={14} /> {info.storeEmail}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Seoul Aura · Crafted with care · All rights reserved
          </p>
          <div className="flex gap-6 text-xs text-ink-400">
            <Link href="/privacy" className="hover:text-rose-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-rose-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
