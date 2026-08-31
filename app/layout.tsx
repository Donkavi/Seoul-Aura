import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import PublicChrome from "@/components/layout/PublicChrome";
import AuthProvider from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Seoul Aura | Premium Korean Imports",
  description:
    "Discover authentic Korean beauty products. Curated imports, subscription boxes, and more.",
  keywords: ["korean cosmetics", "dubai food", "k-beauty", "import shop", "subscription box"],
  // Sized variants let the browser pick the right file instead of downscaling a
  // 512px image into a 16px tab icon, which is what blurred the favicon before.
  icons: {
    icon: [
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
    title: "Seoul Aura | Premium Korean Imports",
    description: "Curated Korean beauty specialty imports delivered to your door.",
    type: "website",
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
