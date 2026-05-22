import type { Metadata } from "next";
import { Noto_Sans_TC, Playfair_Display } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const notoSansTc = Noto_Sans_TC({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const playfairDisplay = Playfair_Display({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "家族旅遊行程",
  description: "Family trip planner — itinerary, bookings, wishlist, map, and photos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${notoSansTc.variable} ${playfairDisplay.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
