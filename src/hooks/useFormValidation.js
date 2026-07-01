import { useState } from 'react';

const validators = {
  required: (value) =>
    !value || value.toString().trim() === '' ? 'This field is required.' : null,

  email: (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? 'Enter a valid email address.'
      : null,

  minLength: (min) => (value) =>
    value && value.length < min ? `Must be at least ${min} characters.` : null,

  maxLength: (max) => (value) =>
    value && value.length > max ? `Must be ${max} characters or fewer.` : null,

  min: (min) => (value) =>
    value !== '' && Number(value) < min ? `Must be at least ${min}.` : null,

  max: (max) => (value) =>
    value !== '' && Number(value) > max ? `Must be ${max} or less.` : null,

  numeric: (value) =>
    value && isNaN(Number(value)) ? 'Must be a number.' : null,

  match: (otherValue, label) => (value) =>
    value !== otherValue ? `Must match ${label}.` : null,
};

function runValidators(value, rules) {
  for (const rule of rules) {
    const error = typeof rule === 'function' ? rule(value) : validators[rule]?.(value);
    if (error) return error;
  }
  return null;
}

export function useFormValidation(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = runValidators(value, schema[name] || []);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = runValidators(value, schema[name] || []);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validate = () => {
    const newErrors = {};
    const newTouched = {};
    let valid = true;
    for (const field of Object.keys(schema)) {
      newTouched[field] = true;
      const error = runValidators(values[field] ?? '', schema[field] || []);
      if (error) { newErrors[field] = error; valid = false; }
    }
    setErrors(newErrors);
    setTouched(newTouched);
    return valid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, validate, reset, setValues };
}

export { validators };
