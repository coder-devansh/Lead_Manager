import test from "node:test";
import assert from "node:assert/strict";
import Lead from "../src/models/Lead.js";

test("Lead requires core fields", () => {
  const lead = new Lead({});
  const errors = lead.validateSync();
  assert.ok(errors.errors.name);
  assert.ok(errors.errors.email);
  assert.ok(errors.errors.phone);
  assert.ok(errors.errors.company);
  assert.ok(errors.errors.source);
});

test("Lead accepts valid values and defaults to New", () => {
  const lead = new Lead({
    name: "Sam Taylor",
    email: "SAM@example.com",
    phone: "+1 555 123 4567",
    company: "Acme",
    source: "Website"
  });
  assert.equal(lead.validateSync(), undefined);
  assert.equal(lead.status, "New");
  assert.equal(lead.email, "sam@example.com");
});

test("Lead rejects invalid email and enum values", () => {
  const lead = new Lead({
    name: "Sam Taylor",
    email: "not-an-email",
    phone: "555",
    company: "Acme",
    source: "Unknown",
    status: "Unknown"
  });
  const errors = lead.validateSync();
  assert.ok(errors.errors.email);
  assert.ok(errors.errors.source);
  assert.ok(errors.errors.status);
});
