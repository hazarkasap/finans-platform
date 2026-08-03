import { expect, test } from "vitest";

import { isDemoAuthEnabled } from "@/lib/demo-auth-policy";

test("demo authentication is opt-in", () => {
  expect(isDemoAuthEnabled({ NODE_ENV: "development", ALLOW_DEMO_AUTH: "false" })).toBe(false);
  expect(isDemoAuthEnabled({ NODE_ENV: "development", ALLOW_DEMO_AUTH: "true" })).toBe(true);
});

test("demo authentication always fails closed in production", () => {
  expect(isDemoAuthEnabled({ NODE_ENV: "production", ALLOW_DEMO_AUTH: "true" })).toBe(false);
});
