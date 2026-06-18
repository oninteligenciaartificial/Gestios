import Link from "next/link";
import { Boxes } from "lucide-react";

type BrandLogoVariant = "full" | "icon" | "responsive";
type BrandLogoSize = "nav" | "landing" | "auth" | "icon";
type BrandLogoTone = "light" | "dark" | "dashboard";

type BrandLogoProps = {
  href?: string;
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  className?: string;
  priority?: boolean;
};

const markSizeClass: Record<BrandLogoSize, string> = {
  nav: "h-8 w-8 sm:h-9 sm:w-9",
  landing: "h-10 w-10 sm:h-12 sm:w-12",
  auth: "h-10 w-10 sm:h-12 sm:w-12",
  icon: "h-9 w-9 sm:h-10 sm:w-10",
};

const textSizeClass: Record<BrandLogoSize, string> = {
  nav: "text-xl sm:text-2xl",
  landing: "text-3xl sm:text-4xl",
  auth: "text-2xl sm:text-3xl",
  icon: "text-xl",
};

function toneTextClass(tone: BrandLogoTone) {
  if (tone === "light") return "text-[#111111]";
  return "text-white";
}

function LogoMark({ size, tone, spinning = false }: { size: BrandLogoSize; tone: BrandLogoTone; spinning?: boolean }) {
  const isLight = tone === "light";

  return (
    <span
      aria-hidden="true"
      className={`${markSizeClass[size]} inline-flex items-center justify-center rounded-xl border ${
        isLight
          ? "border-black/10 bg-black text-brand-kinetic-orange"
          : "border-white/10 bg-white/[0.06] text-brand-kinetic-orange shadow-[0_0_22px_rgba(255,107,0,0.20)]"
      } ${spinning ? "animate-spin motion-reduce:animate-none" : ""}`}
    >
      <Boxes size={size === "icon" ? 19 : 21} strokeWidth={2.3} />
    </span>
  );
}

function LogoWordmark({ size, tone }: { size: BrandLogoSize; tone: BrandLogoTone }) {
  return (
    <span className={`font-display font-black ${textSizeClass[size]} leading-none tracking-normal ${toneTextClass(tone)}`}>
      Gesti<span className="text-brand-kinetic-orange">OS</span>
    </span>
  );
}

function LogoContent({
  variant,
  size,
  tone,
}: {
  variant: BrandLogoVariant;
  size: BrandLogoSize;
  tone: BrandLogoTone;
}) {
  if (variant === "icon") return <LogoMark size={size} tone={tone} />;

  if (variant === "responsive") {
    return (
      <>
        <span className="sm:hidden">
          <LogoMark size="icon" tone={tone} />
        </span>
        <span className="hidden sm:inline-flex items-center gap-2.5">
          <LogoMark size={size} tone={tone} />
          <LogoWordmark size={size} tone={tone} />
        </span>
      </>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} tone={tone} />
      <LogoWordmark size={size} tone={tone} />
    </span>
  );
}

export function BrandLogo({
  href = "/",
  variant = "responsive",
  size = "nav",
  tone = "dark",
  className = "",
}: BrandLogoProps) {
  const content = <LogoContent variant={variant} size={size} tone={tone} />;
  const label = variant === "icon" ? "GestiOS icon" : "GestiOS";

  if (!href) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} aria-label={label}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`inline-flex items-center justify-center ${className}`} aria-label={label}>
      {content}
    </Link>
  );
}
