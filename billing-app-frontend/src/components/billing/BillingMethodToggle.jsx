const BillingMethodToggle = ({ billingMethod, setBillingMethod }) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '2rem',
      padding: '1rem',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--border)'
    }}>
      <button
        type="button"
        onClick={() => setBillingMethod('method1')}
        style={{
          flex: 1,
          padding: '0.75rem 1.5rem',
          border: billingMethod === 'method1' ? '2px solid var(--accent)' : '1px solid var(--border)',
          background: billingMethod === 'method1' ? 'var(--accent)' : 'var(--bg-card)',
          color: billingMethod === 'method1' ? 'white' : 'var(--text-primary)',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: billingMethod === 'method1' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        📋 Method 1: Fixed GST Rate
      </button>
      <button
        type="button"
        onClick={() => setBillingMethod('method2')}
        style={{
          flex: 1,
          padding: '0.75rem 1.5rem',
          border: billingMethod === 'method2' ? '2px solid var(--accent)' : '1px solid var(--border)',
          background: billingMethod === 'method2' ? 'var(--accent)' : 'var(--bg-card)',
          color: billingMethod === 'method2' ? 'white' : 'var(--text-primary)',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: billingMethod === 'method2' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        📊 Method 2: Individual Item GST
      </button>
    </div>
  )
}

export default BillingMethodToggle
