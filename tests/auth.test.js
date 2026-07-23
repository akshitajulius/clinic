import {
  registerUser,
  loginUser,
} from "../src/backend/modules/auth";

describe("Authentication Module", () => {

  test("registers a patient", () => {
    const user = registerUser(
      "patient@test.com",
      "12345678"
    );

    expect(user.role).toBe("patient");
  });

  test("admin login works", () => {
    const user = loginUser(
      "admin@gmail.com",
      "12345678"
    );

    expect(user.role).toBe("admin");
  });

  test("email is required", () => {
    expect(() =>
      registerUser("", "12345678")
    ).toThrow();
  });

  test("password is required", () => {
    expect(() =>
      registerUser(
        "test@test.com",
        ""
      )
    ).toThrow();
  });

});
