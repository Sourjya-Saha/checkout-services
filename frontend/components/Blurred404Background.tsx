"use client";

import React from "react";

interface Blurred404BackgroundProps {
  children?: React.ReactNode;
  blurIntensity?: "light" | "medium" | "heavy";
  className?: string;
}

export default function Blurred404Background({
  children,
  blurIntensity = "heavy",
  className = "",
}: Blurred404BackgroundProps) {
  const blurClasses = {
    light: "blur-[8px] sm:blur-[12px]",
    medium: "blur-[16px] sm:blur-[22px]",
    heavy: "blur-[24px] sm:blur-[36px]",
  }[blurIntensity];

  return (
    <div className={`relative min-h-screen w-full bg-[#060a0a] text-white ${className}`}>
      {/* ========================================================================= */}
      {/* 1. ANALOGUE FILM GRAIN NOISE OVERLAY (FIXED VIEWPORT) */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 pointer-events-none opacity-45 mix-blend-overlay z-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.85'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========================================================================= */}
      {/* 2. ENTIRE 404 & WAVY TEXTURE CANVAS FIXED (DOES NOT MOVE ON SCROLL) */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden filter ${blurClasses} opacity-85 transform scale-105`}
      >
        {/* GIANT 404 NUMBERS (ANTON FONT) */}
        <div className="absolute inset-0 flex items-center justify-between overflow-hidden">
          {/* LEFT 4 */}
          <div className="absolute top-[54%] left-0 -translate-y-1/2 -translate-x-[4%] sm:-translate-x-[2%] whitespace-nowrap">
            <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em]">
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
            <span className="font-anton text-red-600/90 text-[125vh] leading-[0.72] tracking-[-0.04em]">
              4
            </span>
          </div>
        </div>

        {/* DENSE SILK & COBWEB WAVY FILAMENT MESH */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 overflow-visible opacity-95 mix-blend-screen"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="silkFlowBg" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="5" result="warp" />
              <feDisplacementMap in="SourceGraphic" in2="warp" scale="65" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="cobwebMicroBg" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="4" result="microWarp" />
              <feDisplacementMap in="SourceGraphic" in2="microWarp" scale="35" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Top Waving Filament Bands */}
          <g filter="url(#silkFlowBg)" className="opacity-80">
            <path d="M -100 180 C 250 40, 550 360, 950 140 C 1200 20, 1400 300, 1600 120" stroke="white" strokeWidth="2.4" fill="none" />
            <path d="M -100 200 C 260 60, 560 380, 960 160 C 1210 40, 1410 320, 1600 140" stroke="white" strokeWidth="1.8" fill="none" />
            <path d="M -100 220 C 270 80, 570 400, 970 180 C 1220 60, 1420 340, 1600 160" stroke="white" strokeWidth="1.4" fill="none" />
            <path d="M -100 240 C 280 100, 580 420, 980 200 C 1230 80, 1430 360, 1600 180" stroke="white" strokeWidth="1.0" fill="none" />
          </g>

          {/* Bottom Waving Filament Bands */}
          <g filter="url(#silkFlowBg)" className="opacity-85">
            <path d="M -80 620 C 320 440, 620 780, 1020 460 C 1250 300, 1420 680, 1620 480" stroke="white" strokeWidth="2.6" fill="none" />
            <path d="M -80 640 C 330 460, 630 800, 1030 480 C 1260 320, 1430 700, 1620 500" stroke="white" strokeWidth="2.0" fill="none" />
            <path d="M -80 660 C 340 480, 640 820, 1040 500 C 1270 340, 1440 720, 1620 520" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M -80 680 C 350 500, 650 840, 1050 520 C 1280 360, 1450 740, 1620 540" stroke="white" strokeWidth="1.1" fill="none" />
          </g>

          {/* Swirling Filaments */}
          <g filter="url(#cobwebMicroBg)" className="opacity-70">
            <path d="M 0 100 Q 300 400, 720 220 T 1440 280" stroke="white" strokeWidth="1.6" fill="none" />
            <path d="M 0 350 Q 500 150, 920 480 T 1440 400" stroke="white" strokeWidth="1.4" fill="none" />
            <path d="M 0 750 Q 400 500, 850 720 T 1440 680" stroke="white" strokeWidth="1.8" fill="none" />
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCROLLABLE PAGE CONTENT LAYER */}
      {/* ========================================================================= */}
      <div className="relative z-40 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}
