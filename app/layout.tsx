import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GoogleProvider from "@/components/providers/GoogleProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["700", "900"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FieldSync",
  description:
    "Gestión de reservas, torneos y perfil global para canchas deportivas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-fieldsync.svg",
    apple: "/logo-fieldsync.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9F9F7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
  <OfflineProvider />
  <GoogleProvider>
    {children}
  </GoogleProvider>
</body>
    </html>
  );
}