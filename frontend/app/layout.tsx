import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Propo - Premium Property Management",
  description: "Manage your properties with ease.",
};

import { AnimatedBackground } from "@/components/ui/animated-background";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <AnimatedBackground />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
