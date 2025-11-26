import AutocompleteField from '../shared/AutocompleteField'

const InvoiceDetailsSection = ({ billData, handleBillDataChange, autocompleteState }) => {
  const { suggestions, showSuggestions, handleFocus, handleSelect, setShowSuggestions } = autocompleteState

  return (
    <div className="form-section-group">
      <h3 className="section-title">Invoice Details</h3>
      <div className="form-grid-2">
        <div className="form-field">
          <label>Reverse Charge</label>
          <select
            value={billData.reverseCharge}
            onChange={(e) => handleBillDataChange('reverseCharge', e.target.value)}
            className="form-input"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className="form-field">
          <label>Invoice Number</label>
          <input
            type="text"
            value={billData.billNumber}
            onChange={(e) => handleBillDataChange('billNumber', e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label>Invoice Date</label>
          <input
            type="date"
            value={billData.invoiceDate}
            onChange={(e) => handleBillDataChange('invoiceDate', e.target.value)}
            className="form-input"
            required
          />
        </div>

        <AutocompleteField
          label="P.O. Number"
          value={billData.poNumber}
          onChange={(val) => handleBillDataChange('poNumber', val)}
          placeholder="Optional"
          suggestions={suggestions.poNumber}
          showSuggestions={showSuggestions.poNumber}
          onFocus={() => handleFocus('poNumber')}
          onSelect={(field, val) => {
            handleBillDataChange('poNumber', val)
            setShowSuggestions(prev => ({ ...prev, poNumber: false }))
          }}
          fieldName="poNumber"
        />

        <div className="form-field">
          <label>P.O. Date</label>
          <input
            type="date"
            value={billData.poDate}
            onChange={(e) => handleBillDataChange('poDate', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label>State</label>
          <input
            type="text"
            value={billData.state}
            onChange={(e) => handleBillDataChange('state', e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label>State Code</label>
          <input
            type="text"
            value={billData.stateCode}
            onChange={(e) => handleBillDataChange('stateCode', e.target.value)}
            className="form-input"
            required
          />
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetailsSection
