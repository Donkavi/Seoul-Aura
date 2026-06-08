import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import type { IAboutPage } from "@/models/Settings";

const DEFAULT_ABOUT: IAboutPage = {
  heroTitle: "Our Story",
  heroSubtitle: "Bringing Seoul to Your Doorstep",
  heroImage: "",
  story:
    "Seoul Aura was born from a deep love for Korean beauty and a desire to share it with Sri Lanka. We believe that great skincare is not a luxury — it's a ritual, a form of self-care that everyone deserves. Our founders traveled to Seoul, discovered the transformative power of authentic K-Beauty, and came home with a mission: to make these products accessible to every skincare lover on the island. From glass-skin essences to gentle cleansers, every product on our shelves is handpicked, verified for authenticity, and shipped with care.",
  mission: "To make authentic K-Beauty accessible to everyone in Sri Lanka.",
  value1Title: "Authentic",
  value1Desc: "100% genuine products sourced directly from Korea",
  value2Title: "Curated",
  value2Desc: "Hand-picked by our K-Beauty experts",
  value3Title: "Delivered",
  value3Desc: "Fast islandwide delivery across Sri Lanka",
};

async function getAboutSettings(): Promise<IAboutPage> {
  try {
    await connectDB();
    const doc = await Settings.findOne().lean<{ aboutPage?: Partial<IAboutPage> }>();
    if (!doc?.aboutPage) return DEFAULT_ABOUT;
    return { ...DEFAULT_ABOUT, ...doc.aboutPage };
  } catch {
    return DEFAULT_ABOUT;
  }
}

const VALUES_ICONS = ["✦", "✦", "✦"];

export default async function AboutPage() {
  const about = await getAboutSettings();

  const values = [
    { title: about.value1Title, desc: about.value1Desc },
    { title: about.value2Title, desc: about.value2Desc },
    { title: about.value3Title, desc: about.value3Desc },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* ── Hero ── */}
      <section className="relative bg-rose-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="lg:max-w-xl">
            <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-4">
              EST. 2026
            </p>
            <h1 className="font-display text-5xl lg:text-6xl text-ink-900 leading-tight mb-5">
              {about.heroTitle}
            </h1>
            <p className="text-lg text-ink-500 leading-relaxed">
              {about.heroSubtitle}
            </p>
          </div>
        </div>

        {about.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={about.heroImage}
            alt="Seoul Aura hero"
            className="absolute inset-y-0 right-0 w-1/2 h-full object-cover hidden lg:block"
            onError={() => {}}
          />
        )}

        {/* Decorative blob */}
        <div
          aria-hidden
          className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-rose-100 opacity-40 blur-3xl pointer-events-none"
        />
      </section>

      {/* ── Story ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-4">
            EST. 2026
          </p>
          <h2 className="font-display text-3xl lg:text-4xl text-ink-900 mb-8">
            How We Started
          </h2>
          <p className="text-base text-ink-500 leading-loose">{about.story}</p>
        </div>
      </section>

      {/* ── Mission Banner ── */}
      <section className="bg-rose-600 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-200 font-semibold mb-6">
            Our Mission
          </p>
          <p className="font-display text-2xl lg:text-4xl text-white italic leading-relaxed">
            &ldquo;{about.mission}&rdquo;
          </p>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">
              What We Stand For
            </p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink-900">
              Our Values
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div
                key={i}
                className="group border border-ink-100 rounded-sm p-8 hover:border-rose-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-5 text-rose-600 font-display text-lg group-hover:bg-rose-100 transition-colors">
                  {VALUES_ICONS[i]}
                </div>
                <h3 className="font-display text-xl text-ink-900 mb-3">{v.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-ink-50 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl lg:text-3xl text-ink-900 mb-4">
            Ready to Start Your K-Beauty Journey?
          </h2>
          <p className="text-sm text-ink-500 mb-8">
            Browse our curated collection of authentic Korean skincare, haircare, and more.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 bg-rose-600 text-white px-8 py-3 text-sm font-medium hover:bg-rose-700 transition-colors rounded-sm"
          >
            Shop Now
          </a>
        </div>
      </section>
    </div>
  );
}
