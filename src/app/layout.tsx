import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import "./globals.css";
import { VideoProvider } from "@/context/VideoContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from "@/contexts/SessionContext";
import AppShell from "@/components/layout/AppShell";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authSession = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable} antialiased`}>
        <AuthProvider session={authSession}>
          <SessionProvider>
            <VideoProvider channelId={process.env.YOUTUBE_CHANNEL_ID || ''}>
              <AppShell>
                {children}
              </AppShell>
            </VideoProvider>
          </SessionProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
