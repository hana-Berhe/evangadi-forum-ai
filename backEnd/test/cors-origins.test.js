import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseCorsOrigins } from "../src/utility/corsOrigins.js";

describe("parseCorsOrigins (which websites may call the API)", () => {
  test("should allow no other website when CORS_ORIGINS is missing or empty", () => {
    assert.deepEqual(parseCorsOrigins(undefined), []);
    assert.deepEqual(parseCorsOrigins(""), []);
  });

  test("should split a comma-separated list and trim spaces", () => {
    assert.deepEqual(
      parseCorsOrigins(" http://localhost:5173 , https://forum.example.com "),
      ["http://localhost:5173", "https://forum.example.com"],
    );
  });

  test("should remove a trailing slash so the origin matches what browsers send", () => {
    assert.deepEqual(parseCorsOrigins("https://forum.example.com/"), [
      "https://forum.example.com",
    ]);
  });

  test("should ignore empty entries left by extra commas", () => {
    assert.deepEqual(parseCorsOrigins("http://localhost:5173,,"), [
      "http://localhost:5173",
    ]);
  });
});
