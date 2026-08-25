"use client";

import { useState } from "react";
import Link from "next/link";

export default function DeepRed404CombinedLanding() {
  const [hoverTopLeft, setHoverTopLeft] = useState<boolean>(false);
  const [hoverTopRight, setHoverTopRight] = useState<boolean>(false);
  const [hoverBottomLeft, setHoverBottomLeft] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-[#070d0d] text-white selection:bg-red-600 selection:text-white font-anton antialiased overflow-hidden select-none flex flex-col justify-between p-8 sm:p-14">
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
      {/* 2. EXACT GIANT 404 BACKGROUND (GOOGLE ANTON FONT): BLURRED LEFT/RIGHT + SHARP CENTER */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {/* LEFT 4 */}
        <div className="absolute top-[64%] left-0 -translate-y-1/2 -translate-x-[19%] whitespace-nowrap">
          <span className="font-anton font-normal text-red-600/90 text-[140vh] leading-[0.72] tracking-[-0.08em] blur-[14px] sm:blur-[10px] opacity-95">
            4
          </span>
        </div>

        {/* CENTER 0 */}
        <div className="absolute top-[64%] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
          <span className="font-anton font-normal text-[#dc2626] text-[136vh] leading-[0.72] tracking-[-0.04em]">
            0
          </span>
        </div>

        {/* RIGHT 4 */}
        <div className="absolute top-[64%] right-0 translate-x-[1%] -translate-y-1/2 whitespace-nowrap">
          <span className="font-anton font-normal text-red-600/90 text-[140vh] leading-[0.72] tracking-[-0.08em] blur-[14px] sm:blur-[10px] opacity-95">
            4
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP METADATA & INTERACTIVE HOVER REDIRECTS (ANTON FONT) */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex justify-between items-start font-anton tracking-wider text-xs sm:text-base text-zinc-200 uppercase leading-snug">
        {/* Top Left: On hover -> "kill your bug in real-time" -> Redirects to /sentinelops */}
        <Link
          href="/sentinelops"
          onMouseEnter={() => setHoverTopLeft(true)}
          onMouseLeave={() => setHoverTopLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        >
          {hoverTopLeft ? (
            <div className="text-red-400 animate-fadeIn">
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
          className="group block text-right cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        >
          {hoverTopRight ? (
            <div className="text-red-400 animate-fadeIn">
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
      {/* 4. CENTER HERO FOCUS: "My Harness Agent" + "SENTINEL OPS" */}
      {/* ========================================================================= */}
      <div className="relative z-50 my-auto text-center py-4">
        {/* Eyebrow Label */}
        <p className="text-sm sm:text-base font-anton font-normal tracking-[0.25em] text-zinc-300 uppercase mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          My Harness Agent
        </p>

        {/* Center Title Stack with Tight Black Shadow Behind */}
        <div className="relative inline-block select-none my-1">
          {/* Black Shadow Directly Behind */}
          <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] sm:translate-x-[3px] sm:translate-y-[4px] text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-black filter blur-[2px] sm:blur-[3px] opacity-95 select-none pointer-events-none z-0 whitespace-nowrap">
            SENTINEL OPS
          </span>

          {/* Sharp Front Title */}
          <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-epic font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] z-10 whitespace-nowrap">
            SENTINEL OPS
          </h1>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM METADATA CALLOUTS (ANTON FONT) */}
      {/* ========================================================================= */}
      <div className="relative z-50 flex flex-col sm:flex-row justify-between items-center sm:items-end font-anton tracking-wider text-xs sm:text-base text-zinc-200 uppercase leading-snug gap-4">
        {/* Bottom Left: Links to /incidents */}
        <Link
          href="/incidents"
          onMouseEnter={() => setHoverBottomLeft(true)}
          onMouseLeave={() => setHoverBottomLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        >
          {hoverBottomLeft ? (
            <div className="text-red-400 animate-fadeIn">
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
        <div className="text-right space-y-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          <p className="text-zinc-400 text-xs sm:text-sm">Create by</p>
          <p className="text-white tracking-widest text-sm sm:text-lg">Sourjya Saha</p>
        </div>
      </div>
    </main>
  );
}
