'use client';

import { AppProviders } from '@/app/app-providers';

export default function YoTreasuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <div className="min-h-screen bg-yo-black font-yo text-white">
        {children}
      </div>
    </AppProviders>
  );
}
