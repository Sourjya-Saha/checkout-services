"use client";

import { useState } from "react";
import Link from "next/link";

export default function DeepRed404CombinedLanding() {
  const [hoverTopLeft, setHoverTopLeft] = useState<boolean>(false);
  const [hoverTopRight, setHoverTopRight] = useState<boolean>(false);
  const [hoverBottomLeft, setHoverBottomLeft] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-[#070d0d] text-white selection:bg-red-600 selection:text-white font-epic antialiased overflow-hidden select-none flex flex-col justify-between p-8 sm:p-14">
      {/* ========================================================================= */}
      {/* 1. ANALOGUE FILM GRAIN NOISE TEXTURE */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.85'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========================================================================= */}
      {/* 2. EXACT GIANT 404 BACKGROUND: BLURRED LEFT & RIGHT EDGES + SHARP CENTER */}
      {/* ========================================================================= */}
   <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">

  {/* LEFT 4 */}
  <div className="absolute top-[55%] left-0 -translate-y-1/2 -translate-x-[3%] whitespace-nowrap">
    <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em] blur-[14px] sm:blur-[10px] opacity-95">
      4
    </span>
  </div>

  {/* CENTER 0 */}
  <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
    <span className="font-anton text-[#dc2626] text-[136vh] leading-[0.72] tracking-[-0.04em]">
      0
    </span>
  </div>

  {/* RIGHT 4 */}
  <div className="absolute top-[55%] right-0 -translate-y-1/2 translate-x-[3%] whitespace-nowrap">
    <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em] blur-[14px] sm:blur-[10px] opacity-95">
      4
    </span>
  </div>

</div>

      {/* ========================================================================= */}
      {/* 3. TOP METADATA & INTERACTIVE HOVER REDIRECTS */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex justify-between items-start font-mono text-xs sm:text-sm text-zinc-200 leading-tight">
        {/* Top Left: On hover -> "kill your bug in real-time" -> Redirects to /sentinelops */}
        <Link
          href="/sentinelops"
          onMouseEnter={() => setHoverTopLeft(true)}
          onMouseLeave={() => setHoverTopLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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

     

        {/* Top Right: On hover -> "face the actual service page" -> Redirects to /checkout */}
        <Link
          href="/checkout"
          onMouseEnter={() => setHoverTopRight(true)}
          onMouseLeave={() => setHoverTopRight(false)}
          className="group block text-right cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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
      {/* 4. CENTER HERO FOCUS: "My Harness Agent" + "SENTINEL OPS" + GO BACK */}
      {/* ========================================================================= */}
      <div className="relative z-50 my-auto text-center py-4">
        {/* Eyebrow Label */}
        <p className="text-xs sm:text-sm font-epic font-medium tracking-[0.2em] text-zinc-300 uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          My Harness Agent
        </p>

        {/* Center Title Stack with Deep, Wide, Distributed Black Shadow */}
        <div className="relative inline-block select-none my-1">
          {/* Wide Distributed Ambient Black Halo */}
          <span className="absolute inset-0 scale-110 translate-y-[6px] text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-black filter blur-[20px] sm:blur-[28px] opacity-100 select-none pointer-events-none z-0 whitespace-nowrap">
            SENTINEL OPS
          </span>

          {/* Medium Deep Black Shadow Layer */}
          <span className="absolute inset-0 translate-y-[4px] text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-black filter blur-[8px] sm:blur-[12px] opacity-100 select-none pointer-events-none z-0 whitespace-nowrap">
            SENTINEL OPS
          </span>

          {/* Close Tight Core Occlusion Shadow */}
          <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-black filter blur-[3px] opacity-100 select-none pointer-events-none z-0 whitespace-nowrap">
            SENTINEL OPS
          </span>

          {/* Sharp Front Title with Rich Dark Text Shadows */}
          <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(0,0,0,1)] drop-shadow-[0_8px_20px_rgba(0,0,0,1)] z-10 whitespace-nowrap">
            SENTINEL OPS
          </h1>
        </div>

        {/* 404 Overlay Details with Underline Scribble Effect */}
    
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM METADATA CALLOUTS & EXACT "CREATE BY SOURJYA SAHA" */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex flex-col sm:flex-row justify-between items-center sm:items-end font-mono text-xs sm:text-sm text-zinc-300 leading-tight gap-4">
        {/* Bottom Left */}
        <Link
          href="/incidents"
          onMouseEnter={() => setHoverBottomLeft(true)}
          onMouseLeave={() => setHoverBottomLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
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

     

        {/* Bottom Right: "Create by Sourjya Saha" */}
        <div className="text-right space-y-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          <p className="text-zinc-400 text-xs">Create by</p>
          <p className="text-white font-bold font-epic tracking-wide text-sm sm:text-base">Sourjya Saha</p>
        </div>
      </div>
    </main>
  );
}
