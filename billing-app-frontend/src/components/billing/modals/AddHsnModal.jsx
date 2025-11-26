import { useRef, useEffect } from 'react'

const AddHsnModal = ({ productState }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        productState.setShowAddHsn(false)
      }
    }

    if (productState.showAddHsn) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [productState.showAddHsn])

  if (!productState.showAddHsn) return null

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
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add New HSN Code</h3>
        <input
          type="text"
          value={productState.newHsnCode}
          onChange={(e) => productState.setNewHsnCode(e.target.value)}
          placeholder="Enter HSN code (e.g., 3402)"
          className="form-input"
          style={{ marginBottom: '1rem' }}
          autoFocus
        />
        <input
          type="text"
          value={productState.newHsnDescription}
          onChange={(e) => productState.setNewHsnDescription(e.target.value)}
          placeholder="Enter description (optional)"
          className="form-input"
          style={{ marginBottom: '1rem' }}
          onKeyPress={(e) => e.key === 'Enter' && productState.handleAddHsn()}
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button"
            onClick={productState.handleAddHsn}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            Add HSN Code
          </button>
          <button 
            type="button"
            onClick={() => {
              productState.setShowAddHsn(false)
              productState.setNewHsnCode('')
              productState.setNewHsnDescription('')
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

export default AddHsnModal
