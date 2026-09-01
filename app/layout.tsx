import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import PublicChrome from "@/components/layout/PublicChrome";
import AuthProvider from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Pages set only their own name; the brand suffix is appended for them.
    default: "Seoul Aura | Authentic Korean Skincare in Sri Lanka",
    template: "%s | Seoul Aura",
  },
  description:
    "Shop authentic Korean skincare and K-Beauty in Sri Lanka. Genuine COSRX, Beauty of Joseon, SKIN1004, Anua and more — imported from Seoul, delivered islandwide.",
  keywords: [
    "korean skincare sri lanka",
    "k-beauty sri lanka",
    "korean cosmetics colombo",
    "authentic korean skincare",
    "buy cosrx sri lanka",
    "beauty of joseon sri lanka",
  ],
  alternates: { canonical: "/" },
  // Sized variants let the browser pick the right file instead of downscaling a
  // 512px image into a 16px tab icon, which is what blurred the favicon before.
  icons: {
    icon: [
      // Declared first, and also present at the conventional /favicon.ico path,
      // because that is where crawlers look before reading the markup.
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/logo/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/logo/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo/favicon-32.png",
    apple: { url: "/logo/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Seoul Aura | Authentic Korean Skincare in Sri Lanka",
    description: "Genuine K-Beauty imported from Seoul, delivered islandwide across Sri Lanka.",
    type: "website",
    url: SITE_URL,
    siteName: "Seoul Aura",
    locale: "en_LK",
    // Without an image, links shared on WhatsApp and Facebook preview as bare text.
    images: [{ url: "/logo/icon-512.png", width: 512, height: 512, alt: "Seoul Aura" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seoul Aura | Authentic Korean Skincare in Sri Lanka",
    description: "Genuine K-Beauty imported from Seoul, delivered islandwide across Sri Lanka.",
    images: ["/logo/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <PublicChrome>{children}</PublicChrome>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
