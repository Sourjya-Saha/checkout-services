"use client";

import { useState } from "react";
import Link from "next/link";

export default function Exact404SentinelOpsLanding() {
  const [hoverTopLeft, setHoverTopLeft] = useState<boolean>(false);
  const [hoverTopRight, setHoverTopRight] = useState<boolean>(false);
  const [hoverBottomLeft, setHoverBottomLeft] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-[#060a0a] text-white selection:bg-red-600 selection:text-white font-epic antialiased overflow-hidden select-none flex flex-col justify-between p-6 sm:p-12">
      {/* ========================================================================= */}
      {/* 1. ANALOGUE FILM GRAIN NOISE OVERLAY */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45 mix-blend-overlay z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.85'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========================================================================= */}
      {/* 2. EXACT GIANT 404 BACKGROUND (ANTON FONT): BLURRED SIDES + CRISP 0 */}
      {/* ========================================================================= */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {/* LEFT 4 */}
        <div className="absolute top-[54%] left-0 -translate-y-1/2 -translate-x-[4%] sm:-translate-x-[2%] whitespace-nowrap">
          <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em] blur-[14px] sm:blur-[10px] opacity-95">
            4
          </span>
        </div>

        {/* CENTER 0 */}
        <div className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
          <span className="font-anton text-[#dc2626] text-[136vh] leading-[0.72] tracking-[-0.04em]">
            0
          </span>
        </div>

        {/* RIGHT 4 */}
        <div className="absolute top-[54%] right-0 -translate-y-1/2 translate-x-[4%] sm:translate-x-[2%] whitespace-nowrap">
          <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em] blur-[14px] sm:blur-[10px] opacity-95">
            4
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. WISPY SILK / SMOKE / CRAYON WAVING TEXTURES (ALL OVER CANVAS) */}
      {/* ========================================================================= */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 overflow-visible opacity-55"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="wispyGrain" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="5" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="chalkGrain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Wispy smoke veil wave 1 across top and behind left 4 */}
        <path
          d="M -100 200 C 250 80, 450 350, 800 180 C 1100 40, 1300 280, 1600 150"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          filter="url(#wispyGrain)"
          className="opacity-40"
        />

        {/* Wispy smoke veil wave 2 across center and behind right 4 */}
        <path
          d="M -50 650 C 350 480, 600 780, 1000 520 C 1250 380, 1400 700, 1600 550"
          stroke="white"
          strokeWidth="2"
          fill="none"
          filter="url(#wispyGrain)"
          className="opacity-35"
        />

        {/* Fine wispy smoke veil wave 3 */}
        <path
          d="M 100 100 Q 400 600, 900 300 T 1500 700"
          stroke="white"
          strokeWidth="1"
          fill="none"
          filter="url(#wispyGrain)"
          className="opacity-25"
        />

        {/* Organic chalk wavy line running through center */}
        <path
          d="M 0 500 Q 350 430, 720 520 T 1440 470"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 3 12 4"
          filter="url(#chalkGrain)"
          className="opacity-40"
        />
      </svg>

      {/* ========================================================================= */}
      {/* 4. TOP ROW: CORNER CALLOUTS IN ORGANIC CHALK LOOPS & 404 ERROR PAGE */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex justify-between items-start font-mono text-xs text-zinc-300 leading-tight">
        {/* Top-Left Organic Chalk Loop Box */}
        <Link
          href="/sentinelops"
          onMouseEnter={() => setHoverTopLeft(true)}
          onMouseLeave={() => setHoverTopLeft(false)}
          className="group relative inline-block p-3.5 sm:p-4 rounded-[22px] border border-white/30 backdrop-blur-[2px] transition-all duration-300 hover:border-red-500 hover:text-red-400 hover:scale-105"
          style={{
            borderRadius: "26px 18px 24px 20px / 20px 24px 18px 26px",
          }}
        >
          {hoverTopLeft ? (
            <div className="text-red-400 font-bold animate-fadeIn">
              <p>kill your</p>
              <p>bug in real-time ↗</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p>kill that</p>
              <p>anxiety and fear</p>
            </div>
          )}
        </Link>

        {/* Top-Center: Exact "404 ERROR PAGE" */}
        <div className="text-center font-mono text-[10px] sm:text-xs uppercase tracking-widest text-zinc-300 pt-1">
          <p className="font-bold">404</p>
          <p className="text-zinc-400">ERROR PAGE</p>
        </div>

        {/* Top-Right Organic Chalk Loop Box */}
        <Link
          href="/checkout"
          onMouseEnter={() => setHoverTopRight(true)}
          onMouseLeave={() => setHoverTopRight(false)}
          className="group relative inline-block p-3.5 sm:p-4 rounded-[22px] border border-white/30 text-right backdrop-blur-[2px] transition-all duration-300 hover:border-red-500 hover:text-red-400 hover:scale-105"
          style={{
            borderRadius: "18px 26px 20px 24px / 24px 20px 26px 18px",
          }}
        >
          {hoverTopRight ? (
            <div className="text-red-400 font-bold animate-fadeIn">
              <p>face the actual</p>
              <p>service page ↗</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p>face it or be</p>
              <p>destroyed with it</p>
            </div>
          )}
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 5. CENTER HERO: EXACT TYPOGRAPHY & LAYOUT FROM IMAGE */}
      {/* ========================================================================= */}
      <div className="relative z-50 my-auto text-center py-2">
        {/* Eyebrow Label */}
        <p className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.25em] text-zinc-300 uppercase mb-2">
          MY HARNESS AGENT
        </p>

        {/* Giant Main Title: "SENTINEL OPS" */}
        <div className="relative inline-block select-none my-1">
          {/* Soft tight black shadow underlayer */}
          <span className="absolute inset-0 translate-x-[3px] translate-y-[5px] text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tight text-black filter blur-[4px] opacity-95 select-none pointer-events-none z-0 whitespace-nowrap">
            SENTINEL OPS
          </span>

          {/* Sharp Front White Title */}
          <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)] z-10 whitespace-nowrap">
            SENTINEL OPS
          </h1>
        </div>

        {/* Sub-caption Text */}
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-zinc-300 mt-2 mb-2">
          SORRY, WE DETECTED AN ANOMALY IN THIS SERVICE
        </p>

        {/* Underline CTA Link */}
        <div className="relative inline-block">
          <Link
            href="/sentinelops"
            className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-white hover:text-red-400 transition-colors border-b border-white hover:border-red-400 pb-0.5"
          >
            AUTONOMOUS REMEDIATION &rarr;
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM ROW: EXACT CORNER CHALK LOOPS & BOTTOM SUBTITLE */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex flex-col sm:flex-row justify-between items-center sm:items-end font-mono text-xs text-zinc-300 leading-tight gap-4">
        {/* Bottom-Left Organic Chalk Loop Box */}
        <Link
          href="/incidents"
          onMouseEnter={() => setHoverBottomLeft(true)}
          onMouseLeave={() => setHoverBottomLeft(false)}
          className="group relative inline-block p-3.5 sm:p-4 rounded-[22px] border border-white/30 backdrop-blur-[2px] transition-all duration-300 hover:border-red-500 hover:text-red-400 hover:scale-105"
          style={{
            borderRadius: "22px 20px 26px 18px / 18px 26px 20px 22px",
          }}
        >
          {hoverBottomLeft ? (
            <div className="text-red-400 font-bold animate-fadeIn">
              <p>Explore</p>
              <p>Postmortem Audit ↗</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p>You have</p>
              <p>to face it!</p>
            </div>
          )}
        </Link>

        {/* Bottom-Center Subtitle */}
        <div className="text-center text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 max-w-sm pb-1">
          <p>THE PAGE YOU ARE LOOKING FOR DOESN&apos;T EXIST OR AN OTHER</p>
          <p>ERROR OCCURRED.</p>
        </div>

        {/* Bottom-Right Organic Chalk Loop Box */}
        <div
          className="relative inline-block p-3.5 sm:p-4 rounded-[22px] border border-white/30 text-right backdrop-blur-[2px]"
          style={{
            borderRadius: "20px 24px 18px 26px / 26px 18px 24px 20px",
          }}
        >
          <p className="text-[10px] text-zinc-400">Create by</p>
          <p className="text-white font-bold tracking-wider text-xs sm:text-sm font-mono uppercase">
            SOURJYA SAHA
          </p>
        </div>
      </div>
    </main>
  );
}
