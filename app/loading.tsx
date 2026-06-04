import { BrandLogo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background">
      <div className="rounded-2xl bg-white p-3 animate-pop" aria-live="polite">
        <BrandLogo href="" variant="icon" size="icon" priority />
      </div>
    </div>
  );
}
