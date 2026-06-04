import Image from "next/image";
import Link from "next/link";

type BrandLogoVariant = "full" | "icon" | "responsive";
type BrandLogoSize = "nav" | "auth" | "icon";

type BrandLogoProps = {
  href?: string;
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
};

const sizeClass: Record<BrandLogoSize, string> = {
  nav: "h-8 sm:h-10",
  auth: "h-12 sm:h-16",
  icon: "h-9 w-9 sm:h-10 sm:w-10",
};

function LogoImage({
  variant,
  size,
  priority,
}: {
  variant: Exclude<BrandLogoVariant, "responsive">;
  size: BrandLogoSize;
  priority?: boolean;
}) {
  if (variant === "icon") {
    return (
      <Image
        src="/brand/gestios-icon.png"
        alt="GestiOS icon"
        width={998}
        height={998}
        className={`${sizeClass.icon} rounded-xl object-contain`}
        sizes="40px"
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/brand/gestios-logo-full.png"
      alt="GestiOS"
      width={1447}
      height={567}
      className={`${sizeClass[size]} w-auto max-w-full object-contain`}
      sizes={size === "auth" ? "240px" : "180px"}
      priority={priority}
    />
  );
}

export function BrandLogo({
  href = "/",
  variant = "responsive",
  size = "nav",
  className = "",
  priority,
}: BrandLogoProps) {
  const content = variant === "responsive" ? (
    <>
      <span className="sm:hidden">
        <LogoImage variant="icon" size="icon" priority={priority} />
      </span>
      <span className="hidden sm:inline-flex">
        <LogoImage variant="full" size={size} priority={priority} />
      </span>
    </>
  ) : (
    <LogoImage variant={variant} size={size} priority={priority} />
  );

  if (!href) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} aria-label={variant === "icon" ? "GestiOS icon" : "GestiOS"}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`inline-flex items-center justify-center ${className}`} aria-label={variant === "icon" ? "GestiOS icon" : "GestiOS"}>
      {content}
    </Link>
  );
}
