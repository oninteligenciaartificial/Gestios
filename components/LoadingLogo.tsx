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
      className={`flex items-center justify-center bg-brand-background text-white ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
      aria-live="polite"
      aria-label={label}
      role="status"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-brand-kinetic-orange/20" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-brand-kinetic-orange border-r-brand-kinetic-orange/70 animate-spin motion-reduce:animate-none" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-[0_0_42px_rgba(255,107,0,0.22)]">
          <Image
            src="/brand/gestios-icon-on-dark.png"
            alt=""
            width={998}
            height={998}
            className="h-11 w-11 animate-spin object-contain motion-reduce:animate-none"
            priority
          />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
