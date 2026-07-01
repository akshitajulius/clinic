import styles from './FormField.module.css';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  hint,
  required,
  min,
  max,
  maxLength,
  options, // for <select>
}) {
  const showError = touched && error;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>

      {hint && <span className={styles.hint}>{hint}</span>}

      {options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${styles.input} ${showError ? styles.inputError : ''}`}
          aria-describedby={showError ? `${name}-error` : undefined}
          aria-invalid={showError ? 'true' : undefined}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
          className={`${styles.input} ${showError ? styles.inputError : ''}`}
          aria-describedby={showError ? `${name}-error` : undefined}
          aria-invalid={showError ? 'true' : undefined}
        />
      )}

      {showError && (
        <span id={`${name}-error`} className={styles.error} role="alert">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}
