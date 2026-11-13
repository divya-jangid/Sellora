
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from '../context/CartContext'
import { Toaster } from 'react-hot-toast'
import Footer from "@/components/Footer";
import { LocationProvider } from '../context/LocationContext'
import LocationModal from "@/components/LocationModal";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sellora",
  description: "Shop, sell and grow with Sellora",
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocationProvider>
          <CartProvider>
            <LocationModal/>
            <Header />
            {children}
            <Footer />
          </CartProvider>
        </LocationProvider>

        <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      </body>
    </html>
  );
}

