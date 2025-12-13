'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const Hero = () => {
  const { resolvedTheme } = useTheme();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 via-white to-zinc-600 animate-gradient" />

      {/* Soft Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-8xl font-bold text-black">
          Fate Protocol
        </h1>

        <p className="mt-6 text-base md:text-2xl text-black max-w-3xl mx-auto">
          Decentralized perpetual prediction pools.
          <br />
          Buy and sell bullCoins and bearCoins to hedge price risk.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <HeroButton href="/createPool" label="Create Pool" />
          <HeroButton href="/explorePools" label="Explore Pools" />
          <HeroButton label="Use Pool" primary />
        </div>
      </div>
    </section>
  );
};

const HeroButton = ({
  href,
  label,
  primary
}: {
  href?: string;
  label: string;
  primary?: boolean;
}) => {
  const btn = (
    <button
      className={cn(
        'px-8 py-3 rounded-full text-lg transition-all duration-300',
        primary
          ? 'bg-white text-black hover:scale-105'
          : 'border border-black/10 text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
    >
      {label}
    </button>
  );

  return href ? <Link href={href}>{btn}</Link> : btn;
};

export default Hero;
