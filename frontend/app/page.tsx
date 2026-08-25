"use client";

import { useState } from "react";
import Link from "next/link";

export default function Exact404SentinelOpsLanding() {
  const [hoverTopLeft, setHoverTopLeft] = useState<boolean>(false);
  const [hoverTopRight, setHoverTopRight] = useState<boolean>(false);
  const [hoverBottomLeft, setHoverBottomLeft] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-[#060a0a] text-white selection:bg-red-600 selection:text-white font-epic antialiased overflow-hidden select-none flex flex-col justify-between p-8 sm:p-14">
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
      {/* 3. PROMINENT & BRIGHT WISPY WAVY SMOKE / SILK COBWEB TEXTURES */}
      {/* ========================================================================= */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 overflow-visible opacity-80"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="wispyWarp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="40" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="fineSilk" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="warp2" />
            <feDisplacementMap in="SourceGraphic" in2="warp2" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="pencilChalk" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Prominent bright wavy silk veil across top and behind left 4 */}
        <path
          d="M -100 240 C 200 60, 450 380, 800 160 C 1120 20, 1320 320, 1600 180"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          filter="url(#wispyWarp)"
          className="opacity-75"
        />

        {/* Secondary bright wispy wave flowing through center and corners */}
        <path
          d="M -80 580 C 300 420, 580 750, 950 480 C 1200 320, 1380 660, 1620 500"
          stroke="white"
          strokeWidth="2.2"
          fill="none"
          filter="url(#wispyWarp)"
          className="opacity-65"
        />

        {/* Fine cobweb wavy filaments across the background */}
        <path
          d="M 50 120 C 350 480, 700 180, 1100 520 S 1400 200, 1550 420"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          filter="url(#fineSilk)"
          className="opacity-55"
        />

        <path
          d="M 120 780 C 450 620, 800 820, 1200 640 S 1450 780, 1600 700"
          stroke="white"
          strokeWidth="1.8"
          fill="none"
          filter="url(#fineSilk)"
          className="opacity-50"
        />

        {/* Swirling delicate smoke arc around center */}
        <path
          d="M 200 350 Q 720 180, 1250 400"
          stroke="white"
          strokeWidth="2"
          fill="none"
          filter="url(#wispyWarp)"
          className="opacity-60"
        />
      </svg>

      {/* ========================================================================= */}
      {/* 4. TOP ROW: HAND-DRAWN ORGANIC CURVED CHALK BORDERS */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex justify-between items-start font-mono text-xs text-zinc-200 leading-tight">
        {/* Top-Left Hand-Drawn Wobbly Chalk Loop */}
        <Link
          href="/sentinelops"
          onMouseEnter={() => setHoverTopLeft(true)}
          onMouseLeave={() => setHoverTopLeft(false)}
          className="group relative inline-block cursor-pointer transition-transform duration-300 hover:scale-105"
        >
          {/* Hand-drawn SVG wavy outline */}
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none overflow-visible"
            viewBox="0 0 160 70"
            preserveAspectRatio="none"
          >
            <path
              d="M 12 10 C 35 4, 115 8, 146 5 C 160 14, 154 48, 147 60 C 138 68, 110 63, 75 66 C 38 68, 12 64, 6 52 C 2 36, 4 18, 12 10 Z"
              fill="rgba(0,0,0,0.15)"
              stroke="white"
              strokeWidth="1.2"
              filter="url(#pencilChalk)"
              className="opacity-75 group-hover:opacity-100 group-hover:stroke-red-400 transition-colors"
            />
          </svg>

          <div className="relative z-10 p-2.5">
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
          </div>
        </Link>

        {/* Top-Right Hand-Drawn Wobbly Chalk Loop */}
        <Link
          href="/checkout"
          onMouseEnter={() => setHoverTopRight(true)}
          onMouseLeave={() => setHoverTopRight(false)}
          className="group relative inline-block text-right cursor-pointer transition-transform duration-300 hover:scale-105"
        >
          {/* Hand-drawn SVG wavy outline */}
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none overflow-visible"
            viewBox="0 0 165 70"
            preserveAspectRatio="none"
          >
            <path
              d="M 15 8 C 50 4, 125 9, 152 6 C 164 18, 157 52, 149 63 C 132 69, 82 64, 42 67 C 16 69, 4 56, 6 40 C 7 22, 6 14, 15 8 Z"
              fill="rgba(0,0,0,0.15)"
              stroke="white"
              strokeWidth="1.2"
              filter="url(#pencilChalk)"
              className="opacity-75 group-hover:opacity-100 group-hover:stroke-red-400 transition-colors"
            />
          </svg>

          <div className="relative z-10 p-2.5">
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
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 5. CENTER HERO: PREVIOUS "My Harness Agent" + WHITE "SENTINEL OPS" */}
      {/* ========================================================================= */}
      <div className="relative z-50 my-auto text-center py-4">
        {/* Previous "My Harness Agent" Text Styling */}
        <p className="text-sm sm:text-base font-epic font-medium tracking-wide text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          My Harness Agent
        </p>

        {/* Giant Main Title: "SENTINEL OPS" in White with Tight Dark Shadow */}
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
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM ROW: HAND-DRAWN ORGANIC CURVED CHALK BORDERS */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex justify-between items-end font-mono text-xs text-zinc-200 leading-tight">
        {/* Bottom-Left Hand-Drawn Wobbly Chalk Loop */}
        <Link
          href="/incidents"
          onMouseEnter={() => setHoverBottomLeft(true)}
          onMouseLeave={() => setHoverBottomLeft(false)}
          className="group relative inline-block cursor-pointer transition-transform duration-300 hover:scale-105"
        >
          {/* Hand-drawn SVG wavy outline */}
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none overflow-visible"
            viewBox="0 0 145 70"
            preserveAspectRatio="none"
          >
            <path
              d="M 12 12 C 38 6, 85 9, 126 6 C 140 16, 135 48, 127 60 C 110 67, 65 63, 34 66 C 12 68, 3 55, 5 38 C 6 22, 5 15, 12 12 Z"
              fill="rgba(0,0,0,0.15)"
              stroke="white"
              strokeWidth="1.2"
              filter="url(#pencilChalk)"
              className="opacity-75 group-hover:opacity-100 group-hover:stroke-red-400 transition-colors"
            />
          </svg>

          <div className="relative z-10 p-2.5">
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
          </div>
        </Link>

        {/* Bottom-Right Hand-Drawn Wobbly Chalk Loop */}
        <div className="relative inline-block text-right">
          {/* Hand-drawn SVG wavy outline */}
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none overflow-visible"
            viewBox="0 0 165 70"
            preserveAspectRatio="none"
          >
            <path
              d="M 15 7 C 55 4, 118 10, 150 6 C 163 18, 156 50, 148 62 C 130 69, 75 64, 40 67 C 16 69, 4 57, 6 40 C 7 24, 7 14, 15 7 Z"
              fill="rgba(0,0,0,0.15)"
              stroke="white"
              strokeWidth="1.2"
              filter="url(#pencilChalk)"
              className="opacity-75"
            />
          </svg>

          <div className="relative z-10 p-2.5">
            <p className="text-[10px] text-zinc-400">Create by</p>
            <p className="text-white font-bold tracking-wider text-xs sm:text-sm font-mono uppercase">
              SOURJYA SAHA
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
