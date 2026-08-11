import './globals.css';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

export const metadata = {
  title: 'ZETS - Zimbabwe Electronic Tender Issuing System',
  description: 'Secure, PRAZ-aligned e-procurement platform with the ZETA AI advisor.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0b1220',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
