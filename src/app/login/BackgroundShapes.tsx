"use client";

export default function BackgroundShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
      <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#FF0C60]/[0.07] blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-[280px] w-[280px] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-500/[0.04] blur-[80px]" />
    </div>
  );
}
