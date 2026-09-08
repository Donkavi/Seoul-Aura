"use client";

import { useEffect, useState } from "react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";

/** Matches the footer's fallback so the two never point at different numbers. */
const FALLBACK_NUMBER = "94778362755";

/**
 * Floating WhatsApp button, bottom-left.
 *
 * Sits opposite the Ask Aura launcher so the two never overlap, and reads its
 * number from the same `whatsappNumber` setting the footer uses — changing it in
 * admin moves both.
 */
export default function WhatsAppFab() {
  const [number, setNumber] = useState(FALLBACK_NUMBER);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error && data.whatsappNumber) setNumber(data.whatsappNumber);
      })
      .catch(() => {});
  }, []);

  const href = `https://wa.me/${(number || FALLBACK_NUMBER).replace(/[^0-9]/g, "")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "group fixed bottom-5 left-5 z-40 flex items-center gap-2.5 h-14 rounded-full",
        "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-card hover:shadow-card-hover",
        // Collapsed to a circle; widens into a labelled pill on hover, which is
        // pointer-only behaviour — on touch the circle is the whole control.
        "w-14 justify-center transition-all duration-500 sm:hover:w-[196px] sm:hover:justify-start sm:hover:pl-4"
      )}
    >
      <span className="relative flex items-center justify-center flex-shrink-0">
        {/* Slow halo, the same idle pulse the chat launcher uses. */}
        <span className="absolute inline-flex h-9 w-9 rounded-full bg-white/30 animate-ping" />
        <WhatsAppIcon size={22} className="relative" />
      </span>
      <span className="hidden sm:block overflow-hidden whitespace-nowrap max-w-0 sm:group-hover:max-w-[140px] transition-all duration-500 text-[10px] uppercase tracking-[0.18em] font-semibold">
        WhatsApp Us
      </span>
    </a>
  );
}
