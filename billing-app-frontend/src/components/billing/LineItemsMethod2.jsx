import { useState, useRef } from 'react'
import ProductDropdown from '../shared/ProductDropdown'
import HsnDropdown from '../shared/HsnDropdown'
import UnitDropdown from '../shared/UnitDropdown'

const LineItemsMethod2 = ({ lineItems, setLineItems, productState }) => {
  const [productSearch, setProductSearch] = useState({})
  const [hsnSearch, setHsnSearch] = useState({})
  const [showProductDropdown, setShowProductDropdown] = useState({})
  const [showHsnDropdown, setShowHsnDropdown] = useState({})
  const [showUnitDropdown, setShowUnitDropdown] = useState({})
  
  const productDropdownRefs = useRef({})
  const hsnDropdownRefs = useRef({})
  const unitDropdownRefs = useRef({})

  const addLineItem = () => {
    setLineItems([...lineItems, { 
      description: '', hsnCode: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 5 
    }])
  }

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    if (field === 'description' || field === 'hsnCode' || field === 'unit') {
      updated[index][field] = value
    } else {
      updated[index][field] = parseFloat(value) || 0
    }
    setLineItems(updated)
  }

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
      setProductSearch(prev => {
        const newSearch = { ...prev }
        delete newSearch[index]
        return newSearch
      })
      setHsnSearch(prev => {
        const newSearch = { ...prev }
        delete newSearch[index]
        return newSearch
      })
      setShowProductDropdown(prev => {
        const newShow = { ...prev }
        delete newShow[index]
        return newShow
      })
      setShowHsnDropdown(prev => {
        const newShow = { ...prev }
        delete newShow[index]
        return newShow
      })
      setShowUnitDropdown(prev => {
        const newShow = { ...prev }
        delete newShow[index]
        return newShow
      })
    }
  }

  const handleProductSearch = (index, value) => {
    setProductSearch(prev => ({ ...prev, [index]: value }))
    updateLineItem(index, 'description', value)
    setShowProductDropdown(prev => ({ ...prev, [index]: true }))
  }

  const handleProductSelect = (index, product) => {
    updateLineItem(index, 'description', product)
    setProductSearch(prev => ({ ...prev, [index]: product }))
    setShowProductDropdown(prev => ({ ...prev, [index]: false }))
  }

  const handleHsnSearch = (index, value) => {
    setHsnSearch(prev => ({ ...prev, [index]: value }))
    updateLineItem(index, 'hsnCode', value)
    setShowHsnDropdown(prev => ({ ...prev, [index]: true }))
  }

  const handleHsnSelect = (index, code) => {
    updateLineItem(index, 'hsnCode', code)
    setHsnSearch(prev => ({ ...prev, [index]: code }))
    setShowHsnDropdown(prev => ({ ...prev, [index]: false }))
  }

  const handleUnitSelect = (index, unit) => {
    updateLineItem(index, 'unit', unit)
    setShowUnitDropdown(prev => ({ ...prev, [index]: false }))
  }

  const getFilteredProducts = (index) => {
    const search = (productSearch[index] || '').toLowerCase()
    if (!search) return productState.products
    return productState.products.filter(p => p.toLowerCase().includes(search))
  }

  const getFilteredHsn = (index) => {
    const search = (hsnSearch[index] || '').toLowerCase()
    if (!search) return productState.hsnCodes
    return productState.hsnCodes.filter(h => 
      h.code.toLowerCase().includes(search) || 
      (h.description && h.description.toLowerCase().includes(search))
    )
  }

  return (
    <div className="form-section-group">
      <h3 className="section-title">Product Details (Method 2)</h3>
      <div className="line-items-table" style={{ overflowX: 'auto' }}>
        <div className="table-header" style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.8fr 0.7fr 0.8fr 0.5fr', 
          gap: '0.5rem', 
          minWidth: '1200px' 
        }}>
          <div>Product Description</div>
          <div>HSN Code</div>
          <div>Qty</div>
          <div>Unit</div>
          <div>Unit Price (₹)</div>
          <div>GST %</div>
          <div>Total (₹)</div>
          <div></div>
        </div>

        {lineItems.map((item, index) => {
          const itemTotal = item.quantity * item.unitPrice
          const itemGst = (itemTotal * item.gstRate) / 100
          const itemGrandTotal = itemTotal + itemGst
          const filteredProducts = getFilteredProducts(index)
          const filteredHsn = getFilteredHsn(index)
          
          return (
            <div key={index} className="table-row" style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.8fr 0.7fr 0.8fr 0.5fr', 
              gap: '0.5rem', 
              minWidth: '1200px', 
              alignItems: 'center' 
            }}>
              {/* Product Description */}
              <div>
                <ProductDropdown
                  index={index}
                  value={productSearch[index] !== undefined ? productSearch[index] : item.description}
                  onChange={(val) => handleProductSearch(index, val)}
                  onSelect={(product) => handleProductSelect(index, product)}
                  products={filteredProducts}
                  showDropdown={showProductDropdown[index]}
                  setShowDropdown={(show) => setShowProductDropdown(prev => ({ ...prev, [index]: show }))}
                  onAddNew={() => productState.setShowAddProduct(true)}
                  dropdownRef={el => productDropdownRefs.current[index] = el}
                  required
                />
              </div>

              {/* HSN Code */}
              <div>
                <HsnDropdown
                  index={index}
                  value={hsnSearch[index] !== undefined ? hsnSearch[index] : item.hsnCode}
                  onChange={(val) => handleHsnSearch(index, val)}
                  onSelect={(code) => handleHsnSelect(index, code)}
                  hsnCodes={filteredHsn}
                  showDropdown={showHsnDropdown[index]}
                  setShowDropdown={(show) => setShowHsnDropdown(prev => ({ ...prev, [index]: show }))}
                  onAddNew={() => productState.setShowAddHsn(true)}
                  dropdownRef={el => hsnDropdownRefs.current[index] = el}
                />
              </div>

              {/* Quantity */}
              <div>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  min="1"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Unit */}
              <div>
                <UnitDropdown
                  index={index}
                  value={item.unit}
                  onChange={(val) => updateLineItem(index, 'unit', val)}
                  onSelect={(unit) => handleUnitSelect(index, unit)}
                  units={productState.units}
                  showDropdown={showUnitDropdown[index]}
                  setShowDropdown={(show) => setShowUnitDropdown(prev => ({ ...prev, [index]: show }))}
                  onAddNew={() => productState.setShowAddUnit(true)}
                  dropdownRef={el => unitDropdownRefs.current[index] = el}
                  required
                />
              </div>

              {/* Unit Price */}
              <div>
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* GST Rate */}
              <div>
                <input
                  type="number"
                  value={item.gstRate}
                  onChange={(e) => updateLineItem(index, 'gstRate', e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Total */}
              <div>
                <span className="amount-display" style={{ display: 'block', textAlign: 'center' }}>
                  ₹{itemGrandTotal.toFixed(2)}
                </span>
              </div>

              {/* Remove button */}
              <div>
                {lineItems.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-remove-item" 
                    onClick={() => removeLineItem(index)}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button type="button" className="btn-add-item" onClick={addLineItem}>
        + Add Another Product
      </button>
    </div>
  )
}

export default LineItemsMethod2
