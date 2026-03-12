import './styleFloatingInput.css'

interface Props {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export default function FloatingInput({
  label,
  value,
  placeholder,
  onChange
}: Props) {

  const active = value && value.length > 0

  return (
    <div className={`floating-input ${active ? "active" : ""}`}>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e)=> { onChange(e.target.value) }}
      />

      <label>
        {label}
      </label>

    </div>
  )
}