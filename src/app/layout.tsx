import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { VideoProvider } from "@/context/VideoContext";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coding Interviews - YouTube Channel",
  description: "Learn coding interview techniques and problem-solving strategies through detailed video tutorials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <VideoProvider channelId={process.env.YOUTUBE_CHANNEL_ID || ''}>
            <Navbar />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </VideoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
