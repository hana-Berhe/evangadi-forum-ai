import "../test-support/test-env.js";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authenticateUser } from "../src/middleware/authentication.js";

const SECRET = process.env.JWT_SECRET;
const user = { id: 7, firstName: "Hana", lastName: "Berhe" };

function runWithToken(token) {
  const req = { cookies: token === undefined ? {} : { token } };
  let calledNext = false;
  try {
    authenticateUser(req, {}, () => {
      calledNext = true;
    });
    return { req, calledNext, error: null };
  } catch (error) {
    return { req, calledNext, error };
  }
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("authenticateUser (checking the login cookie)", () => {
  test("should let the request through and attach the user when the token is valid", () => {
    const token = jwt.sign(user, SECRET, { algorithm: "HS256", expiresIn: "1h" });
    const result = runWithToken(token);
    assert.equal(result.error, null);
    assert.equal(result.calledNext, true);
    assert.deepEqual(result.req.user, user);
  });

  test("should reject the request with 401 when there is no login cookie", () => {
    const result = runWithToken(undefined);
    assert.equal(result.error.statusCode, 401);
    assert.equal(result.calledNext, false);
  });

  test("should tell the user the session expired when the token is past its expiry time", () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 60;
    const token = jwt.sign({ ...user, exp: expiredAt }, SECRET, {
      algorithm: "HS256",
    });
    const result = runWithToken(token);
    assert.equal(result.error.statusCode, 401);
    assert.match(result.error.message, /Session expired/);
    assert.equal(result.calledNext, false);
  });

  test("should reject a token signed with a different secret", () => {
    const token = jwt.sign(user, "someone-elses-secret", { algorithm: "HS256" });
    const result = runWithToken(token);
    assert.equal(result.error.statusCode, 401);
    assert.equal(result.error.message, "Authentication invalid");
  });

  test("should reject a token whose payload was edited after signing", () => {
    const token = jwt.sign(user, SECRET, { algorithm: "HS256", expiresIn: "1h" });
    const [header, , signature] = token.split(".");
    const forged = `${header}.${base64url({ ...user, id: 1 })}.${signature}`;
    const result = runWithToken(forged);
    assert.equal(result.error.statusCode, 401);
    assert.equal(result.calledNext, false);
  });

  test("should reject an unsigned token that uses the \"none\" algorithm", () => {
    const unsigned = `${base64url({ alg: "none", typ: "JWT" })}.${base64url(user)}.`;
    const result = runWithToken(unsigned);
    assert.equal(result.error.statusCode, 401);
    assert.equal(result.calledNext, false);
  });
});
