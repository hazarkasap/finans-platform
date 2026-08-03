const required = ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Refusing production startup: missing ${missing.join(", ")}.`);
  process.exit(1);
}

const secret = process.env.AUTH_SECRET;
const placeholders = ["change", "replace", "example", "placeholder", "secret-here"];
if (secret.length < 32 || placeholders.some((word) => secret.toLowerCase().includes(word))) {
  console.error("Refusing production startup: AUTH_SECRET is weak or placeholder-like.");
  process.exit(1);
}

if (!/^https:\/\//.test(process.env.AUTH_URL)) {
  console.error("Refusing production startup: AUTH_URL must use HTTPS.");
  process.exit(1);
}
