"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExactPosterCloneLanding() {
  const [hoverTopLeft, setHoverTopLeft] = useState<boolean>(false);
  const [hoverTopRight, setHoverTopRight] = useState<boolean>(false);
  const [hoverBottomLeft, setHoverBottomLeft] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-[#090304] text-white selection:bg-red-600 selection:text-white font-epic antialiased overflow-hidden select-none flex flex-col justify-between p-8 sm:p-14">
      {/* ========================================================================= */}
      {/* 1. ANALOGUE FILM GRAIN & NOISE TEXTURE OVERLAY */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45 mix-blend-overlay z-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.75'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========================================================================= */}
      {/* 2. ATMOSPHERIC RADIAL RED LIGHTING BLEEDS */}
      {/* ========================================================================= */}
      <div className="absolute top-1/4 right-0 w-[600px] sm:w-[850px] h-[550px] bg-red-600/30 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] sm:w-[750px] h-[450px] bg-red-700/25 blur-[140px] pointer-events-none rounded-full" />

      {/* ========================================================================= */}
      {/* 3. BACKGROUND BLURRED MOTION GLYPHS: "SENTINEL" */}
      {/* ========================================================================= */}
      {/* Top Right Blurred Glyph */}
      <div className="absolute -top-6 -right-16 text-[14vw] sm:text-[16vw] font-epic font-extrabold uppercase text-red-600/75 tracking-tighter filter blur-[6px] sm:blur-[10px] pointer-events-none select-none z-0">
        SENTINEL
      </div>

      {/* Bottom Blurred Glyph */}
      <div className="absolute -bottom-16 -left-10 text-[20vw] sm:text-[23vw] font-epic font-extrabold uppercase text-red-600/80 tracking-tighter filter blur-[8px] sm:blur-[14px] pointer-events-none select-none z-0">
        SENTINEL
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP CORNER EDITORIAL TEXT WITH INTERACTIVE HOVER REDIRECTS */}
      {/* ========================================================================= */}
      <div className="relative z-40 flex justify-between items-start font-mono text-xs sm:text-sm text-zinc-300 leading-tight">
        {/* Top Left: On hover -> "kill your bug in real-time" -> Redirects to /sentinelops */}
        <Link
          href="/sentinelops"
          onMouseEnter={() => setHoverTopLeft(true)}
          onMouseLeave={() => setHoverTopLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400"
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
          className="group block text-right cursor-pointer transition-all duration-300 hover:text-red-400"
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
      {/* 5. CENTER HERO: "My Harness Agent" + STACKED KINETIC BLURRED "SENTINEL OPS" */}
      {/* ========================================================================= */}
      <div className="relative z-40 my-auto text-center py-6">
        <p className="text-sm sm:text-base font-epic font-medium tracking-wide text-white mb-2">
          My Harness Agent
        </p>

        <div className="relative inline-block select-none">
          {/* Kinetic Motion Blur Layer 1 */}
          <span className="absolute top-2 left-6 sm:left-10 text-5xl sm:text-7xl md:text-8xl font-epic font-extrabold uppercase tracking-tighter text-red-600/50 filter blur-[5px] sm:blur-[8px] select-none pointer-events-none">
            SENTINEL OPS
          </span>

          {/* Kinetic Motion Blur Layer 2 */}
          <span className="absolute -top-1 left-3 sm:left-6 text-5xl sm:text-7xl md:text-8xl font-epic font-extrabold uppercase tracking-tighter text-red-500/70 filter blur-[2px] sm:blur-[3.5px] select-none pointer-events-none">
            SENTINEL OPS
          </span>

          {/* Sharp Front Title */}
          <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-epic font-extrabold uppercase tracking-tighter text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.85)] z-10">
            SENTINEL OPS
          </h1>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CORNER EDITORIAL TEXT */}
      {/* ========================================================================= */}
      <div className="relative z-40 flex justify-between items-end font-mono text-xs sm:text-sm text-zinc-300 leading-tight">
        {/* Bottom Left: Links to /incidents */}
        <Link
          href="/incidents"
          onMouseEnter={() => setHoverBottomLeft(true)}
          onMouseLeave={() => setHoverBottomLeft(false)}
          className="group block cursor-pointer transition-all duration-300 hover:text-red-400"
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

        {/* Bottom Right: Exact text "Create by Sourjya Saha" */}
        <div className="text-right space-y-0.5">
          <p className="text-zinc-400">Create by</p>
          <p className="text-white font-bold font-epic tracking-wide">Sourjya Saha</p>
        </div>
      </div>
    </main>
  );
}
