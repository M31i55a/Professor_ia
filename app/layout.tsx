import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

//clerk
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from "@clerk/nextjs";


const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Converso",
  description: "Real-time AI Teaching Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider 
          appearance={{
            variables: {
              colorPrimary: '#000000'
            }
          }}
          allowedRedirectOrigins={['http://localhost:3000', 'http://localhost:3001']}
        >
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}