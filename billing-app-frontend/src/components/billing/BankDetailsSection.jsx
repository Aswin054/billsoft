import AutocompleteField from '../shared/AutocompleteField'

const BankDetailsSection = ({ billData, handleBillDataChange, autocompleteState }) => {
  const { suggestions, showSuggestions, handleFocus, setShowSuggestions } = autocompleteState

  return (
    <div className="form-section-group">
      <h3 className="section-title">Bank Details</h3>
      <div className="form-grid-2">
        <AutocompleteField
          label="Bank Account Number"
          value={billData.bankAccountNumber}
          onChange={(val) => handleBillDataChange('bankAccountNumber', val)}
          placeholder="Optional"
          suggestions={suggestions.bankAccountNumber}
          showSuggestions={showSuggestions.bankAccountNumber}
          onFocus={() => handleFocus('bankAccountNumber')}
          onSelect={(field, val) => {
            handleBillDataChange('bankAccountNumber', val)
            setShowSuggestions(prev => ({ ...prev, bankAccountNumber: false }))
          }}
          fieldName="bankAccountNumber"
        />

        <AutocompleteField
          label="Bank Name"
          value={billData.bankName}
          onChange={(val) => handleBillDataChange('bankName', val)}
          placeholder="Optional"
          suggestions={suggestions.bankName}
          showSuggestions={showSuggestions.bankName}
          onFocus={() => handleFocus('bankName')}
          onSelect={(field, val) => {
            handleBillDataChange('bankName', val)
            setShowSuggestions(prev => ({ ...prev, bankName: false }))
          }}
          fieldName="bankName"
        />

        <AutocompleteField
          label="Bank IFSC Code"
          value={billData.bankIFSC}
          onChange={(val) => handleBillDataChange('bankIFSC', val)}
          placeholder="e.g., SBIN0001234"
          suggestions={suggestions.bankIFSC}
          showSuggestions={showSuggestions.bankIFSC}
          onFocus={() => handleFocus('bankIFSC')}
          onSelect={(field, val) => {
            handleBillDataChange('bankIFSC', val)
            setShowSuggestions(prev => ({ ...prev, bankIFSC: false }))
          }}
          fieldName="bankIFSC"
          transform={(val) => val.toUpperCase()}
        />

        <AutocompleteField
          label="Bank Branch"
          value={billData.bankBranch}
          onChange={(val) => handleBillDataChange('bankBranch', val)}
          placeholder="Branch name"
          suggestions={suggestions.bankBranch}
          showSuggestions={showSuggestions.bankBranch}
          onFocus={() => handleFocus('bankBranch')}
          onSelect={(field, val) => {
            handleBillDataChange('bankBranch', val)
            setShowSuggestions(prev => ({ ...prev, bankBranch: false }))
          }}
          fieldName="bankBranch"
        />
      </div>
    </div>
  )
}

export default BankDetailsSection
