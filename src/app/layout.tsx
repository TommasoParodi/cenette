import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cenette.vercel.app"),
  title: "Cenette",
  applicationName: "Cenette",
  description:
    "Crea eventi a tavola con amici e famiglia e scrivi recensioni per ogni cena: il ricordo delle serate più belle resta con te.",
  openGraph: {
    title: "Cenette",
    description:
      "Crea eventi a tavola con amici e famiglia e scrivi recensioni per ogni cena: il ricordo delle serate più belle resta con te.",
    images: [
      {
        url: "/images/illustrazione-2.jpeg",
        width: 1200,
        height: 630,
        alt: "Cenette - Cena in compagnia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cenette",
    description:
      "Crea eventi a tavola con famiglia e amici e scrivi recensioni per ogni cena: il ricordo delle serate più belle resta con te.",
    images: ["/images/illustrazione-2.jpeg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cenette",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F9FB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
