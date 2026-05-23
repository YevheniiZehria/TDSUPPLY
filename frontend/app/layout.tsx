import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { CartProvider } from '@/contexts/CartContext';

export const metadata: Metadata = {
  title: 'TD Supply — Furnizor Premium Materiale Dentare',
  description:
    'Distribuitor B2B de materiale și echipamente stomatologice premium. Implanturi, instrumente chirurgicale, materiale de restaurare — livrare rapidă în toată România.',
  keywords: 'materiale dentare, implanturi dentare, distribuitor stomatologie, TD Supply, dental supply',
  openGraph: {
    title: 'TD Supply — Furnizor Premium Materiale Dentare',
    description: 'Distribuitor B2B de materiale și echipamente stomatologice premium.',
    type: 'website',
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
