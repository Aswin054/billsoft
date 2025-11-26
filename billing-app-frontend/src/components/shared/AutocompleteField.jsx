import { useRef, useEffect } from 'react'

const AutocompleteField = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  suggestions = [],
  showSuggestions,
  onFocus,
  onSelect,
  fieldName,
  className = "form-input",
  required = false,
  transform = null
}) => {
  const fieldRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target)) {
        // Close suggestions (handled in parent)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const val = transform ? transform(e.target.value) : e.target.value
    onChange(val)
  }

  return (
    <div className="form-field autocomplete-field" ref={fieldRef}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        className={className}
        placeholder={placeholder}
        required={required}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="autocomplete-item"
              onClick={() => onSelect(fieldName, suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AutocompleteField
