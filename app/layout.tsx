import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { authEnabled } from "@/app/lib/authConfig";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlipOS — Deal Analyzer",
  description: "Analyze fix-and-flip deals: cost stack, ROI, 70% rule, and net profit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const page = (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );

  // Sign-in is available only once Clerk keys are configured
  if (!authEnabled) return page;
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: { colorPrimary: "#3d5afe" },
      }}
    >
      {page}
    </ClerkProvider>
  );
}
