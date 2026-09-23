export default function TextInput({
  autoComplete,
  id,
  inputMode,
  label,
  multiline = false,
  name,
  onChange,
  onInvalid,
  error,
  showRequired = false,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  const controlId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const Control = multiline ? 'textarea' : 'input';

  return (
    <label className={`text-field ${multiline ? 'text-field--large' : ''}`} htmlFor={controlId}>
      <span id={`${controlId}-label`}>{label}{showRequired && required && <span aria-hidden="true"> *</span>}</span>
      <Control
        id={controlId}
        autoComplete={autoComplete}
        inputMode={inputMode}
        name={name}
        onChange={onChange}
        onInvalid={onInvalid}
        aria-invalid={error ? true : undefined}
        aria-labelledby={`${controlId}-label`}
        aria-describedby={error ? `${controlId}-error` : undefined}
        placeholder={placeholder}
        required={required}
        rows={multiline ? 5 : undefined}
        type={multiline ? undefined : type}
        value={value}
      />
      {error && <span className="text-field__error" id={`${controlId}-error`}>{error}</span>}
    </label>
  );
}
