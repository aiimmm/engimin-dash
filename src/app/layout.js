import { AppProviders } from "@/providers/AppProviders";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// export const metadata = {
//   title: {
//     default: "EngiFlow — Work Order Engineering",
//     template: "%s · EngiFlow",
//   },
//   description: "Engineering work order operations center.",
// };

export const metadata = {
  // ── DASAR ──────────────────────────────────────────────────
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EngiMin Dashboard",
    template: "%s | EngiMin",
  },
  description: "Engineering work order operations center.",
  keywords: [
    "engiMin",
    "engiMin dashboard",
    "engiMin dashboard workorder",
    "engiMin dashboard workorder manager",
    "workorder",
    "workorder manager",
    "workorder dashboard",
    "workorder management",
    "workorder tracking",
    "workorder system",
    "workorder software",
  ],
  creator: "JossJiss",
  publisher: "JossJiss",

  // ── CANONICAL & ROBOTS ─────────────────────────────────────
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── OPEN GRAPH ─────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: BASE_URL,
    siteName: "EngiMin Dashboard",
    title: "EngiMin Dashboard",
    description: "Engineering work order operations center.",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "EngiMin Dashboard",
        type: "image/jpg",
      },
    ],
  },

  // ── TWITTER / X ────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "EngiMin Dashboard",
    description: "Engineering work order operations center.",
    images: ["/images/og-default.jpg"],
  },

  // ── FAVICON — semua file ada di /public/favicon/ ───────────
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  // ── WEB APP MANIFEST ───────────────────────────────────────
  manifest: "/favicon/site.webmanifest",

  // ── LAINNYA ────────────────────────────────────────────────
  applicationName: "Daily Notes Workorder",
  category: "productivity",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "oklch(14.7% 0.004 49.25)",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "oklch(14.7% 0.004 49.25)",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="dark"
      data-default-theme="dark"
      data-dark-theme="dark"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
