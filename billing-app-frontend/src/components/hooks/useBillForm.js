import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export const useBillForm = (partnerId, queryClient) => {
  const [billingMethod, setBillingMethod] = useState('method1')
  
  const [billData, setBillData] = useState({
    reverseCharge: 'No',
    billNumber: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    state: 'Tamil Nadu',
    stateCode: '33',
    vendorCode: '',
    transportationMode: 'Road Ways',
    vehicleNumber: '',
    dateOfSupply: new Date().toISOString().split('T')[0],
    placeOfSupply: 'Tamil Nadu',
    cgstRate: 9.0,
    sgstRate: 9.0,
    bankAccountNumber: '',
    bankName: '',
    bankIFSC: '',
    bankBranch: '',
  })

  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, price: 0 }
  ])

  const [lineItemsMethod2, setLineItemsMethod2] = useState([
    { description: '', hsnCode: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 5 }
  ])

  const generateBillMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`http://localhost:5000/api/partners/${partnerId}/bills`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner', partnerId])
      resetForm()
      alert('Bill generated successfully!')
    },
    onError: (error) => {
      console.error('Error generating bill:', error)
      alert('Failed to generate bill. Please try again.')
    },
  })

  const resetForm = () => {
    setBillData({
      reverseCharge: 'No',
      billNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      state: 'Tamil Nadu',
      stateCode: '33',
      vendorCode: '',
      transportationMode: 'Road Ways',
      vehicleNumber: '',
      dateOfSupply: new Date().toISOString().split('T')[0],
      placeOfSupply: 'Tamil Nadu',
      cgstRate: 9.0,
      sgstRate: 9.0,
      bankAccountNumber: '',
      bankName: '',
      bankIFSC: '',
      bankBranch: '',
    })
    setLineItems([{ description: '', quantity: 1, price: 0 }])
    setLineItemsMethod2([{ description: '', hsnCode: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 5 }])
  }

  const handleBillDataChange = (field, value) => {
    setBillData(prev => ({ ...prev, [field]: value }))
  }

  const calculatePreview = () => {
    let subtotal = 0
    const itemizedDetails = []
    
    if (billingMethod === 'method1') {
      lineItems.forEach(item => {
        const itemTotal = item.quantity * item.price
        subtotal += itemTotal
        itemizedDetails.push({
          ...item,
          taxableValue: itemTotal.toFixed(2)
        })
      })
      
      const cgstAmount = (subtotal * billData.cgstRate) / 100
      const sgstAmount = (subtotal * billData.sgstRate) / 100
      const totalGst = cgstAmount + sgstAmount
      const grandTotal = subtotal + totalGst
      
      return {
        subtotal: subtotal.toFixed(2),
        cgstAmount: cgstAmount.toFixed(2),
        sgstAmount: sgstAmount.toFixed(2),
        totalGst: totalGst.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        itemizedDetails
      }
    } else {
      let totalGst = 0
      
      lineItemsMethod2.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice
        const itemGst = (itemTotal * item.gstRate) / 100
        subtotal += itemTotal
        totalGst += itemGst
        
        itemizedDetails.push({
          ...item,
          taxableValue: itemTotal.toFixed(2),
          gstAmount: itemGst.toFixed(2),
          total: (itemTotal + itemGst).toFixed(2)
        })
      })
      
      const grandTotal = subtotal + totalGst
      
      return {
        subtotal: subtotal.toFixed(2),
        cgstAmount: (totalGst / 2).toFixed(2),
        sgstAmount: (totalGst / 2).toFixed(2),
        totalGst: totalGst.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        itemizedDetails
      }
    }
  }

  const handleGenerateBill = (e) => {
    e.preventDefault()
    
    const currentLineItems = billingMethod === 'method1' ? lineItems : lineItemsMethod2
    
    const hasValidItems = currentLineItems.every(item => {
      if (billingMethod === 'method1') {
        return item.description.trim() && item.quantity > 0 && item.price >= 0
      } else {
        return item.description.trim() && item.quantity > 0 && item.unitPrice >= 0
      }
    })
    
    if (!hasValidItems) {
      alert('Please fill in all line items with valid data.')
      return
    }

    if (!billData.dateOfSupply) {
      alert('Please select Date of Supply.')
      return
    }
    
    const payload = {
      ...billData,
      billingMethod,
      lineItems: currentLineItems
    }
    
    generateBillMutation.mutate(payload)
  }

  return {
    billingMethod,
    setBillingMethod,
    billData,
    setBillData,
    lineItems,
    setLineItems,
    lineItemsMethod2,
    setLineItemsMethod2,
    handleBillDataChange,
    handleGenerateBill,
    calculatePreview,
    generateBillMutation,
  }
}
