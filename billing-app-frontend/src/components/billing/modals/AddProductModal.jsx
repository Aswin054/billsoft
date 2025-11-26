import { useRef, useEffect } from 'react'

const AddProductModal = ({ productState }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        productState.setShowAddProduct(false)
      }
    }

    if (productState.showAddProduct) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [productState.showAddProduct])

  if (!productState.showAddProduct) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div 
        ref={modalRef}
        style={{
          background: 'var(--bg-card)',
          padding: '2rem',
          borderRadius: '12px',
          minWidth: '400px',
          border: '1px solid var(--border)'
        }}
      >
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add New Product</h3>
        <input
          type="text"
          value={productState.newProductName}
          onChange={(e) => productState.setNewProductName(e.target.value)}
          placeholder="Enter product name"
          className="form-input"
          style={{ marginBottom: '1rem' }}
          onKeyPress={(e) => e.key === 'Enter' && productState.handleAddProduct()}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button"
            onClick={productState.handleAddProduct}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            Add Product
          </button>
          <button 
            type="button"
            onClick={() => {
              productState.setShowAddProduct(false)
              productState.setNewProductName('')
            }}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddProductModal
