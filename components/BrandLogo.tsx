import Link from "next/link";
import Image from "next/image";

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

const fullLogoSizeClass: Record<BrandLogoSize, string> = {
  nav: "h-8 w-auto sm:h-9",
  landing: "h-14 w-auto sm:h-16",
  auth: "h-12 w-auto sm:h-14",
  icon: "h-9 w-auto sm:h-10",
};

const iconLogoSizeClass: Record<BrandLogoSize, string> = {
  nav: "h-8 w-8 sm:h-9 sm:w-9",
  landing: "h-12 w-12 sm:h-14 sm:w-14",
  auth: "h-11 w-11 sm:h-12 sm:w-12",
  icon: "h-9 w-9 sm:h-10 sm:w-10",
};

function logoAsset(tone: BrandLogoTone, iconOnly: boolean) {
  const onDark = tone !== "light";

  if (iconOnly) {
    return onDark ? "/brand/gestios-icon-on-dark.png" : "/brand/gestios-icon.png";
  }

  return onDark ? "/brand/gestios-logo-on-dark.png" : "/brand/gestios-logo-full.png";
}

function LogoImage({
  iconOnly,
  size,
  tone,
  priority,
}: {
  iconOnly: boolean;
  size: BrandLogoSize;
  tone: BrandLogoTone;
  priority?: boolean;
}) {
  return (
    <Image
      src={logoAsset(tone, iconOnly)}
      alt=""
      width={iconOnly ? 160 : 320}
      height={iconOnly ? 160 : 126}
      className={`${iconOnly ? iconLogoSizeClass[size] : fullLogoSizeClass[size]} shrink-0 object-contain object-left`}
      priority={priority}
      sizes={iconOnly ? "48px" : "(max-width: 640px) 48px, 180px"}
    />
  );
}

function LogoContent({
  variant,
  size,
  tone,
  priority,
}: {
  variant: BrandLogoVariant;
  size: BrandLogoSize;
  tone: BrandLogoTone;
  priority?: boolean;
}) {
  if (variant === "icon") return <LogoImage iconOnly size={size} tone={tone} priority={priority} />;

  if (variant === "responsive") {
    return (
      <>
        <span className="sm:hidden">
          <LogoImage iconOnly size="icon" tone={tone} priority={priority} />
        </span>
        <span className="hidden sm:inline-flex items-center gap-2.5">
          <LogoImage iconOnly={false} size={size} tone={tone} priority={priority} />
        </span>
      </>
    );
  }

  return (
    <span className="inline-flex items-center">
      <LogoImage iconOnly={false} size={size} tone={tone} priority={priority} />
    </span>
  );
}

export function BrandLogo({
  href = "/",
  variant = "responsive",
  size = "nav",
  tone = "dark",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const content = <LogoContent variant={variant} size={size} tone={tone} priority={priority} />;
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
