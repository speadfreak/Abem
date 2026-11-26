import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { getSettings, publicSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});
const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  display: "swap",
});
const notoSerifEthiopic = Noto_Serif_Ethiopic({
  variable: "--font-noto-serif-ethiopic",
  subsets: ["ethiopic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const home = s.seo?.home ?? { title: "Abem Restaurant", description: "", ogImage: "" };
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: home.title, template: `%s | ${s.site.name}` },
    description: home.description,
    icons: { icon: "/brand/icons/icon-192.png", apple: "/brand/icons/icon-192.png" },
    openGraph: {
      title: home.title,
      description: home.description,
      images: home.ogImage ? [{ url: home.ogImage, width: 1440, height: 720, alt: s.site.name }] : undefined,
      siteName: s.site.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: home.ogImage ? [home.ogImage] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0705",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const pub = publicSettings(settings);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${manrope.variable} ${notoEthiopic.variable} ${notoSerifEthiopic.variable}`}
    >
      <body
        className="antialiased bg-background text-foreground font-sans"
        style={
          {
            "--gold": settings.theme?.gold || "#e8a317",
            "--ember": settings.theme?.ember || "#b3261e",
          } as React.CSSProperties
        }
      >
        <AppProviders settings={pub}>{children}</AppProviders>
      </body>
    </html>
  );
}
