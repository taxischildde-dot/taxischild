type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  mono?: boolean;
  autoComplete?: string;
};

export default function FormField({
  id,
  label,
  value,
  placeholder,
  onChange,
  mono = false,
  autoComplete,
}: FormFieldProps) {
  const filled = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-signage text-muted"
      >
        {label}
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
            filled ? "bg-amber" : "bg-line"
          }`}
          aria-hidden="true"
        />
      </label>
      <input
        id={id}
        name={id}
        type="text"
        inputMode="text"
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-none border-0 border-b-2 border-line bg-transparent px-0.5 py-2 text-lg text-cream placeholder:text-muted/50 outline-none transition-colors focus:border-amber ${
          mono ? "font-mono uppercase tracking-wider" : "font-body"
        }`}
      />
    </div>
  );
}
