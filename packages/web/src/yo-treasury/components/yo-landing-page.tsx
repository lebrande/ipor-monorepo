'use client';

import Link from 'next/link';

const VAULT_URL = '/vaults/8453/0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D';
const CREATE_URL = '/yo-treasury/create';

export function YoLandingPage() {
  return (
    <div className="min-h-screen bg-yo-black flex flex-col items-center justify-center font-yo relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yo-neon/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-2xl">
        {/* Logo */}
        <img
          src="/assets/yo/yo_no_bg.svg"
          alt="YO"
          className="h-20 w-auto drop-shadow-[0_0_40px_rgba(214,255,52,0.3)]"
        />

        {/* Headlines */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-semibold text-white tracking-tight">
            YO Treasury
          </h1>
          <p className="text-lg md:text-xl text-yo-muted max-w-md mx-auto leading-relaxed">
            AI-powered treasury management for onchain yield. Deposit, allocate,
            and optimize across DeFi — all from one vault.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href={VAULT_URL}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-yo-neon text-black font-semibold text-base hover:bg-yo-neon/90 transition-colors"
          >
            Open App
          </Link>
          <Link
            href={CREATE_URL}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-yo-neon/30 text-yo-neon font-medium text-base hover:bg-yo-neon/10 transition-colors"
          >
            Create YO Treasury
          </Link>
        </div>
      </div>
    </div>
  );
}
