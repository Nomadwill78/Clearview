import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Navigator by Nomad Consulting",
  description: "Evaluate your nonprofit's performance, identify opportunities, and navigate your path to greater impact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
