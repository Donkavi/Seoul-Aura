"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
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
  storePhone: "+821066390309",
  whatsappNumber: "94778362755",
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
      .catch(() => { });
  }, []);

  const whatsappHref = info.whatsappNumber
    ? `https://wa.me/${info.whatsappNumber.replace(/[^0-9]/g, "")}`
    : "https://wa.me/94778362755";

  const socialLinks = [
    { href: info.instagramUrl, Icon: Instagram },
    { href: info.facebookUrl, Icon: Facebook },
    { href: info.tiktokUrl, Icon: TikTokIcon },
    { href: whatsappHref, Icon: WhatsAppIcon },
  ].filter((s) => s.href);

  const phones = [info.whatsappNumber, info.storePhone].filter(Boolean);

  return (
    <footer className="bg-ink-900 text-ink-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 items-start">
          {/* Logo + Tagline + Social */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/logo_white.png"
                alt="Seoul Aura"
                width={300}
                height={150}
                className="h-44 w-auto object-contain -mt-10 -mb-8 -ml-4"
              />
            </Link>
            <p className="text-sm text-ink-300 leading-relaxed mb-5 max-w-xs">
              Curated Korean beauty, delivered with care to your doorstep.
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

          {/* Discover */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link href="/about" className="hover:text-rose-300 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-rose-300 transition-colors">Contact</Link></li>

              <li><Link href="/faq" className="hover:text-rose-300 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Get In Touch */}
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
