const PDFDocument = require('pdfkit');

exports.generatePDFReceipt = async (donation) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24)
               .fillColor('#FF6600')
               .text('TEMPLE TRUST', { align: 'center' })
               .moveDown(0.5);

            doc.fontSize(12)
               .fillColor('#000000')
               .text(process.env.TRUST_ADDRESS || 'Temple Address', { align: 'center' })
               .text(`Phone: ${process.env.TRUST_PHONE || 'N/A'} | Email: ${process.env.TRUST_EMAIL || 'N/A'}`, { align: 'center' })
               .moveDown(0.5);

            // Registration details
            doc.fontSize(10)
               .text(`Registration No: ${process.env.TRUST_REGISTRATION_NO || 'N/A'} | 80G No: ${process.env.TRUST_80G_NO || 'N/A'} | PAN: ${process.env.TRUST_PAN || 'N/A'}`, { align: 'center' })
               .moveDown(1);

            // Line separator
            doc.moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke()
               .moveDown(1);

            // Receipt title
            doc.fontSize(18)
               .fillColor('#800000')
               .text('DONATION RECEIPT', { align: 'center' })
               .moveDown(1);

            // Receipt number and date
            doc.fontSize(11)
               .fillColor('#000000')
               .text(`Receipt No: ${donation.receiptNumber}`, 50, doc.y, { continued: true })
               .text(`Date: ${new Date(donation.createdAt).toLocaleDateString('en-IN', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
               })}`, { align: 'right' })
               .moveDown(2);

            // Donor details
            doc.fontSize(12)
               .fillColor('#FF6600')
               .text('DONOR DETAILS', { underline: true })
               .moveDown(0.5);

            const yStart = doc.y;
            doc.fontSize(11)
               .fillColor('#000000')
               .text(`Name: ${donation.fullName}`, 50)
               .text(`Email: ${donation.email}`)
               .text(`Phone: ${donation.phone}`);

            if (donation.pan) {
                doc.text(`PAN: ${donation.pan}`);
            }

            if (donation.address) {
                doc.text(`Address: ${donation.address}`);
            }

            doc.moveDown(2);

            // Donation details
            doc.fontSize(12)
               .fillColor('#FF6600')
               .text('DONATION DETAILS', { underline: true })
               .moveDown(0.5);

            // Table-like structure
            const tableTop = doc.y;
            doc.fontSize(11)
               .fillColor('#000000');

            // Headers
            doc.text('Category', 50, tableTop, { width: 200 })
               .text('Amount', 300, tableTop, { width: 200, align: 'right' });

            doc.moveDown(0.5);
            doc.moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            doc.moveDown(0.5);

            // Values
            doc.text(donation.category, 50, doc.y, { width: 200 })
               .text(`₹ ${donation.amount.toLocaleString('en-IN')}`, 300, doc.y, { width: 200, align: 'right' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            doc.moveDown(0.5);

            // Total
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('TOTAL AMOUNT', 50, doc.y, { width: 200 })
               .text(`₹ ${donation.amount.toLocaleString('en-IN')}`, 300, doc.y, { width: 200, align: 'right' });

            doc.moveDown(2);

            // Amount in words
            doc.font('Helvetica')
               .fontSize(11)
               .text(`Amount in words: ${numberToWords(donation.amount)} Rupees Only`)
               .moveDown(2);

            if (donation.dedication) {
                doc.fontSize(10)
                   .text(`Dedication: ${donation.dedication}`, { width: 495 })
                   .moveDown(1);
            }

            // Payment details
            if (donation.razorpayPaymentId) {
                doc.fontSize(10)
                   .text(`Payment Mode: Online (${donation.paymentMethod})`)
                   .text(`Transaction ID: ${donation.razorpayPaymentId}`)
                   .moveDown(1);
            }

            // 80G Notice
            doc.fontSize(10)
               .fillColor('#008000')
               .text('This donation is eligible for tax exemption under Section 80G of the Income Tax Act, 1961.', {
                   width: 495,
                   align: 'justify'
               })
               .moveDown(2);

            // Signature
            doc.fontSize(10)
               .fillColor('#000000')
               .text('For Temple Trust', 400)
               .moveDown(3)
               .text('Authorized Signatory', 400);

            // Footer
            doc.fontSize(9)
               .fillColor('#666666')
               .text('This is a computer-generated receipt and does not require a physical signature.', 50, 750, {
                   align: 'center',
                   width: 495
               });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

// Helper function to convert number to words (simplified version)
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    let words = '';

    // Lakhs
    if (num >= 100000) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }

    // Thousands
    if (num >= 1000) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }

    // Hundreds
    if (num >= 100) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
    }

    // Tens and ones
    if (num >= 20) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    } else if (num >= 10) {
        words += teens[num - 10] + ' ';
        return words.trim();
    }

    if (num > 0) {
        words += ones[num] + ' ';
    }

    return words.trim();
}
