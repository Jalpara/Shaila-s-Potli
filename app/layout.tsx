import type {Metadata} from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { GoogleAnalytics } from '@next/third-parties/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Shaila's Potli",
  description: "Discover Shaila's Potli, a collection of handcrafted ladoos in Traditional Potlis and Eco-Friendly Boxes.",
  icons: {
    icon: "/assets/stamp.png",
    apple: "/assets/stamp.png", 
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#FAF6F0] text-[#2C2623] min-h-screen" suppressHydrationWarning>
        {children}
      </body>
      <GoogleAnalytics gaId="G-85GZJ2J6HT" />
    </html>
  );
}
