import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { CartProvider } from '@/contexts/CartContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tdsupply.ro'),
  title: {
    default: 'TD Supply — Furnizor Premium Materiale Dentare & Stomatologice',
    template: '%s | TD Supply',
  },
  description:
    'Distribuitor B2B oficial de consumabile stomatologice, echipamente și materiale dentare premium în România. Implanturi, biomateriale, instrumentar medical și dezinfectanți cu livrare rapidă din stoc.',
  keywords: 'materiale dentare, consumabile stomatologice, implanturi dentare, echipamente cabinet stomatologic, clinica stomatologica, distribuitor stomatologie Romania, TD Supply, dental supply',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'TD Supply — Materiale Stomatologice & Consumabile Dentare',
    description: 'Distribuitor B2B oficial de consumabile stomatologice, echipamente și materiale dentare premium. Livrare rapidă în toată România.',
    url: './',
    siteName: 'TD Supply',
    locale: 'ro_RO',
    type: 'website',
  },
  alternates: {
    canonical: './',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <UserProvider>
          <CartProvider>{children}</CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
