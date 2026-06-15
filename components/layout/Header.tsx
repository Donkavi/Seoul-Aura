"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, ShoppingBag, User, Heart, Menu, X, Sparkles, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";
import type { NavMenuItem } from "@/types";

export default function Header() {
  const router = useRouter();
  const { itemCount, preOrderCount, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };
  const [navItems, setNavItems] = useState<NavMenuItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const [announcement, setAnnouncement] = useState({
    text: "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY",
    enabled: true,
  });

  useEffect(() => {
    fetch("/api/nav-menu")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setNavItems(data))
      .catch(() => { });

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setAnnouncement({
            text: data.announcementText ?? "FREE SAMPLE WITH EVERY ORDER · ISLANDWIDE DELIVERY",
            enabled: data.announcementEnabled ?? true,
          });
        }
      })
      .catch(() => { });
  }, []);

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(label);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenu(null), 150);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink-100">
      {announcement.enabled && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 text-white text-xs py-2 text-center font-body tracking-wider">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={12} />
            {announcement.text}
            <Sparkles size={12} />
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} className="text-ink-800" />
          </button>

          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="Seoul Aura"
              width={700}
              height={350}
              className="h-52 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7" onMouseLeave={scheduleClose}>
            {navItems.map((item) => (
              <div
                key={item._id}
                className="relative"
                onMouseEnter={() => item.columns?.length && openMenu(item._id)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium tracking-wide transition-colors duration-200 inline-flex items-center gap-1 py-2 relative",
                    item.highlight
                      ? "text-rose-600 hover:text-rose-700"
                      : "text-ink-700 hover:text-rose-600",
                    activeMenu === item._id && "text-rose-600"
                  )}
                >
                  {item.label}
                  {item.columns?.length > 0 && <ChevronDown size={12} className="opacity-60" />}
                  {activeMenu === item._id && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-rose-600" />
                  )}
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              className="p-2 hover:text-rose-600 transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} className="text-ink-700" />
            </button>
            <Link href="/account" className="p-2 hover:text-rose-600">
              <User size={20} className="text-ink-700" />
            </Link>
            <Link href="/wishlist" className="hidden sm:block relative p-2 hover:text-rose-600">
              <Heart size={20} className="text-ink-700" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              className="relative p-2 hover:text-rose-600 transition-colors"
              onClick={openDrawer}
              aria-label="Open cart"
            >
              <ShoppingBag size={20} className="text-ink-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ink-900 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              {preOrderCount > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {preOrderCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t border-ink-100 py-4 animate-fade-in">
            <div className="relative max-w-2xl mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, ingredients..."
                className="w-full bg-ink-50 border-0 rounded-sm pl-12 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                <X size={18} className="text-ink-400" />
              </button>
            </div>
          </form>
        )}
      </div>

      {activeMenu && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full bg-white border-t border-ink-100 shadow-card animate-fade-in"
          onMouseEnter={() => openMenu(activeMenu)}
          onMouseLeave={scheduleClose}
        >
          {navItems
            .filter((i) => i._id === activeMenu && i.columns?.length)
            .map((item) => (
              <div key={item._id} className="max-w-7xl mx-auto px-8 py-10">
                <div className="grid grid-cols-12 gap-8">
                  <div className={cn("col-span-12", item.feature ? "lg:col-span-9" : "")}>
                    <div
                      className={cn(
                        "grid gap-8",
                        (item.columns?.length ?? 0) === 1 && "grid-cols-1",
                        (item.columns?.length ?? 0) === 2 && "grid-cols-2",
                        (item.columns?.length ?? 0) >= 3 && "grid-cols-3"
                      )}
                    >
                      {item.columns?.map((col) => (
                        <div key={col._id ?? col.heading}>
                          <h4 className="font-display text-lg text-ink-900 mb-4 pb-2 border-b border-ink-100">
                            {col.heading}
                          </h4>
                          <ul className="space-y-2.5">
                            {col.links.map((link) => (
                              <li key={link.label}>
                                <Link
                                  href={link.href}
                                  onClick={() => setActiveMenu(null)}
                                  className="text-sm text-ink-600 hover:text-rose-600 transition-colors inline-flex items-center group"
                                >
                                  <span className="w-0 h-px bg-rose-600 group-hover:w-3 group-hover:mr-2 transition-all" />
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.feature && (
                    <div className="hidden lg:block col-span-3">
                      <Link
                        href={item.feature.href}
                        onClick={() => setActiveMenu(null)}
                        className="block group relative overflow-hidden rounded-sm bg-rose-50"
                      >
                        <div className="aspect-[3/4] relative">
                          <img
                            src={item.feature.image}
                            alt={item.feature.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-[10px] uppercase tracking-widest text-rose-200 font-semibold mb-1">
                            Featured
                          </p>
                          <p className="font-display text-xl leading-tight mb-1">
                            {item.feature.title}
                          </p>
                          <p className="text-xs text-white/90 leading-relaxed mb-3">
                            {item.feature.description}
                          </p>
                          <span className="text-xs font-medium underline underline-offset-4 decoration-rose-300">
                            {item.feature.cta} →
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-ink-100">
              <span className="font-display text-2xl">Menu</span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {navItems.map((item) => (
                <div key={item._id} className="border-b border-ink-50">
                  {item.columns?.length ? (
                    <>
                      <button
                        onClick={() =>
                          setMobileExpanded(mobileExpanded === item._id ? null : item._id)
                        }
                        className="w-full flex items-center justify-between py-3 px-2 text-base font-medium hover:text-rose-600"
                      >
                        {item.label}
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform",
                            mobileExpanded === item._id && "rotate-180"
                          )}
                        />
                      </button>
                      {mobileExpanded === item._id && (
                        <div className="pb-3 pl-4 space-y-3 animate-fade-in">
                          {item.columns.map((col) => (
                            <div key={col._id ?? col.heading}>
                              <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1.5">
                                {col.heading}
                              </p>
                              <ul className="space-y-1.5">
                                {col.links.map((link) => (
                                  <li key={link.label}>
                                    <Link
                                      href={link.href}
                                      onClick={() => setMobileOpen(false)}
                                      className="text-sm text-ink-600 hover:text-rose-600 block py-1"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block py-3 px-2 text-base font-medium hover:text-rose-600",
                        item.highlight && "text-rose-600"
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
