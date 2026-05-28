"use client";

import { motion } from "framer-motion";

interface PageTransitionProps {
  pathname: string;
  children: React.ReactNode;
}

/** Transición suave al cambiar de ruta (sin remount del navbar). */
export function PageTransition({ pathname, children }: PageTransitionProps) {
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-0"
    >
      {children}
    </motion.div>
  );
}
