export function isDemoAuthEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.NODE_ENV !== "production" && environment.ALLOW_DEMO_AUTH === "true";
}
