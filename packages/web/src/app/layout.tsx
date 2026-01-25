import type { Metadata } from 'next';
import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Fusion by IPOR',
  description: 'ERC4626 Vault Analytics Dashboard',
  icons: {
    icon: '/assets/logo-fusion-by-ipor.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
