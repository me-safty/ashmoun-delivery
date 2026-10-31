/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { vi } from "vitest";
import schema from "../schema";

export const modules = import.meta.glob("../**/*.*s");

async function generateJwtKey() {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", privateKey));
  const base64 = btoa(String.fromCharCode(...der));
  return `-----BEGIN PRIVATE KEY----- ${base64} -----END PRIVATE KEY-----`;
}

export async function authTest() {
  vi.stubEnv("JWT_PRIVATE_KEY", await generateJwtKey());
  vi.stubEnv("CONVEX_SITE_URL", "https://test.convex.site");
  vi.stubEnv("SITE_URL", "http://localhost:8081");
  return convexTest(schema, modules);
}
