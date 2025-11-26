import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi, partnersApi } from '../api/client'

export default function CompanyDetail() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    deliveryName: '',
    deliveryAddress: '',
    deliveryGst: '',
    deliveryState: 'Tamil Nadu',
    billingName: '',
    billingAddress: '',
    billingGst: '',
    billingState: 'Tamil Nadu',
  })

  // Validate companyId
  if (!companyId || companyId === 'undefined') {
    setTimeout(() => navigate('/'), 100)
    return (
      <div className="container">
        <div className="loading">Invalid company ID. Redirecting to dashboard...</div>
      </div>
    )
  }

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await companiesApi.getById(companyId)
      return res.data
    },
    enabled: !!companyId && companyId !== 'undefined',
  })

  const createPartnerMutation = useMutation({
    mutationFn: (data) => partnersApi.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['company', companyId])
      setShowForm(false)
      setFormData({
        deliveryName: '',
        deliveryAddress: '',
        deliveryGst: '',
        deliveryState: 'Tamil Nadu',
        billingName: '',
        billingAddress: '',
        billingGst: '',
        billingState: 'Tamil Nadu',
      })
    },
    onError: (error) => {
      console.error('Error creating partner:', error)
      alert('Failed to create partner. Please try again.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createPartnerMutation.mutate(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading company details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="loading">Error loading company. Please try again.</div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>
      
      <div className="header">
        <div>
          <h1>{company?.name}</h1>
          <p className="text-muted">{company?.address}</p>
          <p className="text-muted">GST: {company?.gst}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Supply Partner'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>New Supply Partner</h3>
          
          <div className="form-section">
            <h4>Delivery Details</h4>
            <input
              type="text"
              placeholder="Delivery Name"
              value={formData.deliveryName}
              onChange={(e) => handleChange('deliveryName', e.target.value)}
              required
            />
            <textarea
              placeholder="Delivery Address"
              value={formData.deliveryAddress}
              onChange={(e) => handleChange('deliveryAddress', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="State"
              value={formData.deliveryState}
              onChange={(e) => handleChange('deliveryState', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Delivery GST Number"
              value={formData.deliveryGst}
              onChange={(e) => handleChange('deliveryGst', e.target.value)}
              required
            />
          </div>

          <div className="form-section">
            <h4>Billing Details</h4>
            <input
              type="text"
              placeholder="Billing Name"
              value={formData.billingName}
              onChange={(e) => handleChange('billingName', e.target.value)}
              required
            />
            <textarea
              placeholder="Billing Address"
              value={formData.billingAddress}
              onChange={(e) => handleChange('billingAddress', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="State"
              value={formData.billingState}
              onChange={(e) => handleChange('billingState', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Billing GST Number"
              value={formData.billingGst}
              onChange={(e) => handleChange('billingGst', e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={createPartnerMutation.isPending}
          >
            {createPartnerMutation.isPending ? 'Creating...' : 'Create Partner'}
          </button>
        </form>
      )}

      <h2>Supply Partners ({company?.partners?.length || 0})</h2>
      
      {!company?.partners || company.partners.length === 0 ? (
        <p className="text-muted">No supply partners yet. Add one to get started.</p>
      ) : (
        <div className="grid">
          {company.partners.map((partner) => (
            <div
              key={partner.id}
              className="card"
              onClick={() => navigate(`/companies/${companyId}/partners/${partner.id}`)}
            >
              <h3>{partner.delivery_name}</h3>
              <p className="text-muted">Delivery GST: {partner.delivery_gst}</p>
              <p className="text-muted">Billing: {partner.billing_name}</p>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                GST: {partner.billing_gst}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
