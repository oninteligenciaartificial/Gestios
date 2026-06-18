"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DENTALGEST_BLOCKED_ROUTE_FALLBACK,
  isDentalGestDashboardRouteAllowed,
  isDentalGestOperationalMode,
} from "@/lib/dentalgest-mode";

interface Props {
  businessType: string;
}

export function DentalGestModeGuard({ businessType }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isDentalGestOperationalMode(businessType)) return;
    if (isDentalGestDashboardRouteAllowed(pathname)) return;

    router.replace(DENTALGEST_BLOCKED_ROUTE_FALLBACK);
  }, [businessType, pathname, router]);

  return null;
}
