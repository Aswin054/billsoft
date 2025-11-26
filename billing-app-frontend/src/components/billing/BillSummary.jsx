const BillSummary = ({ preview, billingMethod }) => {
  return (
    <div className="bill-summary">
      <div className="summary-header">
        <h3>Bill Summary</h3>
      </div>
      <div className="summary-content">
        <div className="summary-breakdown">
          <h4>Itemized Breakdown</h4>
          {preview.itemizedDetails.map((item, idx) => (
            <div key={idx} className="breakdown-item">
              <span className="breakdown-desc">
                {item.description || `Item ${idx + 1}`}
              </span>
              <span className="breakdown-calc">
                {billingMethod === 'method1' ? (
                  `${item.quantity} × ₹${item.price} = ₹${item.taxableValue}`
                ) : (
                  `${item.quantity} × ₹${item.unitPrice} + GST(${item.gstRate}%) = ₹${item.total}`
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="summary-totals">
          <div className="total-row">
            <span>Subtotal (Taxable Value)</span>
            <span className="total-amount">₹{preview.subtotal}</span>
          </div>
          <div className="total-row">
            <span>CGST</span>
            <span className="total-amount">₹{preview.cgstAmount}</span>
          </div>
          <div className="total-row">
            <span>SGST</span>
            <span className="total-amount">₹{preview.sgstAmount}</span>
          </div>
          <div className="total-row">
            <span>Total GST</span>
            <span className="total-amount">₹{preview.totalGst}</span>
          </div>
          <div className="total-row grand-total-row">
            <span>Grand Total</span>
            <span className="grand-total-amount">₹{preview.grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillSummary
