import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import type { IFaqItem, IFaqPage } from "@/models/Settings";

export const revalidate = 60;

const DEFAULT_FAQ: IFaqPage = {
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
};

async function getFaqSettings(): Promise<IFaqPage> {
  try {
    await connectDB();
    const doc = await Settings.findOne().lean<{ faqPage?: Partial<IFaqPage> & { items?: IFaqItem[] } }>();
    if (!doc?.faqPage) return DEFAULT_FAQ;
    return {
      ...DEFAULT_FAQ,
      ...doc.faqPage,
      items: doc.faqPage.items?.length ? doc.faqPage.items : DEFAULT_FAQ.items,
    };
  } catch {
    return DEFAULT_FAQ;
  }
}

export default async function FaqPage() {
  const faq = await getFaqSettings();

  // Group items by category, preserving insertion order
  const grouped = faq.items.reduce<Record<string, IFaqItem[]>>((acc, item) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="bg-white min-h-screen">
      {/* ── Header ── */}
      <section className="border-b border-ink-100 py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">
            FAQ
          </p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            {faq.heading}
          </h1>
          <p className="text-base text-ink-500 max-w-lg mx-auto">{faq.subheading}</p>
        </div>
      </section>

      {/* ── FAQ Content ── */}
      <section className="max-w-3xl mx-auto px-4 lg:px-8 py-16 lg:py-24">
        {categories.length === 0 ? (
          <p className="text-sm text-ink-400 italic text-center">
            No FAQ items available yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="font-display text-2xl text-ink-900 mb-6 pb-3 border-b border-ink-100">
                  {category}
                </h2>
                <div className="divide-y divide-ink-100">
                  {grouped[category].map((item, i) => (
                    <details
                      key={i}
                      className="group py-4 first:pt-0 last:pb-0"
                    >
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none select-none">
                        <span className="text-sm font-semibold text-ink-900 group-open:text-rose-600 transition-colors leading-snug">
                          {item.question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex-shrink-0 w-6 h-6 rounded-full border border-ink-200 flex items-center justify-center text-ink-400 group-open:border-rose-300 group-open:text-rose-600 group-open:bg-rose-50 transition-colors text-sm font-medium leading-none"
                        >
                          <span className="group-open:hidden">+</span>
                          <span className="hidden group-open:inline">−</span>
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-ink-500 leading-relaxed pl-0 pr-10">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
