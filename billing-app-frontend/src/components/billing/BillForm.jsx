import BillingMethodToggle from './BillingMethodToggle'
import InvoiceDetailsSection from './InvoiceDetailsSection'
import TransportationSection from './TransportationSection'
import LineItemsMethod1 from './LineItemsMethod1'
import LineItemsMethod2 from './LineItemsMethod2'
import BankDetailsSection from './BankDetailsSection'
import BillSummary from './BillSummary'
import AddProductModal from './modals/AddProductModal'
import AddHsnModal from './modals/AddHsnModal'
import AddUnitModal from './modals/AddUnitModal'

const BillForm = ({  billFormState, productState, autocompleteState }) => {
  const {
    billingMethod,
    setBillingMethod,
    billData,
    lineItems,
    setLineItems,
    lineItemsMethod2,
    setLineItemsMethod2,
    handleBillDataChange,
    handleGenerateBill,
    calculatePreview,
    generateBillMutation,
  } = billFormState

  const preview = calculatePreview()

  return (
    <div className="bill-builder-section">
      <div className="section-header">
        <h2>📝 Create New Bill</h2>
        <p className="text-muted">Fill in all invoice details to generate bill</p>
      </div>

      <BillingMethodToggle 
        billingMethod={billingMethod}
        setBillingMethod={setBillingMethod}
      />

      <form onSubmit={handleGenerateBill} className="bill-form">
        <InvoiceDetailsSection
          billData={billData}
          handleBillDataChange={handleBillDataChange}
          autocompleteState={autocompleteState}
        />

        <TransportationSection
          billData={billData}
          handleBillDataChange={handleBillDataChange}
          autocompleteState={autocompleteState}
        />

        {billingMethod === 'method1' ? (
          <LineItemsMethod1
            lineItems={lineItems}
            setLineItems={setLineItems}
            productState={productState}
          />
        ) : (
          <LineItemsMethod2
            lineItems={lineItemsMethod2}
            setLineItems={setLineItemsMethod2}
            productState={productState}
          />
        )}

        {billingMethod === 'method1' && (
          <div className="form-section-group">
            <h3 className="section-title">GST Details</h3>
            <div className="form-grid-2">
              <div className="form-field">
                <label>CGST Rate (%)</label>
                <input
                  type="number"
                  value={billData.cgstRate}
                  onChange={(e) => handleBillDataChange('cgstRate', parseFloat(e.target.value))}
                  className="form-input"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-field">
                <label>SGST Rate (%)</label>
                <input
                  type="number"
                  value={billData.sgstRate}
                  onChange={(e) => handleBillDataChange('sgstRate', parseFloat(e.target.value))}
                  className="form-input"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <BankDetailsSection
          billData={billData}
          handleBillDataChange={handleBillDataChange}
          autocompleteState={autocompleteState}
        />

        <BillSummary 
          preview={preview}
          billingMethod={billingMethod}
        />

        <button 
          type="submit" 
          className="btn-generate-bill" 
          disabled={generateBillMutation.isPending}
        >
          {generateBillMutation.isPending ? '⏳ Generating Bill...' : '✓ Generate Bill'}
        </button>
      </form>

      {/* Modals */}
      <AddProductModal productState={productState} />
      <AddHsnModal productState={productState} />
      <AddUnitModal productState={productState} />
    </div>
  )
}

export default BillForm
