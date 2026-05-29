import Link from "next/link";
import NextImage from "next/image";
import { LOGO_URL } from "@/components/navbar/navConfig";

type NavbarBrandProps = {
  compact?: boolean;
};

export function NavbarBrand({ compact = false }: NavbarBrandProps) {
  return (
    <Link
      href="/"
      className={compact
        ? "flex min-w-0 items-center gap-2 transition-colors"
        : "mr-6 flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"}
    >
      <NextImage
        src={LOGO_URL}
        alt="Control Master"
        width={compact ? 22 : 26}
        height={compact ? 22 : 26}
        className="shrink-0 rounded object-contain"
      />
      <span className="truncate text-[14px] font-bold tracking-tight text-foreground">
        Control Master
      </span>
    </Link>
  );
}
