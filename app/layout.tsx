import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { authEnabled } from "@/app/lib/authConfig";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );

  // Sign-in is available only once Clerk keys are configured
  if (!authEnabled) return page;
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: { colorPrimary: "#f59e0b" },
      }}
    >
      {page}
    </ClerkProvider>
  );
}
