import { requireAdmin } from "../src/backend/modules/auth.js";

describe("Authentication Module", () => {

  test("patient cannot access admin actions", () => {

    expect(() =>
      requireAdmin({
        role: "patient"
      })
    ).toThrow(
      "Administrator access required."
    );

  });

  test("admin is allowed", () => {

    expect(
      requireAdmin({
        role: "admin"
      })
    ).toBe(true);

  });

});