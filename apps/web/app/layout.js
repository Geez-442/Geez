import './globals.css';

export const metadata = {
  title: 'ZETS - Zimbabwe Electronic Tender Issuing System',
  description: 'Secure, PRAZ-aligned e-procurement platform with the ZETA AI advisor.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
