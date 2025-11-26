const ProductDropdown = ({ 
  
  value, 
  onChange, 
  onSelect, 
  products, 
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
        placeholder="Type or select product"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        required={required}
        style={{ width: '100%' }}
      />
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {products.length > 0 ? (
            products.map((product, idx) => (
              <div
                key={idx}
                className="autocomplete-item"
                onClick={() => onSelect(product)}
              >
                {product}
              </div>
            ))
          ) : (
            <div className="autocomplete-item" style={{ color: '#888', cursor: 'default' }}>
              No matching products
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
            + Add New Product
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDropdown
