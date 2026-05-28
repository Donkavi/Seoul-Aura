import Link from "next/link";
import { Check, Sparkles, Gift, Crown, Calendar } from "lucide-react";
import type { SubscriptionPlan } from "@/types";
import { connectDB } from "@/lib/mongodb";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";

async function getPlans(): Promise<SubscriptionPlan[]> {
  try {
    await connectDB();
    const plans = await SubscriptionPlanModel.find({ active: true }).sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(plans));
  } catch {
    return [];
  }
}

const benefits = [
  { icon: Gift, title: "Curated Surprise", text: "Every box is hand-picked by our team of curators." },
  { icon: Sparkles, title: "Exclusive Products", text: "Access items not available in our regular shop." },
  { icon: Crown, title: "Skip Anytime", text: "Pause, skip a month, or cancel — all online." },
  { icon: Calendar, title: "Monthly Delivery", text: "Delivered on the 1st of every month." },
];

export default async function SubscriptionsPage() {
  const plans = await getPlans();

  return (
    <>
      <section className="bg-gradient-to-br from-rose-50 via-white to-rose-100/40 py-16 lg:py-24 overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <p className="section-subtitle text-rose-600 mb-3">Monthly Subscription</p>
          <h1 className="font-display text-5xl lg:text-7xl font-medium text-ink-900 mb-5 leading-tight">
            A curated <span className="italic text-rose-600">surprise</span>
            <br />on your doorstep
          </h1>
          <p className="text-base lg:text-lg text-ink-600 max-w-2xl mx-auto leading-relaxed">
            Discover the world of Korean beauty and Dubai delicacies with our monthly subscription
            boxes. Hand-curated. Authentic. Delivered with love.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {plans.length === 0 ? (
            <p className="text-center text-ink-400 text-sm py-16">No subscription plans available right now.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, idx) => (
                <article
                  key={plan._id}
                  className={`relative bg-white border-2 rounded-sm p-7 flex flex-col transition-all duration-300 hover:shadow-card-hover group ${
                    plan.featured
                      ? "border-rose-600 lg:scale-105 shadow-rose"
                      : "border-ink-100 hover:border-rose-300"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {plan.badge && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] uppercase tracking-widest font-semibold rounded-full ${
                        plan.featured ? "bg-rose-600 text-white" : "bg-ink-900 text-white"
                      }`}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold mb-2">
                      {plan.origin}
                    </p>
                    <h3 className="font-display text-2xl font-medium text-ink-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-ink-500 leading-relaxed min-h-[3rem]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl text-ink-900">
                        Rs. {plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-ink-400">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
                        <Check
                          size={14}
                          className={`mt-0.5 flex-shrink-0 ${
                            plan.featured ? "text-rose-600" : "text-ink-400"
                          }`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/checkout?plan=${plan._id}`}
                    className={`text-center py-3 px-5 text-sm font-medium tracking-wide transition-colors ${
                      plan.featured
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white"
                    }`}
                  >
                    Subscribe Now
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-ink-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-rose-300 mb-3">Why Subscribe</p>
            <h2 className="font-display text-4xl lg:text-5xl font-medium">
              Membership <span className="italic text-rose-300">perks</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-rose-600/10 border border-rose-600/30 rounded-full flex items-center justify-center">
                  <b.icon size={22} className="text-rose-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl mb-2">{b.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-rose-25/50">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl text-ink-900 mb-4">
            Frequently Asked
          </h2>
          <div className="space-y-4 text-left mt-10">
            {[
              {
                q: "When will I be billed?",
                a: "You'll be charged on the day you subscribe, and on the same date each subsequent month.",
              },
              {
                q: "Can I skip a month?",
                a: "Yes — log into your account anytime before the 25th of the month to skip the next box.",
              },
              {
                q: "What if I'm allergic to something?",
                a: "Share your skin profile during checkout and we'll customize accordingly. We honor strict no-fragrance and no-fragrance requests.",
              },
              {
                q: "Do you ship outside Sri Lanka?",
                a: "We currently ship islandwide. International expansion coming in 2026!",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="bg-white border border-ink-100 rounded-sm p-5 group cursor-pointer hover:border-rose-200 transition-colors"
              >
                <summary className="font-medium text-ink-900 cursor-pointer flex items-center justify-between list-none">
                  {item.q}
                  <span className="text-rose-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-sm text-ink-600 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
