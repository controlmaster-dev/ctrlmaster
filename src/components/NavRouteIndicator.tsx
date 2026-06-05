"use client";

import { useEffect, useState } from "react";


export function NavRouteIndicator({ pathname }: { pathname: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const done = window.setTimeout(() => setActive(false), 450);
    return () => window.clearTimeout(done);
  }, [pathname]);

  return (
    <span
      className="pointer-events-none absolute bottom-0 left-0 z-[110] h-[2px] bg-brand transition-[width,opacity] duration-300 ease-out"
      style={{
        width: active ? "100%" : "0%",
        opacity: active ? 1 : 0,
      }}
      aria-hidden
    />
  );
}
