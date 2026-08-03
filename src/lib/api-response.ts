import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status = 400,
  code?: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}

export function jsonFromZod(error: ZodError) {
  return jsonError("Geçersiz istek gövdesi", 400, "VALIDATION_ERROR", error.flatten());
}

export function jsonUnauthorized(message = "Kimlik doğrulama gerekli") {
  return jsonError(message, 401, "UNAUTHORIZED");
}

export function jsonForbidden(message = "Bu işlem için yetkiniz yok") {
  return jsonError(message, 403, "FORBIDDEN");
}

export function jsonNotFound(message = "Kayıt bulunamadı") {
  return jsonError(message, 404, "NOT_FOUND");
}
