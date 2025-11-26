import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { partnersApi } from '../api/client'
import axios from 'axios'
import PartnerInfoCard from '../components/shared/PartnerInfoCard'
import BillForm from '../components/billing/BillForm'
import GeneratedBillsList from '../components/bills/GeneratedBillsList'
import { useBillForm } from '../components/hooks/useBillForm'
import { useProductManagement } from '../components/hooks/useProductManagement'
import { useAutocomplete } from '../components/hooks/useAutocomplete'

export default function PartnerWorkspace() {
  const { companyId, partnerId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Validate partnerId
  if (!partnerId || partnerId === 'undefined') {
    setTimeout(() => navigate(`/companies/${companyId}`), 100)
    return (
      <div className="container">
        <div className="loading">Invalid partner ID. Redirecting...</div>
      </div>
    )
  }

  // Fetch company data
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/companies/${companyId}`)
      return res.data
    },
    enabled: !!companyId
  })

  // Fetch partner data
  const { data: partner, isLoading, error } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const res = await partnersApi.getById(partnerId)
      return res.data
    },
    enabled: !!partnerId && partnerId !== 'undefined',
  })

  // Custom hooks for managing form state
  const billFormState = useBillForm(partnerId, queryClient)
  const productState = useProductManagement()
  const autocompleteState = useAutocomplete(partnerId)

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading partner details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="loading">Error loading partner. Please try again.</div>
        <button className="btn-primary" onClick={() => navigate(`/companies/${companyId}`)}>
          Back to Company
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(`/companies/${companyId}`)}>
        ← Back to Company
      </button>

      <PartnerInfoCard partner={partner} />

      <BillForm 
        partnerId={partnerId}
        billFormState={billFormState}
        productState={productState}
        autocompleteState={autocompleteState}
      />

      <GeneratedBillsList
        partner={partner}
        company={company}
      />
    </div>
  )
}
