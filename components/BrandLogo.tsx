import Image from "next/image";
import Link from "next/link";

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

const sizeClass: Record<BrandLogoSize, string> = {
  nav: "h-8 sm:h-10",
  landing: "h-12 sm:h-14 md:h-16",
  auth: "h-12 sm:h-16",
  icon: "h-9 w-9 sm:h-10 sm:w-10",
};

function LogoImage({
  variant,
  size,
  tone,
  priority,
}: {
  variant: Exclude<BrandLogoVariant, "responsive">;
  size: BrandLogoSize;
  tone: BrandLogoTone;
  priority?: boolean;
}) {
  const darkClass = tone === "dashboard" ? "dashboard-logo-dark" : "";
  const lightClass = tone === "dashboard" ? "dashboard-logo-light" : "";

  if (variant === "icon") {
    if (tone === "dashboard") {
      return (
        <>
          <Image
            src="/brand/gestios-icon-on-dark.png"
            alt="GestiOS icon"
            width={998}
            height={998}
            className={`${sizeClass.icon} ${darkClass} object-contain`}
            sizes="40px"
            priority={priority}
          />
          <Image
            src="/brand/gestios-icon.png"
            alt="GestiOS icon"
            width={998}
            height={998}
            className={`${sizeClass.icon} ${lightClass} rounded-xl object-contain`}
            sizes="40px"
            priority={priority}
          />
        </>
      );
    }

    return (
      <Image
        src={tone === "dark" ? "/brand/gestios-icon-on-dark.png" : "/brand/gestios-icon.png"}
        alt="GestiOS icon"
        width={998}
        height={998}
        className={`${sizeClass.icon} ${tone === "dark" ? "" : "rounded-xl"} object-contain`}
        sizes="40px"
        priority={priority}
      />
    );
  }

  if (tone === "dashboard") {
    return (
      <>
        <Image
          src="/brand/gestios-logo-on-dark.png"
          alt="GestiOS"
          width={1447}
          height={567}
          className={`${sizeClass[size]} ${darkClass} w-auto max-w-full object-contain`}
          sizes={size === "auth" ? "240px" : "180px"}
          priority={priority}
        />
        <Image
          src="/brand/gestios-logo-full.png"
          alt="GestiOS"
          width={1447}
          height={567}
          className={`${sizeClass[size]} ${lightClass} w-auto max-w-full object-contain`}
          sizes={size === "auth" ? "240px" : "180px"}
          priority={priority}
        />
      </>
    );
  }

  return (
    <Image
      src={tone === "dark" ? "/brand/gestios-logo-on-dark.png" : "/brand/gestios-logo-full.png"}
      alt="GestiOS"
      width={1447}
      height={567}
      className={`${sizeClass[size]} w-auto max-w-full object-contain`}
      sizes={size === "auth" ? "240px" : size === "landing" ? "220px" : "180px"}
      priority={priority}
    />
  );
}

export function BrandLogo({
  href = "/",
  variant = "responsive",
  size = "nav",
  tone = "light",
  className = "",
  priority,
}: BrandLogoProps) {
  const content = variant === "responsive" ? (
    <>
      <span className="sm:hidden">
        <LogoImage variant="icon" size="icon" tone={tone} priority={priority} />
      </span>
      <span className="hidden sm:inline-flex">
        <LogoImage variant="full" size={size} tone={tone} priority={priority} />
      </span>
    </>
  ) : (
    <LogoImage variant={variant} size={size} tone={tone} priority={priority} />
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
