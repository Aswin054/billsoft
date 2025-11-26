import { useState, useEffect } from 'react'
import axios from 'axios'

export const useAutocomplete = (partnerId) => {
  const [suggestions, setSuggestions] = useState({
    vendorCode: [],
    vehicleNumber: [],
    poNumber: [],
    bankBranch: [],
    bankAccountNumber: [],
    bankName: [],
    bankIFSC: []
  })

  const [showSuggestions, setShowSuggestions] = useState({
    vendorCode: false,
    vehicleNumber: false,
    poNumber: false,
    bankBranch: false,
    bankAccountNumber: false,
    bankName: false,
    bankIFSC: false
  })

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const fetchSuggestions = async (fieldName, stateKey) => {
      try {
        const url = `${API_URL}/api/autocomplete/${fieldName}?partner_id=${partnerId}`
        const res = await axios.get(url)
        const values = res.data.map(item => item.field_value)
        setSuggestions(prev => ({ ...prev, [stateKey]: values }))
      } catch (error) {
        console.error(`Error fetching ${fieldName} suggestions:`, error)
      }
    }


    if (partnerId) {
      fetchSuggestions('vendor_code', 'vendorCode')
      fetchSuggestions('vehicle_number', 'vehicleNumber')
      fetchSuggestions('po_number', 'poNumber')
      fetchSuggestions('bank_branch', 'bankBranch')
      fetchSuggestions('bank_account_number', 'bankAccountNumber')
      fetchSuggestions('bank_name', 'bankName')
      fetchSuggestions('bank_ifsc', 'bankIFSC')
    }
  }, [partnerId])

  const handleFocus = (fieldName) => {
    setShowSuggestions(prev => ({ ...prev, [fieldName]: true }))
  }

  const handleSelect = (fieldName, value, onChange) => {
    onChange(value)
    setShowSuggestions(prev => ({ ...prev, [fieldName]: false }))
  }

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleFocus,
    handleSelect,
  }
}
