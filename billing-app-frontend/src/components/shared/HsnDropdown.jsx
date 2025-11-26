const HsnDropdown = ({ 
  
  value, 
  onChange, 
  onSelect, 
  hsnCodes, 
  showDropdown, 
  setShowDropdown, 
  onAddNew,
  dropdownRef 
}) => {
  return (
    <div 
      className="autocomplete-field" 
      ref={dropdownRef}
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        type="text"
        placeholder="HSN Code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        style={{ width: '100%' }}
      />
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {hsnCodes.length > 0 ? (
            hsnCodes.map((hsn, idx) => (
              <div
                key={idx}
                className="autocomplete-item"
                onClick={() => onSelect(hsn.code)}
              >
                <strong>{hsn.code}</strong> {hsn.description && `- ${hsn.description}`}
              </div>
            ))
          ) : (
            <div className="autocomplete-item" style={{ color: '#888', cursor: 'default' }}>
              No matching HSN codes
            </div>
          )}
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
            + Add New HSN Code
          </div>
        </div>
      )}
    </div>
  )
}

export default HsnDropdown
