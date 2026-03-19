import type { Metadata } from 'next';
import '../styles/global.css';
import { getAppConfig } from '@/lib/app-config';

export function generateMetadata(): Metadata {
  const config = getAppConfig();
  return {
    title: config.title,
    description: config.description,
    icons: {
      icon: config.logo,
    },
  };
}

const darkModeScript = `(function(){if(localStorage.getItem('theme')!=='light')document.documentElement.classList.add('dark')})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getAppConfig();

  return (
    <html lang="en" className={config.themeClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
