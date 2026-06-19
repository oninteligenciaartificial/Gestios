import Image from "next/image";

type LoadingLogoProps = {
  label?: string;
  fullScreen?: boolean;
};

export function LoadingLogo({
  label = "Cargando GestiOS",
  fullScreen = false,
}: LoadingLogoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 bg-brand-background text-white ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
      aria-live="polite"
      aria-label={label}
      role="status"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-brand-kinetic-orange/20" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-brand-kinetic-orange border-r-brand-kinetic-orange/70 animate-spin motion-reduce:animate-none" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_42px_rgba(255,107,0,0.24)]">
          <Image
            src="/brand/gestios-icon-on-dark.png"
            alt=""
            width={96}
            height={96}
            priority
            className="h-12 w-12 object-contain animate-spin motion-reduce:animate-none"
          />
        </div>
      </div>
      <Image
        src="/brand/gestios-logo-on-dark.png"
        alt="GestiOS"
        width={240}
        height={94}
        priority
        className="h-12 w-auto object-contain"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
