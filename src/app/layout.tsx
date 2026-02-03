import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { VideoProvider } from "@/context/VideoContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Providers from "./providers";
import { Analytics } from '@vercel/analytics/next';
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "James Peralta",
  description: "I’m a Senior Software Engineer based in Silicon Valley posting videos DAILY! On this channel I share my journey in the world of software engineering to help you level up your skills and career.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable} antialiased`}>
        <Providers>
          <AuthProvider>
            <VideoProvider channelId={process.env.YOUTUBE_CHANNEL_ID || ''}>
              <Navbar />
              <div className="min-h-screen pt-14 flex flex-col">
                <main className="flex-grow">
                  {children}
                </main>
                {/* Footer hidden on AI route by h-screen overflow-hidden in ChatInterface */}
                <Footer />
              </div>
            </VideoProvider>
          </AuthProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
