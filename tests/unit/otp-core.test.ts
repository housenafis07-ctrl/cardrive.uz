import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../lib/otp-core.ts";

const originalSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

before(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "cardrive-unit-test-secret-not-for-production";
});

after(() => {
  if (originalSecret === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalSecret;
});

describe("OTP cryptographic primitives", () => {
  it("generates six-digit numeric codes in the permitted range", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const code = generateOtpCode();
      assert.match(code, /^\d{6}$/);
      assert.ok(Number(code) >= 100_000 && Number(code) <= 999_999);
    }
  });

  it("stores an HMAC digest rather than the plaintext code", () => {
    const code = "042681";
    const digest = hashOtpCode(code);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.notEqual(digest, code);
    assert.equal(hashOtpCode(code), digest);
    assert.equal(hashOtpCode(" 042681 "), digest);
  });

  it("accepts the matching code and rejects a different code", () => {
    const digest = hashOtpCode("582104");
    assert.equal(verifyOtpCode("582104", digest), true);
    assert.equal(verifyOtpCode("582105", digest), false);
    assert.equal(verifyOtpCode("582104", "not-a-valid-digest"), false);
  });

  it("fails closed when the server-side pepper is absent", () => {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      assert.throws(() => hashOtpCode("123456"), /secret is not configured/);
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = secret;
    }
  });
});
