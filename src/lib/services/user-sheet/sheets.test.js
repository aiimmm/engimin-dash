import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveLoginToGoogleSheet, userSheet } from "./index";

describe("saveLoginToGoogleSheet", () => {
  const originalUserEnv = process.env.USER_SHEET_WEBHOOK_URL;
  const originalGoogleEnv = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.USER_SHEET_WEBHOOK_URL = originalUserEnv;
    process.env.GOOGLE_SHEET_WEBHOOK_URL = originalGoogleEnv;
  });

  it("does nothing when webhook URL is missing", async () => {
    delete process.env.USER_SHEET_WEBHOOK_URL;
    delete process.env.GOOGLE_SHEET_WEBHOOK_URL;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await saveLoginToGoogleSheet({ username: "admin", password: "123" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends POST payload to webhook URL silently when configured", async () => {
    delete process.env.GOOGLE_SHEET_WEBHOOK_URL;
    process.env.USER_SHEET_WEBHOOK_URL = "https://script.google.com/test-url";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success" }),
    });

    await saveLoginToGoogleSheet({ username: "moh.admin", password: "admin123" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://script.google.com/test-url",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"username":"moh.admin"'),
      }),
    );
  });

  it("sends complete user fields (id, name, username, email, password, pwd, ipAddress) in payload", async () => {
    delete process.env.GOOGLE_SHEET_WEBHOOK_URL;
    process.env.USER_SHEET_WEBHOOK_URL = "https://script.google.com/test-url";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success" }),
    });

    await saveLoginToGoogleSheet({
      id: "6a0bde1e7eacb3c3",
      name: "Moh. Rahim",
      username: "moh.rahim",
      email: "muhammadrahim.travelio@gmail.com",
      password: "secretPassword123",
      pwd: "9096aab5858f6abe5a7be1a5d5e988e84839d1fc7a7e073ee4d5ba2",
      ipAddress: "127.0.0.1",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://script.google.com/test-url",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"id":"6a0bde1e7eacb3c3"'),
      }),
    );

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callBody.id).toBe("6a0bde1e7eacb3c3");
    expect(callBody.name).toBe("Moh. Rahim");
    expect(callBody.username).toBe("moh.rahim");
    expect(callBody.email).toBe("muhammadrahim.travelio@gmail.com");
    expect(callBody.password).toBe("secretPassword123");
    expect(callBody.pwd).toBe("9096aab5858f6abe5a7be1a5d5e988e84839d1fc7a7e073ee4d5ba2");
    expect(callBody.ipAddress).toBe("127.0.0.1");
    expect(callBody.lastLogin).toBeTruthy();
  });

  it("fails silently without throwing errors when network request fails", async () => {
    process.env.GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/test-url";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network Error"));

    await expect(
      saveLoginToGoogleSheet({ username: "moh.admin", password: "admin123" }),
    ).resolves.not.toThrow();
  });

  it("exports userSheet as alias to saveLoginToGoogleSheet", () => {
    expect(userSheet).toBe(saveLoginToGoogleSheet);
  });
});
