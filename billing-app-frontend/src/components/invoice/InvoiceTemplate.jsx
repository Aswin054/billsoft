import React, { forwardRef } from 'react';
import './InvoiceTemplate.css';

const InvoiceTemplate = forwardRef(({ billData, companyData, partnerData }, ref) => {
  // Default data or loading state
  if (!billData || !companyData || !partnerData) {
    return <div>Loading invoice data...</div>;
  }

  // Calculate amount in words
  const calculateAmountInWords = (amount) => {
    return billData.amountInWords || `${amount} Rupees Only`;
  };

  // Parse line items
  const lineItems = billData.lineItems || [];
  const isMethod2 = billData.billing_method === 'method2';

  return (
    <div ref={ref} className="invoice-container">
      <div className="invoice-page">
        {/* Header */}
        <div className="invoice-header">
          <div className="company-name">{companyData.name}</div>
          <div className="company-address">{companyData.address}</div>
          <div className="company-gst">GST IN:{companyData.gst}</div>
        </div>

        {/* Tax Invoice Bar with Checkboxes */}
        <div className="tax-invoice-section">
          <div className="tax-invoice-bar">TAX INVOICE</div>
          <div className="invoice-type-box">
            <div className="invoice-type-item">
              <span className="checkmark">✓</span>
              <span className="type-text">Original for Recipient</span>
            </div>
            <div className="invoice-type-item">
              <span className="checkmark">✓</span>
              <span className="type-text">Duplicate for Transporter</span>
            </div>
            <div className="invoice-type-item">
              <span className="checkmark">✓</span>
              <span className="type-text">Triplicate for Supplier</span>
            </div>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="invoice-details-section">
          <div className="details-column">
            <div className="detail-row">
              <span className="detail-label">Reverse Charge</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.reverse_charge || 'No'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Invoice No</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.bill_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Invoice Date</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.invoice_date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">P.O.No</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.po_number || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">P.O.Date</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.po_date || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">State</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.state}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">State Code</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.state_code}</span>
            </div>
          </div>

          <div className="details-column">
            <div className="detail-row">
              <span className="detail-label">VENDOR CODE</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.vendor_code || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Transportation Mode</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.transportation_mode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Vehicle No</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.vehicle_number || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date of Supply</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.date_of_supply}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Place of supply</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{billData.place_of_supply} ({billData.state_code})</span>
            </div>
          </div>
        </div>

        {/* Receiver/Consignee Section */}
        <div className="party-section">
          <div className="party-header">
            <div className="party-header-left">Details Of Receiver |Billed to:</div>
            <div className="party-header-right">Details of Consignee |Shipped to</div>
          </div>
          <div className="party-details">
            <div className="party-box">
              <div className="party-line">
                <span className="party-label">Name:</span>
                <span className="party-value">{partnerData.billing_name}</span>
              </div>
              <div className="party-line">
                <span className="party-label">Address :</span>
                <span className="party-value">{partnerData.billing_address}</span>
              </div>
              <div className="party-line">
                <span className="party-label">State:</span>
                <span className="party-value">{partnerData.billing_state}</span>
              </div>
              <div className="party-line">
                <span className="party-label">GST IN</span>
                <span className="party-colon">:</span>
                <span className="party-value">{partnerData.billing_gst}</span>
              </div>
            </div>
            <div className="party-box">
              <div className="party-line">
                <span className="party-label">Name:</span>
                <span className="party-value">{partnerData.delivery_name}</span>
              </div>
              <div className="party-line">
                <span className="party-label">Address :</span>
                <span className="party-value">{partnerData.delivery_address}</span>
              </div>
              <div className="party-line">
                <span className="party-label">State:</span>
                <span className="party-value">{partnerData.delivery_state}</span>
              </div>
              <div className="party-line">
                <span className="party-label">GST IN</span>
                <span className="party-colon">:</span>
                <span className="party-value">{partnerData.delivery_gst}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table - Method 1 */}
        {!isMethod2 && (
          <table className="items-table">
            <thead>
              <tr>
                <th rowSpan="2" className="col-srno">Sr.No</th>
                <th rowSpan="2" className="col-description">Product Description</th>
                <th rowSpan="2" className="col-qty">QTY</th>
                <th rowSpan="2" className="col-unit">Unit</th>
                <th rowSpan="2" className="col-rate">Rate<br/>INR</th>
                <th rowSpan="2" className="col-amount">Amount</th>
                <th rowSpan="2" className="col-taxable">Taxable<br/>Value</th>
                <th colSpan="2" className="col-gst-header">CGST</th>
                <th colSpan="2" className="col-gst-header">SGST</th>
                <th rowSpan="2" className="col-total">Total</th>
              </tr>
              <tr>
                <th className="col-gst-sub">%Rate</th>
                <th className="col-gst-sub">Amount</th>
                <th className="col-gst-sub">%Rate</th>
                <th className="col-gst-sub">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => {
                const cgstAmount = (parseFloat(item.taxableValue) * billData.cgst_rate) / 100;
                const sgstAmount = (parseFloat(item.taxableValue) * billData.sgst_rate) / 100;
                const itemTotal = parseFloat(item.taxableValue) + cgstAmount + sgstAmount;

                return (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td className="text-left item-description">{item.description}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center">Nos</td>
                    <td className="text-right">{parseFloat(item.price).toFixed(2)}</td>
                    <td className="text-right">{parseFloat(item.taxableValue).toFixed(2)}</td>
                    <td className="text-right">{parseFloat(item.taxableValue).toFixed(2)}</td>
                    <td className="text-center">{billData.cgst_rate.toFixed(1)}%</td>
                    <td className="text-right">{cgstAmount.toFixed(2)}</td>
                    <td className="text-center">{billData.sgst_rate.toFixed(1)}%</td>
                    <td className="text-right">{sgstAmount.toFixed(2)}</td>
                    <td className="text-right total-red">{itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan="2" className="text-left total-label">Total Quantity</td>
                <td className="text-center total-value">{lineItems.reduce((sum, item) => sum + parseInt(item.quantity), 0)}</td>
                <td></td>
                <td></td>
                <td className="text-right total-value">{parseFloat(billData.subtotal).toFixed(2)}</td>
                <td className="text-right total-value">{parseFloat(billData.subtotal).toFixed(2)}</td>
                <td></td>
                <td className="text-right total-value">{parseFloat(billData.cgst_amount).toFixed(2)}</td>
                <td></td>
                <td className="text-right total-value">{parseFloat(billData.sgst_amount).toFixed(2)}</td>
                <td className="text-right total-red total-value">{parseFloat(billData.grand_total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Items Table - Method 2 */}
        {isMethod2 && (
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-srno">Sr.<br/>No</th>
                <th className="col-description">Product<br/>Description</th>
                <th className="col-hsn">HSN<br/>Code</th>
                <th className="col-qty">QTY</th>
                <th className="col-unit">Unit</th>
                <th className="col-rate">Unit<br/>Price<br/>INR</th>
                <th className="col-amount">Amount</th>
                <th className="col-gst-rate">GST<br/>%</th>
                <th className="col-gst-amt">GST<br/>Amount</th>
                <th className="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-left item-description">{item.description}</td>
                  <td className="text-center">{item.hsnCode || '-'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center">{item.unit || 'Nos'}</td>
                  <td className="text-right">{parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="text-right">{parseFloat(item.taxableValue).toFixed(2)}</td>
                  <td className="text-center">{parseFloat(item.gstRate).toFixed(1)}%</td>
                  <td className="text-right">{parseFloat(item.gstAmount).toFixed(2)}</td>
                  <td className="text-right total-red">{parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="3" className="text-left total-label">Total Quantity</td>
                <td className="text-center total-value">{lineItems.reduce((sum, item) => sum + parseInt(item.quantity), 0)}</td>
                <td></td>
                <td></td>
                <td className="text-right total-value">{parseFloat(billData.subtotal).toFixed(2)}</td>
                <td></td>
                <td className="text-right total-value">{parseFloat(billData.total_gst).toFixed(2)}</td>
                <td className="text-right total-red total-value">{parseFloat(billData.grand_total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Amount in Words and Summary */}
        <div className="summary-section">
          <div className="amount-in-words">
            <span className="words-label">Total Invoice Amounts in Words</span>
            <div className="words-value">{calculateAmountInWords(billData.grand_total)}</div>
          </div>
          <div className="summary-box">
            <div className="summary-row">
              <span className="summary-label">Total Amount Before Tax</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{parseFloat(billData.subtotal).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Add : CGST</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{parseFloat(billData.cgst_amount).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Add : SGST</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{parseFloat(billData.sgst_amount).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Amount: GST</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{parseFloat(billData.total_gst).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Rounded off(-)</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">0.0</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total Amount After Tax     INR</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{parseFloat(billData.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="bank-details-container">
            <div className="bank-header">Bank Details</div>
            <div className="bank-content">
              <div className="bank-row">
                <span className="bank-label">Bank Account Number</span>
                <span className="bank-colon">:</span>
                <span className="bank-value">{billData.bank_account_number || '-'}</span>
              </div>
              <div className="bank-row">
                <span className="bank-label">Bank Name</span>
                <span className="bank-colon">:</span>
                <span className="bank-value">{billData.bank_name || '-'}</span>
              </div>
              <div className="bank-row">
                <span className="bank-label">Bank IFSC Code</span>
                <span className="bank-colon">:</span>
                <span className="bank-value">{billData.bank_ifsc_code || '-'}</span>
              </div>
              <div className="bank-row">
                <span className="bank-label">Bank Branch</span>
                <span className="bank-colon">:</span>
                <span className="bank-value">{billData.bank_branch || '-'}</span>
              </div>
            </div>
          </div>

          <div className="signature-container">
            <div className="certification-text">
              Certified that the particular given above are true and correct
            </div>
            <div className="company-signature">
              For, {companyData.name}
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="terms-section">
          <div className="terms-header">Terms And Conditions</div>
          <div className="terms-content">
            <div>1. This is electronically generated invoice.</div>
            <div>2. All disputes are subject to Tiruvallur jurisdiction.</div>
            <div>3. Please pay invoice within 30 days.</div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
