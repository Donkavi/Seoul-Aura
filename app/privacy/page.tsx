import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Seoul Aura",
  description: "How Seoul Aura collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "June 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="border-b border-ink-100 py-14 lg:py-20 bg-gradient-to-br from-rose-50 via-white to-rose-50/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">Legal</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-ink-500">Last updated · {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 lg:px-8 py-14 lg:py-20 space-y-12">
        <Intro>
          At Seoul Aura, we respect your privacy and are committed to protecting your personal
          information. This policy explains what we collect, why, and how we keep it safe.
        </Intro>

        <Section n="1" title="Information We Collect">
          <P>We collect information you provide directly to us, including:</P>
          <Ul items={[
            "Your name, email address, and phone number",
            "Delivery address and order details",
            "Pre-order requests (brands, products, quantities, and chosen payment method)",
            "Email address when you subscribe to our newsletter",
          ]} />
        </Section>

        <Section n="2" title="How We Use Your Information">
          <P>We use your information to:</P>
          <Ul items={[
            "Process and deliver your orders and pre-orders",
            "Confirm pricing and availability for pre-order requests",
            "Send order, pre-order, and delivery updates",
            "Send promotional emails and new-arrival announcements (only if you subscribe)",
            "Respond to your questions and provide customer support",
          ]} />
        </Section>

        <Section n="3" title="Newsletter & Notifications">
          <P>When you subscribe to our newsletter, we store your email address to send you new
          releases, special offers, and curated stories. You can unsubscribe at any time by
          contacting us — we&apos;ll remove you from our list promptly.</P>
        </Section>

        <Section n="4" title="Payment Information">
          <P>For pre-order deposits and bank transfers, payment is handled directly between you and
          our bank — we do not store your card or banking credentials. Cash on Delivery payments are
          collected at the point of delivery.</P>
        </Section>

        <Section n="5" title="Sharing Your Information">
          <P>We do not sell or rent your personal information. We only share it with trusted partners
          who help us operate — such as delivery couriers and email service providers — and only to
          the extent needed to fulfil your order.</P>
        </Section>

        <Section n="6" title="Data Security">
          <P>We take reasonable measures to protect your information. While no method of transmission
          over the internet is 100% secure, we work to safeguard your data and limit access to it.</P>
        </Section>

        <Section n="7" title="Your Rights">
          <P>You may request access to, correction of, or deletion of your personal data at any time.
          To make a request, contact us using the details below.</P>
        </Section>

        <Section n="8" title="Contact Us">
          <P>For any privacy questions or requests, reach us at{" "}
            <a href="mailto:seoulaurateam@gmail.com" className="text-rose-600 hover:underline">seoulaurateam@gmail.com</a>{" "}
            or on{" "}
            <a href="https://wa.me/94778362755" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">WhatsApp</a>.
          </P>
        </Section>

        <p className="text-xs text-ink-400 pt-6 border-t border-ink-100">
          See also our{" "}
          <Link href="/terms" className="text-rose-600 hover:underline">Terms of Service</Link>{" "}
          — including our full Pre-Order Policy.
        </p>
      </section>
    </div>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-ink-600 leading-relaxed">{children}</p>;
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-900 mb-4 flex items-baseline gap-3">
        <span className="text-rose-300 text-lg font-normal">{n}.</span> {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-600 leading-relaxed">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-ink-600 leading-relaxed">
          <span className="text-rose-400 mt-1.5 w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
