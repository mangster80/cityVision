"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AuthCodeRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (!code || pathname === "/auth/callback") return;

    const callbackParams = new URLSearchParams(searchParams.toString());
    router.replace(`/auth/callback?${callbackParams.toString()}`);
  }, [code, pathname, router, searchParams]);

  return null;
}
