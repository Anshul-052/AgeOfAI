"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function SiteChrome({
  navigation,
  footer,
  children,
}: {
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      {!isLandingPage && navigation}
      <div className="min-h-0 flex-1">{children}</div>
      {!isLandingPage && footer}
    </div>
  );
}
