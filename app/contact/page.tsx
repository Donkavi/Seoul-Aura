import type { ElementType } from "react";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import type { IContactPage } from "@/models/Settings";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import ContactForm from "./ContactForm";

const DEFAULT_CONTACT: IContactPage = {
  heading: "Get In Touch",
  subheading: "We'd love to hear from you",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  mapEmbed: "",
  formEnabled: true,
};

async function getContactSettings(): Promise<IContactPage> {
  try {
    await connectDB();
    const doc = await Settings.findOne().lean<{ contactPage?: Partial<IContactPage> }>();
    if (!doc?.contactPage) return DEFAULT_CONTACT;
    return { ...DEFAULT_CONTACT, ...doc.contactPage };
  } catch {
    return DEFAULT_CONTACT;
  }
}

export default async function ContactPage() {
  const contact = await getContactSettings();

  const infoItems = [
    contact.email && {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact.phone && {
      icon: Phone,
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
    },
    contact.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: contact.whatsapp,
      href: `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`,
    },
    contact.address && {
      icon: MapPin,
      label: "Address",
      value: contact.address,
      href: undefined,
    },
  ].filter(Boolean) as {
    icon: ElementType;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <div className="bg-white min-h-screen">
      {/* ── Header ── */}
      <section className="border-b border-ink-100 py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">
            Contact Us
          </p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            {contact.heading}
          </h1>
          <p className="text-base text-ink-500 max-w-lg mx-auto">{contact.subheading}</p>
        </div>
      </section>

      {/* ── Two-column body ── */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20">
          {/* Left — contact info + map */}
          <div>
            <h2 className="font-display text-2xl text-ink-900 mb-8">Contact Details</h2>

            {infoItems.length === 0 ? (
              <p className="text-sm text-ink-400 italic">
                No contact information has been set yet. Check back soon.
              </p>
            ) : (
              <ul className="space-y-6">
                {infoItems.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={16} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-0.5">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-ink-700 hover:text-rose-600 transition-colors"
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-ink-700 whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Map embed */}
            {contact.mapEmbed && (
              <div className="mt-10 rounded-sm overflow-hidden border border-ink-100">
                <iframe
                  src={contact.mapEmbed}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Store location"
                />
              </div>
            )}
          </div>

          {/* Right — contact form */}
          <div>
            {contact.formEnabled ? (
              <>
                <h2 className="font-display text-2xl text-ink-900 mb-8">Send a Message</h2>
                <ContactForm recipientEmail={contact.email} />
              </>
            ) : (
              <div className="border border-ink-100 rounded-sm p-10 text-center">
                <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">
                  Contact Form
                </p>
                <p className="text-sm text-ink-500">
                  The contact form is currently unavailable. Please reach out via email or WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
