import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { VideoProvider } from "@/context/VideoContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <VideoProvider channelId={process.env.YOUTUBE_CHANNEL_ID || ''}>
              <Navbar />
              <main className="min-h-screen pt-14">
                {children}
              </main>
            </VideoProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
