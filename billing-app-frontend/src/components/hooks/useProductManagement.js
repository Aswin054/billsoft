import { useState, useEffect } from 'react'
import axios from 'axios'

export const useProductManagement = () => {
  // API URL - works for both local and deployed
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const [products, setProducts] = useState([])
  const [hsnCodes, setHsnCodes] = useState([])
  const [units, setUnits] = useState([])
  
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddHsn, setShowAddHsn] = useState(false)
  const [showAddUnit, setShowAddUnit] = useState(false)
  
  const [newProductName, setNewProductName] = useState('')
  const [newHsnCode, setNewHsnCode] = useState('')
  const [newHsnDescription, setNewHsnDescription] = useState('')
  const [newUnitName, setNewUnitName] = useState('')

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products`)
        setProducts(res.data.map(p => p.name).sort())
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [API_URL])

  // Fetch HSN codes
  useEffect(() => {
    const fetchHsnCodes = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/hsn-codes`)
        setHsnCodes(res.data)
      } catch (error) {
        console.error('Error fetching HSN codes:', error)
      }
    }
    fetchHsnCodes()
  }, [API_URL])

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/units`)
        setUnits(res.data.map(u => u.name).sort())
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    }
    fetchUnits()
  }, [API_URL])

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      alert('Please enter a product name')
      return
    }

    try {
      const res = await axios.post(`${API_URL}/api/products`, {
        name: newProductName.trim().toUpperCase()
      })
      setProducts(prev => [...prev, res.data.name].sort())
      setNewProductName('')
      setShowAddProduct(false)
      alert('Product added successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      if (error.response?.status === 409) {
        alert('Product already exists!')
      } else {
        alert(`Failed to add product: ${error.message}`)
      }
    }
  }

  const handleAddHsn = async () => {
    if (!newHsnCode.trim()) {
      alert('Please enter HSN code')
      return
    }

    try {
      const res = await axios.post(`${API_URL}/api/hsn-codes`, {
        code: newHsnCode.trim(),
        description: newHsnDescription.trim()
      })
      setHsnCodes(prev => [...prev, res.data].sort((a, b) => a.code.localeCompare(b.code)))
      setNewHsnCode('')
      setNewHsnDescription('')
      setShowAddHsn(false)
      alert('HSN code added successfully!')
    } catch (error) {
      console.error('Error adding HSN code:', error)
      if (error.response?.status === 409) {
        alert('HSN code already exists!')
      } else {
        alert(`Failed to add HSN code: ${error.message}`)
      }
    }
  }

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      alert('Please enter unit name')
      return
    }

    try {
      const res = await axios.post(`${API_URL}/api/units`, {
        name: newUnitName.trim()
      })
      setUnits(prev => [...prev, res.data.name].sort())
      setNewUnitName('')
      setShowAddUnit(false)
      alert('Unit added successfully!')
    } catch (error) {
      console.error('Error adding unit:', error)
      if (error.response?.status === 409) {
        alert('Unit already exists!')
      } else {
        alert(`Failed to add unit: ${error.message}`)
      }
    }
  }

  return {
    products,
    hsnCodes,
    units,
    showAddProduct,
    setShowAddProduct,
    showAddHsn,
    setShowAddHsn,
    showAddUnit,
    setShowAddUnit,
    newProductName,
    setNewProductName,
    newHsnCode,
    setNewHsnCode,
    newHsnDescription,
    setNewHsnDescription,
    newUnitName,
    setNewUnitName,
    handleAddProduct,
    handleAddHsn,
    handleAddUnit,
  }
}
