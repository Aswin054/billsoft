import PrintButton from './PrintButton'

const BillCard = ({ bill, invoiceRef }) => {
  return (
    <div className="bill-card-display">
      <div className="bill-card-header">
        <div>
          <h3 className="bill-number">{bill.bill_number}</h3>
          <p className="bill-date">
            {new Date(bill.invoice_date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            PO: {bill.po_number || 'N/A'} | Vendor: {bill.vendor_code || 'N/A'}
            <span style={{ 
              marginLeft: '0.5rem', 
              padding: '0.2rem 0.5rem', 
              background: bill.billing_method === 'method2' ? '#4CAF50' : '#2196F3',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {bill.billing_method === 'method2' ? 'Method 2' : 'Method 1'}
            </span>
          </p>
        </div>
        <div className="bill-total-badge">
          ₹{bill.grand_total}
        </div>
      </div>

      <div className="bill-card-items">
        <table className="bill-items-table">
          <thead>
            <tr>
              <th>Product</th>
              {bill.billing_method === 'method2' && <th>HSN</th>}
              <th>Qty</th>
              {bill.billing_method === 'method2' && <th>Unit</th>}
              <th>Rate</th>
              {bill.billing_method === 'method2' && <th>GST%</th>}
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems?.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                {bill.billing_method === 'method2' && <td>{item.hsnCode || '-'}</td>}
                <td>{item.quantity}</td>
                {bill.billing_method === 'method2' && <td>{item.unit || 'Nos'}</td>}
                <td>₹{bill.billing_method === 'method2' ? item.unitPrice : item.price}</td>
                {bill.billing_method === 'method2' && <td>{item.gstRate}%</td>}
                <td>₹{bill.billing_method === 'method2' ? item.total : item.taxableValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bill-card-footer">
        <div className="footer-totals">
          <div className="footer-row">
            <span>Taxable Value:</span>
            <span>₹{bill.subtotal}</span>
          </div>
          <div className="footer-row">
            <span>CGST:</span>
            <span>₹{bill.cgst_amount}</span>
          </div>
          <div className="footer-row">
            <span>SGST:</span>
            <span>₹{bill.sgst_amount}</span>
          </div>
          <div className="footer-row">
            <span>Total GST:</span>
            <span>₹{bill.total_gst}</span>
          </div>
          <div className="footer-row footer-grand-total">
            <span>Grand Total:</span>
            <span>₹{bill.grand_total}</span>
          </div>
        </div>
        
        <PrintButton 
          invoiceRef={invoiceRef}
          billNumber={bill.bill_number}
        />

        {bill.amountInWords && (
          <div className="amount-in-words">
            <strong>Amount in Words:</strong> {bill.amountInWords}
          </div>
        )}
      </div>
    </div>
  )
}

export default BillCard
