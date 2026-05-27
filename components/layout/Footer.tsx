import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <h3 className="font-display text-3xl text-white mb-3">
              Seoul<span className="text-rose-400 italic">aura</span>
            </h3>
            <p className="text-sm text-ink-300 leading-relaxed mb-6 max-w-xs">
              Curated Korean beauty and Dubai specialty foods, delivered with care to your doorstep.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
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
              <li className="flex items-center gap-2"><Phone size={14} /> 077 339 8094</li>
              <li className="flex items-center gap-2"><Mail size={14} /> hello@seoulaura.lk</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-400">
            © 2026 Seoul Aura · Crafted with care · All rights reserved
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
