const UnitDropdown = ({ 
  
  value, 
  onChange, 
  onSelect, 
  units, 
  showDropdown, 
  setShowDropdown, 
  onAddNew,
  dropdownRef,
  required = false 
}) => {
  return (
    <div 
      className="autocomplete-field" 
      ref={dropdownRef}
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        required={required}
        style={{ width: '100%' }}
      />
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {units.map((unit, idx) => (
            <div
              key={idx}
              className="autocomplete-item"
              onClick={() => onSelect(unit)}
            >
              {unit}
            </div>
          ))}
          <div 
            className="autocomplete-item" 
            style={{ 
              borderTop: '1px solid var(--border)', 
              background: 'var(--bg-secondary)',
              fontWeight: 'bold',
              color: 'var(--accent)'
            }}
            onClick={onAddNew}
          >
            + Add New Unit
          </div>
        </div>
      )}
    </div>
  )
}

export default UnitDropdown
