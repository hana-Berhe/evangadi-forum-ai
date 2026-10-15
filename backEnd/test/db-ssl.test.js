import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildDbSslOptions } from "../src/utility/dbSsl.js";

const PEM = "-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----";

describe("buildDbSslOptions (encrypted database connection)", () => {
  test("should not use SSL when DB_SSL is not true, as for a local database", () => {
    assert.equal(buildDbSslOptions({}), undefined);
    assert.equal(buildDbSslOptions({ DB_SSL: "false" }), undefined);
  });

  test("should always verify the server certificate when DB_SSL is true", () => {
    assert.deepEqual(buildDbSslOptions({ DB_SSL: "true" }), {
      rejectUnauthorized: true,
    });
  });

  test("should use a certificate pasted into DB_SSL_CA, including escaped line breaks", () => {
    const options = buildDbSslOptions({
      DB_SSL: "true",
      DB_SSL_CA: PEM.replace(/\n/g, "\\n"),
    });
    assert.equal(options.rejectUnauthorized, true);
    assert.equal(options.ca, PEM);
  });

  test("should read the certificate from a file when DB_SSL_CA is a path", () => {
    const file = path.join(os.tmpdir(), `db-ca-${process.pid}.pem`);
    fs.writeFileSync(file, PEM);
    try {
      const options = buildDbSslOptions({ DB_SSL: "true", DB_SSL_CA: file });
      assert.equal(options.ca, PEM);
    } finally {
      fs.rmSync(file);
    }
  });

  test("should fail at startup when DB_SSL_CA points to a missing file", () => {
    assert.throws(() =>
      buildDbSslOptions({ DB_SSL: "true", DB_SSL_CA: "/no/such/ca.pem" }),
    );
  });
});
