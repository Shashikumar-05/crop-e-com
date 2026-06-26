const getEmailHeader = (title) => `
  <div style="background-color: #4F46E5; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 24px;">Farm2Home Agritech</h1>
    <p style="color: #E0E7FF; margin: 10px 0 0 0; font-family: Arial, sans-serif;">${title}</p>
  </div>
`;

const getEmailFooter = () => `
  <div style="padding: 20px; text-align: center; color: #6B7280; font-size: 12px; font-family: Arial, sans-serif;">
    <p>&copy; 2026 Farm2Home Agritech. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
    <p>Support: support@farm2home.com | <a href="#" style="color: #4F46E5; text-decoration: none;">Help Center</a></p>
  </div>
`;

const managerApprovalTemplate = (data) => `
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #F9FAFB;">
    ${getEmailHeader('New Registration Pending Approval')}
    <div style="padding: 30px; background-color: white;">
      <p style="font-size: 16px; color: #374151; font-family: Arial, sans-serif;">Hello Manager,</p>
      <p style="font-size: 16px; color: #374151; font-family: Arial, sans-serif;">A new Delivery Partner has registered and is waiting for your review.</p>
      
      <div style="margin: 25px 0; padding: 20px; background-color: #F3F4F6; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #111827; font-family: Arial, sans-serif;">Partner Details:</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; color: #4B5563;">
          <tr><td style="padding: 8px 0; font-weight: bold;">Full Name:</td><td style="padding: 8px 0;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;">${data.email}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td style="padding: 8px 0;">${data.phone}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Location:</td><td style="padding: 8px 0;">${data.location}, ${data.area}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Vehicle Type:</td><td style="padding: 8px 0;">${data.vehicle_type}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Vehicle No:</td><td style="padding: 8px 0;">${data.vehicle_number}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Reg. Date:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <p style="font-weight: bold; color: #374151;">Documents:</p>
        <div style="display: flex; gap: 10px;">
          ${data.license_image ? `<a href="${data.license_image}" target="_blank" style="padding: 8px 16px; background-color: #E5E7EB; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">View Driving License</a>` : ''}
          ${data.rc_book ? `<a href="${data.rc_book}" target="_blank" style="padding: 8px 16px; background-color: #E5E7EB; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">View RC Document</a>` : ''}
        </div>
      </div>

      <div style="text-align: center; margin-top: 35px; border-top: 1px solid #E5E7EB; padding-top: 25px;">
        <a href="${data.approvalLink}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 15px;">APPROVE REGISTRATION</a>
        <a href="${data.rejectionLink}" style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">REJECT REGISTRATION</a>
      </div>
    </div>
    ${getEmailFooter()}
  </div>
`;

const partnerApprovalTemplate = (data) => `
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #F0FDF4;">
    ${getEmailHeader('Registration Approved ✅')}
    <div style="padding: 30px; background-color: white; text-align: center;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #D1FAE5; color: #065F46; border-radius: 9999px; font-weight: bold; font-size: 14px;">ACCOUNT ACTIVE</span>
      </div>
      <h2 style="color: #111827; font-family: Arial, sans-serif;">Congratulations ${data.name}!</h2>
      <p style="font-size: 16px; color: #4B5563; font-family: Arial, sans-serif; line-height: 1.6;">
        Great news! Your registration as a Delivery Partner for <strong>Farm2Home</strong> has been reviewed and <strong>approved</strong>.
      </p>
      <p style="font-size: 16px; color: #4B5563; font-family: Arial, sans-serif; line-height: 1.6;">
        Your vehicle registration and documents have been verified. You are now officially part of our delivery fleet!
      </p>
      
      <div style="margin: 25px 0; padding: 20px; background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; text-align: left;">
        <h3 style="margin-top: 0; color: #1E293B; font-family: Arial, sans-serif; font-size: 16px;">Your Account Details:</h3>
        <p style="margin: 10px 0; font-family: Arial, sans-serif; color: #475569; font-size: 15px;">
          <strong>Registered Email:</strong> ${data.email}
        </p>
        <p style="margin: 10px 0; font-family: Arial, sans-serif; color: #475569; font-size: 15px;">
          <strong>Unique 6-Digit ID:</strong> <span style="font-family: monospace; font-size: 18px; color: #4F46E5; background: #E0E7FF; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${data.uniqueId}</span>
        </p>
        <p style="margin: 10px 0; font-family: Arial, sans-serif; color: #475569; font-size: 15px;">
          <strong>Password:</strong> <i>The password you used during registration.</i>
        </p>
      </div>
      
      <div style="margin: 30px 0;">
        <a href="${data.loginLink}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">SIGN IN NOW</a>
      </div>
      
      <p style="font-size: 14px; color: #6B7280; font-family: Arial, sans-serif;">
        Please click the button above to sign in and start receiving delivery assignments.
      </p>
    </div>
    ${getEmailFooter()}
  </div>
`;

const partnerRejectionTemplate = (data) => `
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #FEF2F2;">
    ${getEmailHeader('Registration Update')}
    <div style="padding: 30px; background-color: white; text-align: center;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #FEE2E2; color: #991B1B; border-radius: 9999px; font-weight: bold; font-size: 14px;">REGISTRATION REJECTED</span>
      </div>
      <h2 style="color: #111827; font-family: Arial, sans-serif;">Hello ${data.name},</h2>
      <p style="font-size: 16px; color: #4B5563; font-family: Arial, sans-serif; line-height: 1.6;">
        Thank you for your interest in joining Farm2Home. After reviewing your application, we regret to inform you that your registration could not be approved at this time.
      </p>
      
      <div style="margin: 25px 0; padding: 20px; background-color: #FFF5F5; border-radius: 8px; text-align: left;">
        <p style="margin-top: 0; font-weight: bold; color: #991B1B;">Possible reasons for rejection:</p>
        <ul style="color: #4B5563; font-family: Arial, sans-serif; font-size: 14px;">
          <li>Invalid or expired documents (DL/RC)</li>
          <li>Blurry or unreadable document images</li>
          <li>Mismatch in vehicle details</li>
          <li>Incomplete profile information</li>
        </ul>
      </div>

      <p style="font-size: 16px; color: #4B5563; font-family: Arial, sans-serif;">
        Don't worry! You can re-apply by uploading clear documents and correct details.
      </p>
      
      <div style="margin: 30px 0;">
        <a href="${data.reApplyLink}" style="display: inline-block; padding: 14px 32px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">RE-APPLY NOW</a>
      </div>
    </div>
    ${getEmailFooter()}
  </div>
`;

const managerEnquiryTemplate = (data) => `
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #F8FAFC;">
    ${getEmailHeader('New Order Enquiry')}
    <div style="padding: 30px; background-color: white;">
      <h2 style="color: #1E293B; font-family: Arial, sans-serif;">Hello Manager,</h2>
      <p style="font-size: 16px; color: #475569; font-family: Arial, sans-serif;">
        A new order enquiry has been placed by a customer.
      </p>
      <div style="margin: 20px 0; padding: 20px; background-color: #F1F5F9; border-radius: 8px;">
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #334155;"><strong>Order ID:</strong> ${data.orderId}</p>
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #334155;"><strong>Customer Name:</strong> ${data.buyerName}</p>
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #334155;"><strong>Total Estimate:</strong> ₹${data.totalAmount}</p>
      </div>
      <p style="font-size: 14px; color: #64748B; font-family: Arial, sans-serif;">
        Please log in to your dashboard to review the items, assign a vehicle, and generate the final bill for the customer.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">VIEW DASHBOARD</a>
      </div>
    </div>
    ${getEmailFooter()}
  </div>
`;

const farmerEnquiryTemplate = (data) => `
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #F0FDF4;">
    ${getEmailHeader('New Product Enquiry')}
    <div style="padding: 30px; background-color: white;">
      <h2 style="color: #14532D; font-family: Arial, sans-serif;">Hello ${data.farmerName},</h2>
      <p style="font-size: 16px; color: #475569; font-family: Arial, sans-serif;">
        A customer has placed an enquiry for your fresh produce!
      </p>
      <div style="margin: 20px 0; padding: 20px; background-color: #DCFCE7; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #166534; font-family: Arial, sans-serif;">Enquiry Details:</h3>
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #15803D;"><strong>Crop:</strong> ${data.cropName}</p>
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #15803D;"><strong>Quantity:</strong> ${data.quantity} ${data.unit}</p>
        <p style="margin: 5px 0; font-family: Arial, sans-serif; color: #15803D;"><strong>Estimated Price:</strong> ₹${data.subtotal}</p>
      </div>
      <p style="font-size: 14px; color: #64748B; font-family: Arial, sans-serif;">
        You can review and accept this enquiry in your seller dashboard.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #16A34A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">VIEW ENQUIRY</a>
      </div>
    </div>
    ${getEmailFooter()}
  </div>
`;

module.exports = {
  managerApprovalTemplate,
  partnerApprovalTemplate,
  partnerRejectionTemplate,
  managerEnquiryTemplate,
  farmerEnquiryTemplate
};
