"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full max-w-[8rem] text-xs md:max-w-none md:text-sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Çıkış yap
    </Button>
  );
}
