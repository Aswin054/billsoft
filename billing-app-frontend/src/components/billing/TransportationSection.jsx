import AutocompleteField from '../shared/AutocompleteField'

const TransportationSection = ({ billData, handleBillDataChange, autocompleteState }) => {
  const { suggestions, showSuggestions, handleFocus, setShowSuggestions } = autocompleteState

  return (
    <div className="form-section-group">
      <h3 className="section-title">Transportation & Supply Details</h3>
      <div className="form-grid-2">
        <AutocompleteField
          label="Vendor Code"
          value={billData.vendorCode}
          onChange={(val) => handleBillDataChange('vendorCode', val)}
          placeholder="Enter vendor code"
          suggestions={suggestions.vendorCode}
          showSuggestions={showSuggestions.vendorCode}
          onFocus={() => handleFocus('vendorCode')}
          onSelect={(field, val) => {
            handleBillDataChange('vendorCode', val)
            setShowSuggestions(prev => ({ ...prev, vendorCode: false }))
          }}
          fieldName="vendorCode"
        />

        <div className="form-field">
          <label>Transportation Mode</label>
          <select
            value={billData.transportationMode}
            onChange={(e) => handleBillDataChange('transportationMode', e.target.value)}
            className="form-input"
          >
            <option value="Road Ways">Road Ways</option>
            <option value="Railways">Railways</option>
            <option value="Airways">Airways</option>
            <option value="Ship">Ship</option>
          </select>
        </div>

        <AutocompleteField
          label="Vehicle Number"
          value={billData.vehicleNumber}
          onChange={(val) => handleBillDataChange('vehicleNumber', val)}
          placeholder="e.g., TN20DC4060"
          suggestions={suggestions.vehicleNumber}
          showSuggestions={showSuggestions.vehicleNumber}
          onFocus={() => handleFocus('vehicleNumber')}
          onSelect={(field, val) => {
            handleBillDataChange('vehicleNumber', val)
            setShowSuggestions(prev => ({ ...prev, vehicleNumber: false }))
          }}
          fieldName="vehicleNumber"
          transform={(val) => val.toUpperCase()}
        />

        <div className="form-field">
          <label>Date of Supply *</label>
          <input
            type="date"
            value={billData.dateOfSupply}
            onChange={(e) => handleBillDataChange('dateOfSupply', e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label>Place of Supply</label>
          <input
            type="text"
            value={billData.placeOfSupply}
            onChange={(e) => handleBillDataChange('placeOfSupply', e.target.value)}
            className="form-input"
            required
          />
        </div>
      </div>
    </div>
  )
}

export default TransportationSection
