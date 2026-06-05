"use client";

import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-in fade-in duration-300 motion-reduce:animate-none motion-reduce:duration-0"
    >
      {children}
    </div>
  );
}