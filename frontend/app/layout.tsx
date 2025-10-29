import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { HealthcareProvider } from "@/context/healthcare-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";  // NEW

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PariCare Family Dashboard",
  description: "Manage your family's health records and medications",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"           // Enables 'dark' class on <html>
          defaultTheme="system"       // Follow system preference
          enableSystem={true}
          disableTransitionOnChange   // Prevents flicker
        >
          <HealthcareProvider>
            {children}
            <Toaster />
          </HealthcareProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
