import { useRef, useEffect } from 'react'

const AddUnitModal = ({ productState }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        productState.setShowAddUnit(false)
      }
    }

    if (productState.showAddUnit) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [productState.showAddUnit])

  if (!productState.showAddUnit) return null

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
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add New Unit</h3>
        <input
          type="text"
          value={productState.newUnitName}
          onChange={(e) => productState.setNewUnitName(e.target.value)}
          placeholder="Enter unit name (e.g., Box, Kg)"
          className="form-input"
          style={{ marginBottom: '1rem' }}
          onKeyPress={(e) => e.key === 'Enter' && productState.handleAddUnit()}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button"
            onClick={productState.handleAddUnit}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            Add Unit
          </button>
          <button 
            type="button"
            onClick={() => {
              productState.setShowAddUnit(false)
              productState.setNewUnitName('')
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

export default AddUnitModal
