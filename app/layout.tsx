import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import PublicChrome from "@/components/layout/PublicChrome";

export const metadata: Metadata = {
  title: "Seoul Aura | Premium Korean & Dubai Imports",
  description:
    "Discover authentic Korean beauty products and Dubai specialty foods. Curated imports, subscription boxes, and more.",
  keywords: ["korean cosmetics", "dubai food", "k-beauty", "import shop", "subscription box"],
  openGraph: {
    title: "Seoul Aura | Premium Korean & Dubai Imports",
    description: "Curated Korean beauty & Dubai specialty imports delivered to your door.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <PublicChrome>{children}</PublicChrome>
        </CartProvider>
      </body>
    </html>
  );
}
