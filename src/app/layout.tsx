import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "FSK EDU AI - AI-Powered Educational Assistant",
  description: "Your comprehensive AI-powered study companion for university students. Get instant help with AI teaching, image analysis, quizzes, flashcards, and more.",
  keywords: ["FSK EDU AI", "education", "AI tutor", "university", "study assistant", "quiz", "flashcards", "AI teaching"],
  authors: [{ name: "FSK University" }],
  icons: {
    icon: "/fsk-logo.png",
  },
  openGraph: {
    title: "FSK EDU AI - AI-Powered Educational Assistant",
    description: "Comprehensive AI-powered study companion for 1000+ university students",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
