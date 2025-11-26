const PartnerInfoCard = ({ partner }) => {
  return (
    <div className="partner-info-card">
      <h1>Partner Workspace</h1>
      <div className="info-grid">
        <div className="info-box">
          <div className="info-label">Delivery Information</div>
          <div className="info-content">
            <p className="info-name">{partner?.delivery_name}</p>
            <p className="info-detail">{partner?.delivery_address}</p>
            <p className="info-detail">State: {partner?.delivery_state || 'Tamil Nadu'}</p>
            <p className="info-gst">GST: {partner?.delivery_gst}</p>
          </div>
        </div>
        <div className="info-box">
          <div className="info-label">Billing Information</div>
          <div className="info-content">
            <p className="info-name">{partner?.billing_name}</p>
            <p className="info-detail">{partner?.billing_address}</p>
            <p className="info-detail">State: {partner?.billing_state || 'Tamil Nadu'}</p>
            <p className="info-gst">GST: {partner?.billing_gst}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PartnerInfoCard
