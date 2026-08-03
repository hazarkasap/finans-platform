import bcrypt from "bcryptjs";
import { z } from "zod";

import { jsonError, jsonFromZod, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  displayName: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { email, password, displayName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return jsonError("Bu e-posta adresi zaten kayıtlı", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: displayName ?? normalizedEmail.split("@")[0],
      locale: "tr",
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  return jsonOk({ user }, 201);
}
