import { useState, useRef } from 'react'
import ProductDropdown from '../shared/ProductDropdown'

const LineItemsMethod1 = ({ lineItems, setLineItems, productState }) => {
  const [productSearch, setProductSearch] = useState({})
  const [showProductDropdown, setShowProductDropdown] = useState({})
  const productDropdownRefs = useRef({})

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, price: 0 }])
  }

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = field === 'description' ? value : parseFloat(value) || 0
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
      setShowProductDropdown(prev => {
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

  const getFilteredProducts = (index) => {
    const search = (productSearch[index] || '').toLowerCase()
    if (!search) return productState.products
    return productState.products.filter(p => p.toLowerCase().includes(search))
  }

  return (
    <div className="form-section-group">
      <h3 className="section-title">Product Details (Method 1)</h3>
      <div className="line-items-table">
        <div className="table-header">
          <div className="col-description">Product Description</div>
          <div className="col-quantity">Qty</div>
          <div className="col-price">Rate (₹)</div>
          <div className="col-total">Amount (₹)</div>
          <div className="col-taxable">Taxable Value (₹)</div>
          <div className="col-action"></div>
        </div>

        {lineItems.map((item, index) => {
          const itemAmount = (item.quantity * item.price).toFixed(2)
          const filteredProducts = getFilteredProducts(index)
          
          return (
            <div key={index} className="table-row">
              <div className="col-description">
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
              <div className="col-quantity">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="col-price">
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.price}
                  onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="col-total">
                <span className="amount-display">₹{itemAmount}</span>
              </div>
              <div className="col-taxable">
                <span className="amount-display">₹{itemAmount}</span>
              </div>
              <div className="col-action">
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

export default LineItemsMethod1
