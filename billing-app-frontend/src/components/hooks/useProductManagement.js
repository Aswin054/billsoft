import { useState, useEffect } from 'react'
import axios from 'axios'

export const useProductManagement = () => {
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
        const res = await axios.get('http://localhost:5000/api/products')
        setProducts(res.data.map(p => p.name).sort())
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  // Fetch HSN codes
  useEffect(() => {
    const fetchHsnCodes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/hsn-codes')
        setHsnCodes(res.data)
      } catch (error) {
        console.error('Error fetching HSN codes:', error)
      }
    }
    fetchHsnCodes()
  }, [])

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/units')
        setUnits(res.data.map(u => u.name).sort())
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    }
    fetchUnits()
  }, [])

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      alert('Please enter a product name')
      return
    }

    try {
      const res = await axios.post('http://localhost:5000/api/products', {
        name: newProductName.trim().toUpperCase()
      })
      setProducts(prev => [...prev, res.data.name].sort())
      setNewProductName('')
      setShowAddProduct(false)
      alert('Product added successfully!')
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Product already exists!')
      } else {
        alert('Failed to add product')
      }
    }
  }

  const handleAddHsn = async () => {
    if (!newHsnCode.trim()) {
      alert('Please enter HSN code')
      return
    }

    try {
      const res = await axios.post('http://localhost:5000/api/hsn-codes', {
        code: newHsnCode.trim(),
        description: newHsnDescription.trim()
      })
      setHsnCodes(prev => [...prev, res.data].sort((a, b) => a.code.localeCompare(b.code)))
      setNewHsnCode('')
      setNewHsnDescription('')
      setShowAddHsn(false)
      alert('HSN code added successfully!')
    } catch (error) {
      if (error.response?.status === 409) {
        alert('HSN code already exists!')
      } else {
        alert('Failed to add HSN code')
      }
    }
  }

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      alert('Please enter unit name')
      return
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

try {
  const res = await axios.post(`${API_URL}/api/units`, {
    name: newUnitName.trim()
  })

      setUnits(prev => [...prev, res.data.name].sort())
      setNewUnitName('')
      setShowAddUnit(false)
      alert('Unit added successfully!')
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Unit already exists!')
      } else {
        alert('Failed to add unit')
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
