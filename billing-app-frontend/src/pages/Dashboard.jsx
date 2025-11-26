import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { companiesApi } from '../api/client'

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', gst: '' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.getAll()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['companies'])
      setShowForm(false)
      setFormData({ name: '', address: '', gst: '' })
    },
    onError: (error) => {
      console.error('Error creating company:', error)
      alert('Failed to create company. Please try again.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim() || !formData.address.trim() || !formData.gst.trim()) {
      alert('Please fill in all fields')
      return
    }
    
    createMutation.mutate(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCardClick = (companyId) => {
    if (companyId && companyId !== 'undefined') {
      navigate(`/companies/${companyId}`)
    } else {
      console.error('Invalid company ID:', companyId)
    }
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Error Loading Companies</h2>
          <p>There was a problem loading the companies. Please try again.</p>
          <button 
            className="btn-primary" 
            onClick={() => queryClient.invalidateQueries(['companies'])}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Enterprise Companies</h1>
          <p className="text-muted">Manage your billing companies and supply partners</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Company'}
        </button>
      </header>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>New Company</h3>
          <input
            type="text"
            placeholder="Company Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            autoFocus
          />
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            required
            rows="3"
          />
          <input
            type="text"
            placeholder="GST Number (e.g., 22AAAAA0000A1Z5)"
            value={formData.gst}
            onChange={(e) => handleChange('gst', e.target.value.toUpperCase())}
            required
            maxLength="15"
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Company'}
          </button>
          {createMutation.isError && (
            <p className="error-text">Failed to create company. Please try again.</p>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading companies...</p>
        </div>
      ) : !companies || companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No Companies Yet</h3>
          <p className="text-muted">Get started by adding your first company</p>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Add Your First Company
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total Companies</span>
              <span className="stat-value">{companies.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Partners</span>
              <span className="stat-value">
                {companies.reduce((sum, c) => sum + (c.partnerCount || 0), 0)}
              </span>
            </div>
          </div>
          
          <div className="grid">
            {companies.map((company) => (
              <div 
                key={company.id} 
                className="card" 
                onClick={() => handleCardClick(company.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(company.id)
                  }
                }}
              >
                <div className="card-header">
                  <h3>{company.name}</h3>
                  <div className="badge">{company.partnerCount || 0} Partners</div>
                </div>
                <div className="card-body">
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {company.address}
                  </p>
                  <p className="gst-number">GST: {company.gst}</p>
                </div>
                <div className="card-footer">
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Created: {new Date(company.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
