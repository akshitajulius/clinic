import { useState } from 'react';
import { useFormValidation, validators } from '../hooks/useFormValidation';
import { useNotifications } from '../context/NotificationContext';
import FormField from '../components/FormField';
import styles from './LoginPage.module.css';

const schema = {
  email: [validators.required, validators.email],
  password: [validators.required, validators.minLength(8)],
};

export default function LoginPage({ onLogin }) {
  const { values, errors, touched, handleChange, handleBlur, validate } =
    useFormValidation({ email: '', password: '' }, schema);
  const { addNotification } = useNotifications();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      addNotification('Welcome back! You have been logged in.', 'info');
      onLogin?.();
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M8 22V14l8-6 8 6v8H20v-5h-4v5H8z" fill="white" opacity="0.9"/>
            <circle cx="16" cy="13" r="2" fill="white"/>
          </svg>
          <span className={styles.brand}>QueueSmart</span>
        </div>
        <h1 className={styles.heading}>Sign in to your account</h1>
        <p className={styles.sub}>Enter your clinic credentials below.</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField
            label="Email address"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            placeholder="you@example.com"
            required
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
            placeholder="••••••••"
            hint="Minimum 8 characters"
            required
          />

          <button type="submit" className={styles.btn} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <a href="#" className={styles.link}>Create one</a>
        </p>
      </div>
    </div>
  );
}
