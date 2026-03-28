'use client';
import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="text-foreground overflow-hidden relative font-sans min-h-screen">
      
      <div className="w-full px-6 md:px-12 lg:px-24 relative z-10">

        {/* 🔥 HERO LINE */}
        <div className="mb-20">
          <h2
            style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 300 }}
            className="text-4xl md:text-5xl lg:text-7xl tracking-tight leading-[1.1]"
          >
            Understand Code.
            <span className="relative inline-block mx-3 md:mx-4 align-top">
              <span
                className="absolute inset-0 bg-[#333333] "
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #555555 1px, transparent 1px), linear-gradient(to bottom, #555555 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                  zIndex: -1,
                }}
              />
              <span className="relative z-10 px-3 md:px-5 text-white">
                Not Just Read It.
              </span>
            </span>
            <br />
            See the Flow.
          </h2>
        </div>

        {/* 🔥 CTA + LINKS */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 md:mb-32 gap-12 lg:gap-24">

          {/* CTA */}
          <div className="w-full lg:w-1/3">
            <span className="font-mono text-[12px] uppercase tracking-widest text-muted-foreground mb-8 block">
              Try DevScope
            </span>

            <div className="w-full max-w-xl bg-accent/50 border border-border rounded-full p-2 pl-6 pr-2 flex items-center justify-between gap-4 shadow-xl hover:shadow-2xl transition-all duration-300">
              <input
                type="text"
                placeholder="Paste GitHub repo / file link..."
                className="bg-transparent outline-none text-foreground placeholder-muted-foreground font-mono text-sm w-full"
              />

              <button className="bg-foreground text-background px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform duration-200 text-sm flex">
                Analyze 
              </button>
            </div>
          </div>

          {/* LINKS */}
          <div className="flex gap-12 md:gap-32 text-lg md:text-xl font-medium leading-snug pt-2">
            
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[12px] uppercase tracking-widest text-muted-foreground mb-6 block">
                Product
              </span>
              <Link href="/" className="hover:opacity-60">Home</Link>
              <Link href="/" className="hover:opacity-60">Graph View</Link>
              <Link href="/" className="hover:opacity-60">Docs</Link>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-[12px] uppercase tracking-widest text-muted-foreground mb-6 block">
                Company
              </span>
              <Link href="/" className="hover:opacity-60">About</Link>
              <Link href="/" className="hover:opacity-60">Privacy</Link>
              <Link href="/" className="hover:opacity-60">Terms</Link>
            </div>

          </div>
        </div>

        {/* FOOTNOTE */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            © DevScope, {new Date().getFullYear()} — Visualize. Understand. Ship faster.
          </p>
        </div>
      </div>

      {/* 🔥 MASSIVE BRAND TEXT */}
      <div className="w-full leading-none ">
        <h1
          style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 300 }}
          className="dark:text-white text-[20vw] leading-[0.75] text-center tracking-tighter pointer-events-none select-none translate-y-[6vw]"
        >
          DEVSCOPE
        </h1>
      </div>

    </footer>
  );
};

export default Footer;