const users = [
  {
    email: "admin@gmail.com",
    password: "12345678",
    role: "admin",
  },
];

export function registerUser(email, password) {
  if (!email) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const existingUser = users.find(
    (user) => user.email === email
  );

  if (existingUser) {
    throw new Error("User already exists");
  }

  const user = {
    email,
    password,
    role: "patient",
  };

  users.push(user);

  return user;
}

export function loginUser(email, password) {
  const user = users.find(
    (user) =>
      user.email === email &&
      user.password === password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  return user;
}