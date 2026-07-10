import { useState } from 'react';
import { useFormValidation, validators } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import styles from './LoginPage.module.css';

const schema = {
  email: [validators.required, validators.email],
  password: [validators.required, validators.minLength(8)],
};

export default function RegisterPage({ onBack }) {
  const { values, errors, touched, handleChange, handleBlur, validate } =
    useFormValidation({ email: '', password: '' }, schema);

  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSuccess(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Create Account</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            hint="Minimum 8 characters"
          />

          <button type="submit" className={styles.btn}>
            Register
          </button>
        </form>

        {success && (
          <p style={{ color: 'green', marginTop: '1rem' }}>
            Account created successfully!
          </p>
        )}

        <button
          onClick={onBack}
          className={styles.btn}
          style={{ marginTop: '1rem' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
