import { afterEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { authTest } from "./test.setup";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const phone = "01012345678";

async function requestResetCode(t: Awaited<ReturnType<typeof authTest>>) {
  const sms = vi.spyOn(console, "warn").mockImplementation(() => {});
  await t.action(api.auth.signIn, { provider: "password", params: { flow: "reset", phone } });
  const code = sms.mock.calls.flat().join(" ").match(/\d{6}$/)?.[0];
  if (!code) throw new Error("no reset code logged");
  return code;
}

async function resetWith(t: Awaited<ReturnType<typeof authTest>>, params: Record<string, unknown>) {
  try {
    await t.action(api.auth.signIn, {
      provider: "password",
      params: { flow: "reset-verification", newPassword: "newsecret1", ...params },
    });
    return "ok";
  } catch {
    return "rejected";
  }
}

test("a reset code can't be brute-forced past the rate limit by adding an email param", async () => {
  const t = await authTest();
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { flow: "signUp", name: "سارة", phone, password: "secret123" },
  });
  const code = await requestResetCode(t);

  for (let i = 0; i < 12; i++) {
    expect(await resetWith(t, { phone, code: "000000", email: `x${i}` })).toBe("rejected");
  }
  expect(await resetWith(t, { phone, code, email: "attacker" })).toBe("rejected");
  expect(await resetWith(t, { phone: "01099999999", code })).toBe("rejected");
});

test("the owner can reset with the code and their phone", async () => {
  const t = await authTest();
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { flow: "signUp", name: "سارة", phone, password: "secret123" },
  });
  const code = await requestResetCode(t);
  expect(await resetWith(t, { phone, code })).toBe("ok");
});
