export function validateRequired(fields, data) {
  const missing = fields.filter(
    (f) => data[f] === undefined || data[f] === null || data[f] === ""
  );
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(", ")}` };
  }
  return { valid: true };
}

export function validateStringLength(field, value, min, max) {
  if (typeof value !== "string") {
    return { valid: false, error: `${field} must be a string` };
  }
  if (value.length < min || value.length > max) {
    return { valid: false, error: `${field} must be between ${min} and ${max} characters` };
  }
  return { valid: true };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

export function validatePositiveNumber(field, value) {
  if (typeof value !== "number" || value <= 0) {
    return { valid: false, error: `${field} must be a positive number` };
  }
  return { valid: true };
}

export function validateEnum(field, value, allowed) {
  if (!allowed.includes(value)) {
    return { valid: false, error: `${field} must be one of: ${allowed.join(", ")}` };
  }
  return { valid: true };
}
