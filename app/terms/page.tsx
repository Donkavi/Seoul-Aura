import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Seoul Aura",
  description: "Terms of service, ordering, payments, and our pre-order policy.",
};

const LAST_UPDATED = "June 2026";

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="border-b border-ink-100 py-14 lg:py-20 bg-gradient-to-br from-rose-50 via-white to-rose-50/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">Legal</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-ink-500">Last updated · {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 lg:px-8 py-14 lg:py-20 space-y-12">
        <Intro>
          Welcome to Seoul Aura. By browsing our store, placing an order, or submitting a pre-order
          request, you agree to the terms below. Please read them carefully — especially our
          Pre-Order Policy.
        </Intro>

        <Section n="1" title="Orders & Pricing">
          <P>All product prices are listed in Sri Lankan Rupees (LKR) and include applicable charges
          unless stated otherwise. We reserve the right to correct any pricing errors and to update
          prices at any time before an order is confirmed.</P>
          <P>Placing an order or pre-order request does not guarantee stock. We will confirm
          availability before processing your order.</P>
        </Section>

        {/* ── Pre-Order Policy (highlighted) ── */}
        <div className="bg-rose-50/60 border border-rose-100 rounded-sm p-6 lg:p-8 scroll-mt-24" id="pre-order-policy">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-2">Important</p>
          <h2 className="font-display text-2xl lg:text-3xl text-ink-900 mb-5">Pre-Order Policy</h2>

          <div className="space-y-5">
            <PolicyStep n="1" title="Submit your request">
              Tell us the brand, product, and quantity you want. You can add as many items as you like.
              There is <strong>no commitment and no payment</strong> at this stage.
            </PolicyStep>

            <PolicyStep n="2" title="We confirm within 2 business days">
              Our team reviews your request, sources it from authentic suppliers, and confirms your
              order <strong>within 2 business days</strong>. We&apos;ll let you know which items are
              available and share the final pricing.
            </PolicyStep>

            <PolicyStep n="3" title="Pay a 25% deposit to lock it in">
              Once confirmed, a <strong>25% deposit of the total bill is required via bank transfer</strong> to
              lock in your order. Your order is only secured after the deposit is received.
            </PolicyStep>

            <PolicyStep n="4" title="Pay the balance & receive your order">
              The remaining <strong>75% balance</strong> can be paid by <strong>Cash on Delivery</strong> or
              <strong> Bank Transfer</strong> — whichever you choose at request time. Korean items typically
              arrive within <strong>2–3 weeks</strong> from confirmation and are shipped straight to you.
            </PolicyStep>
          </div>

          <div className="mt-6 pt-5 border-t border-rose-100 space-y-2.5 text-sm text-ink-600 leading-relaxed">
            <p>• <strong>Estimated totals</strong> shown at request time are based on current listed prices.
            Final pricing is confirmed within 48 hours and may change based on supplier rates and exchange rates.</p>
            <p>• A <strong>delivery charge</strong> applies and is added to your total at confirmation.</p>
            <p>• If an item becomes <strong>unavailable</strong>, it is removed from your order and excluded
            from the total — you only pay for items we can source.</p>
            <p>• The <strong>25% deposit must be paid by bank transfer.</strong> Only the balance may be paid by
            Cash on Delivery.</p>
            <p>• No payment is taken until you approve the confirmed quote. You may walk away before paying the
            deposit at no cost.</p>
          </div>
        </div>

        <Section n="2" title="Payments">
          <P>We accept <strong>Cash on Delivery</strong> and <strong>Bank Transfer</strong>. Pre-order deposits
          (25%) must be paid by bank transfer. Bank details are shared once your order is confirmed.</P>
        </Section>

        <Section n="3" title="Shipping & Delivery">
          <P>We deliver islandwide across Sri Lanka, typically within 2–5 business days for in-stock items.
          Pre-ordered and imported items follow the timelines described in our Pre-Order Policy above.</P>
        </Section>

        <Section n="4" title="Cancellations & Changes">
          <P>For in-stock orders, contact us within 24 hours of placing your order and we&apos;ll do our best
          to help. For pre-orders, you may cancel any time before paying the deposit. Once a deposit is paid,
          cancellations are handled case-by-case as the sourcing process has already begun.</P>
        </Section>

        <Section n="5" title="Product Authenticity">
          <P>Every product we sell is 100% authentic, sourced directly from Korea or authorized distributors.
          If you receive a damaged or incorrect item, contact us immediately.</P>
        </Section>

        <Section n="6" title="Contact Us">
          <P>Questions about these terms or your order? Reach us at{" "}
            <a href="mailto:seoulaurateam@gmail.com" className="text-rose-600 hover:underline">seoulaurateam@gmail.com</a>{" "}
            or on{" "}
            <a href="https://wa.me/94778362755" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">WhatsApp</a>.
          </P>
        </Section>

        <p className="text-xs text-ink-400 pt-6 border-t border-ink-100">
          See also our{" "}
          <Link href="/privacy" className="text-rose-600 hover:underline">Privacy Policy</Link>.
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

function PolicyStep({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div>
        <h3 className="font-display text-lg text-ink-900 leading-snug">{title}</h3>
        <p className="text-sm text-ink-600 leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  );
}
