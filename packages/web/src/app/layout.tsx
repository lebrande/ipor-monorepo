import type { Metadata } from 'next';
import '../styles/global.css';

export const metadata: Metadata = {
  title: 'DeFi Panda',
  description: 'ERC4626 Vault Analytics Dashboard',
  icons: {
    icon: '/favicon.png',
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
