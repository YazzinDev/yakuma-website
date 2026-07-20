export default function TextInput({
  autoComplete,
  id,
  inputMode,
  label,
  multiline = false,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  const controlId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const Control = multiline ? 'textarea' : 'input';

  return (
    <label className={`text-field ${multiline ? 'text-field--large' : ''}`} htmlFor={controlId}>
      <span>{label}</span>
      <Control
        id={controlId}
        autoComplete={autoComplete}
        inputMode={inputMode}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={multiline ? 5 : undefined}
        type={multiline ? undefined : type}
        value={value}
      />
    </label>
  );
}
