"use client";

import Blurred404Background from "@/components/Blurred404Background";
import Link from "next/link";

export default function BackgroundPreviewPage() {
  return (
    <Blurred404Background blurIntensity="heavy">
      <div className="flex flex-col justify-between min-h-screen p-8 sm:p-14 font-mono text-xs text-zinc-300 select-none">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <Link href="/" className="hover:text-white transition-colors underline underline-offset-4">
            &larr; Back to Landing Page
          </Link>
          <span className="text-zinc-500 uppercase tracking-widest text-[11px]">
            Atmospheric 404 &amp; Wavy Silk Canvas
          </span>
        </div>

        {/* Center Preview Card */}
        <div className="my-auto max-w-lg mx-auto text-center p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md space-y-3 shadow-2xl">
          <h2 className="text-base font-bold text-white uppercase tracking-wider font-epic">
            Blurred 404 Background Canvas
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed">
            This atmospheric background combines the deep red Anton 404, dense wavy silk filament mesh, and film grain with a global gaussian blur.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/sentinelops"
              className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              SentinelOps HUD &rarr;
            </Link>
            <Link
              href="/checkout"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-all"
            >
              Checkout Service &rarr;
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex justify-between items-end text-zinc-400">
          <p>Reusable Component: <code>@/components/Blurred404Background</code></p>
          <p>Created by Sourjya Saha</p>
        </div>
      </div>
    </Blurred404Background>
  );
}
