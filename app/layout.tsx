import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Importiamo i componenti necessari
import Navbar from "@/components/Navbar"; 
import IdleTimer from "@/components/IdleTimer"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Missione Pera 🍐",
  description: "Il centro di comando per l'addio al celibato più epico di sempre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. Avvolgiamo tutto il contenuto con IdleTimer. 
          In questo modo il controllo dell'inattività sarà attivo su ogni pagina.
        */}
        <IdleTimer>
          {/* La Navbar apparirà fissa in alto in ogni pagina */}
          <Navbar /> 
          
          {/* Qui verranno visualizzati i contenuti delle singole pagine (Home, Attività, etc.) */}
          {children}
        </IdleTimer>
      </body>
    </html>
  );
}