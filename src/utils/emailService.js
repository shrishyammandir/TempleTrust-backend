const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send donation confirmation email
exports.sendDonationEmail = async (donation, pdfBuffer) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: donation.email,
            subject: `Donation Receipt - ${donation.receiptNumber}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #FF6600, #800000); color: white; padding: 30px; text-align: center; }
                        .content { padding: 30px; background: #f9f9f9; }
                        .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
                        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                        .btn { display: inline-block; padding: 12px 30px; background: #FF6600; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🙏 Thank You for Your Donation</h1>
                        </div>
                        
                        <div class="content">
                            <p>Dear ${donation.fullName},</p>
                            
                            <p>We are grateful for your generous donation to Temple Trust. Your contribution helps us continue our spiritual and charitable activities.</p>
                            
                            <div class="details">
                                <h3>Donation Details</h3>
                                <div class="detail-row">
                                    <span>Receipt Number:</span>
                                    <strong>${donation.receiptNumber}</strong>
                                </div>
                                <div class="detail-row">
                                    <span>Amount:</span>
                                    <strong>₹${donation.amount.toLocaleString('en-IN')}</strong>
                                </div>
                                <div class="detail-row">
                                    <span>Category:</span>
                                    <strong>${donation.category}</strong>
                                </div>
                                <div class="detail-row">
                                    <span>Date:</span>
                                    <strong>${new Date(donation.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</strong>
                                </div>
                                ${donation.razorpayPaymentId ? `
                                <div class="detail-row">
                                    <span>Payment ID:</span>
                                    <strong>${donation.razorpayPaymentId}</strong>
                                </div>
                                ` : ''}
                            </div>
                            
                            <p><strong>80G Tax Exemption:</strong> This donation is eligible for 80G tax deduction. Please find the official receipt attached to this email.</p>
                            
                            ${donation.dedication ? `<p><strong>Your Message:</strong> ${donation.dedication}</p>` : ''}
                            
                            <p>May the divine blessings be with you and your family.</p>
                            
                            <p>If you have any questions, please contact us at ${process.env.TRUST_PHONE} or ${process.env.TRUST_EMAIL}.</p>
                        </div>
                        
                        <div class="footer">
                            <p><strong>Temple Trust</strong></p>
                            <p>${process.env.TRUST_ADDRESS}</p>
                            <p>Registration No: ${process.env.TRUST_REGISTRATION_NO} | 80G No: ${process.env.TRUST_80G_NO}</p>
                            <p>PAN: ${process.env.TRUST_PAN}</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: `receipt-${donation.receiptNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Donation email sent to ${donation.email}`);
        
    } catch (error) {
        console.error('Error sending donation email:', error);
        throw error;
    }
};

// Send admin notification
exports.sendAdminNotification = async (donation) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: `New Donation Received - ₹${donation.amount}`,
            html: `
                <h2>New Donation Received</h2>
                <p><strong>Donor:</strong> ${donation.fullName}</p>
                <p><strong>Email:</strong> ${donation.email}</p>
                <p><strong>Phone:</strong> ${donation.phone}</p>
                <p><strong>Amount:</strong> ₹${donation.amount.toLocaleString('en-IN')}</p>
                <p><strong>Category:</strong> ${donation.category}</p>
                <p><strong>Receipt Number:</strong> ${donation.receiptNumber}</p>
                <p><strong>Payment Method:</strong> ${donation.paymentMethod}</p>
                ${donation.razorpayPaymentId ? `<p><strong>Payment ID:</strong> ${donation.razorpayPaymentId}</p>` : ''}
                ${donation.dedication ? `<p><strong>Message:</strong> ${donation.dedication}</p>` : ''}
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent');
        
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
};

// Send contact form notification
exports.sendContactNotification = async (contact) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: `New Contact Form Submission - ${contact.subject || 'No Subject'}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${contact.name}</p>
                <p><strong>Email:</strong> ${contact.email}</p>
                <p><strong>Phone:</strong> ${contact.phone}</p>
                ${contact.subject ? `<p><strong>Subject:</strong> ${contact.subject}</p>` : ''}
                <p><strong>Message:</strong></p>
                <p>${contact.message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Contact notification sent');
        
    } catch (error) {
        console.error('Error sending contact notification:', error);
    }
};
