import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl } from "./config.js";

describe("normalizeApiBaseUrl", () => {
  it("should keep a correct address as it is", () => {
    expect(normalizeApiBaseUrl("https://my-api.onrender.com/api")).toBe(
      "https://my-api.onrender.com/api",
    );
  });

  it("should remove a trailing slash", () => {
    expect(normalizeApiBaseUrl("https://my-api.onrender.com/api/")).toBe(
      "https://my-api.onrender.com/api",
    );
  });

  it('should add "/api" when it is missing', () => {
    expect(normalizeApiBaseUrl("https://my-api.onrender.com")).toBe(
      "https://my-api.onrender.com/api",
    );
    expect(normalizeApiBaseUrl("https://my-api.onrender.com/")).toBe(
      "https://my-api.onrender.com/api",
    );
  });

  it("should ignore spaces around the address", () => {
    expect(normalizeApiBaseUrl("  http://localhost:5000/api  ")).toBe(
      "http://localhost:5000/api",
    );
  });

  it("should fall back to the same-site /api proxy when nothing is set", () => {
    expect(normalizeApiBaseUrl(undefined)).toBe("/api");
    expect(normalizeApiBaseUrl("")).toBe("/api");
  });
});
