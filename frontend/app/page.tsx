"use client";

import { useState } from "react";
import Link from "next/link";

export default function DeepRed404TightLanding() {
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
      {/* 2. TIGHTEST CENTERED 404: BLURRED LEFT/RIGHT + CRISP CENTER 0 */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden -space-x-14 sm:-space-x-28 md:-space-x-36">
        {/* Left '4' - Heavy Edge Blur */}
        <span className="text-[56vw] sm:text-[50vw] font-black leading-none text-[#dc2626] tracking-tighter filter blur-[10px] sm:blur-[16px] opacity-95 transform scale-y-125 select-none">
          4
        </span>

        {/* Center '0' - Ultra Sharp Crisp Tower */}
        <span className="text-[58vw] sm:text-[52vw] font-black leading-none text-[#dc2626] tracking-tighter filter blur-0 opacity-100 transform scale-y-125 drop-shadow-[0_0_60px_rgba(220,38,38,0.85)] z-10 select-none">
          0
        </span>

        {/* Right '4' - Heavy Edge Blur */}
        <span className="text-[56vw] sm:text-[50vw] font-black leading-none text-[#dc2626] tracking-tighter filter blur-[10px] sm:blur-[16px] opacity-95 transform scale-y-125 select-none">
          4
        </span>
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

        {/* Top Center: "404 ERROR PAGE" */}
        <div className="text-center font-mono text-[10px] sm:text-xs uppercase tracking-widest text-zinc-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          <p className="font-bold">404</p>
          <p className="text-zinc-400">ERROR PAGE</p>
        </div>

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
      {/* 4. CENTER HERO FOCUS: "My Harness Agent" + "SENTINEL OPS" + AUTONOMOUS */}
      {/* ========================================================================= */}
      <div className="relative z-50 my-auto text-center py-4">
        {/* Eyebrow */}
        <p className="text-xs sm:text-sm font-epic font-medium tracking-[0.2em] text-zinc-300 uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          My Harness Agent
        </p>

        {/* Center Title Stack */}
        <div className="relative inline-block select-none my-1">
          {/* Motion Blur Trail Underlayer */}
          <span className="absolute top-1 left-4 sm:left-8 text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-black/60 filter blur-[4px] sm:blur-[6px] select-none pointer-events-none">
            SENTINEL OPS
          </span>

          {/* Sharp Front Title */}
          <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] z-10">
            SENTINEL OPS
          </h1>
        </div>

        {/* 404 Overlay Details with Underline */}
        <div className="mt-3 space-y-1 max-w-md mx-auto">
          <p className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            SORRY, WE DETECTED AN ANOMALY IN THIS SERVICE
          </p>

          <div className="relative inline-block pt-1">
            <Link
              href="/sentinelops"
              className="text-xs sm:text-sm font-bold font-mono tracking-widest text-white hover:text-red-400 uppercase transition-colors underline underline-offset-4 decoration-red-500"
            >
              AUTONOMOUS REMEDIATION &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM METADATA CALLOUTS & "CREATE BY SOURJYA SAHA" */}
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

        {/* Center Bottom Subtitle */}
        <div className="text-center text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 max-w-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          THE PAGE YOU ARE LOOKING FOR DOESN&apos;T EXIST OR AN OTHER ERROR OCCURRED.
        </div>

        {/* Bottom Right: "Create by Sourjya Saha" */}
        <div className="text-right space-y-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          <p className="text-zinc-400 text-xs">Create by</p>
          <p className="text-white font-bold font-epic tracking-wide text-sm sm:text-base">Sourjya Saha</p>
        </div>
      </div>
    </main>
  );
}
