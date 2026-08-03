import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { jsonUnauthorized } from "@/lib/api-response";
import { isDemoAuthEnabled } from "@/lib/demo-auth-policy";

const DEV_USER_HEADER = "x-user-id";

/** Explicit API-only demo bypass. Disabled by default and always refused in production. */
export function isLocalDevAuthEnabled(): boolean {
  return isDemoAuthEnabled();
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const fromHeader = request.headers.get(DEV_USER_HEADER)?.trim();
  if (fromHeader) return fromHeader;

  return null;
}

async function resolveDevUser(request: NextRequest): Promise<User | null> {
  if (!isLocalDevAuthEnabled()) return null;

  const userId = getUserIdFromRequest(request);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function resolveCurrentUser(
  request: NextRequest,
): Promise<User | null> {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user) return user;
  }

  return resolveDevUser(request);
}

export async function requireUser(request: NextRequest) {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user) return { user, error: null };
  }

  const devUser = await resolveDevUser(request);
  if (devUser) return { user: devUser, error: null };

  if (isLocalDevAuthEnabled() && !getUserIdFromRequest(request)) {
    return {
      user: null as User | null,
      error: jsonUnauthorized(
        "Sign in or provide X-User-Id when the local demo bypass is explicitly enabled.",
      ),
    };
  }

  return {
    user: null as User | null,
    error: jsonUnauthorized("Kimlik doğrulama gerekli"),
  };
}
