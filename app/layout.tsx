import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import PublicChrome from "@/components/layout/PublicChrome";
import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Seoul Aura | Premium Korean Imports",
  description:
    "Discover authentic Korean beauty products. Curated imports, subscription boxes, and more.",
  keywords: ["korean cosmetics", "dubai food", "k-beauty", "import shop", "subscription box"],
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
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
      </body>
    </html>
  );
}
