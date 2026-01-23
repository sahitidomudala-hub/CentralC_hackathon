// Gig-Fin - Invoice Generation

const Invoice = {
    init() {
        this.bindForm();
    },

    bindForm() {
        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePDF();
        });
    },

    getFormData() {
        return {
            invoiceNumber: document.getElementById('invoice-number').value || 'INV-000',
            date: document.getElementById('invoice-date').value,
            clientName: document.getElementById('client-name').value,
            serviceDescription: document.getElementById('service-description').value,
            amount: parseFloat(document.getElementById('invoice-amount').value) || 0,
            yourName: document.getElementById('your-name').value
        };
    },

    formatDate(dateString) {
        if (!dateString) return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    generatePDF() {
        const data = this.getFormData();

        // Validate required fields
        if (!data.clientName || !data.serviceDescription || !data.amount || !data.yourName) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Colors
            const primaryColor = [126, 169, 115];
            const textColor = [31, 41, 55];
            const lightGray = [156, 163, 175];

            // Page dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // Header
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 50, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.text('INVOICE', margin, 30);

            // Invoice number
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`#${data.invoiceNumber}`, pageWidth - margin, 30, { align: 'right' });

            // Reset text color
            doc.setTextColor(...textColor);

            // Your Name/Business section (top right)
            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.text('FROM:', margin, 65);

            doc.setTextColor(...textColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(data.yourName, margin, 72);

            // Client info (top right)
            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.text('BILL TO:', pageWidth - margin, 65, { align: 'right' });

            doc.setTextColor(...textColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(data.clientName, pageWidth - margin, 72, { align: 'right' });

            // Date
            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.text('DATE:', margin, 90);
            doc.setTextColor(...textColor);
            doc.setFont('helvetica', 'normal');
            doc.text(this.formatDate(data.date), margin, 97);

            // Divider line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(margin, 110, pageWidth - margin, 110);

            // Service Description Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...textColor);
            doc.text('SERVICE DESCRIPTION', margin, 125);

            // Service description box
            doc.setFillColor(243, 244, 246);
            doc.roundedRect(margin, 130, contentWidth, 50, 3, 3, 'F');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...textColor);

            // Word wrap for service description
            const splitDescription = doc.splitTextToSize(data.serviceDescription, contentWidth - 10);
            let yPos = 142;
            splitDescription.forEach(line => {
                doc.text(line, margin + 5, yPos);
                yPos += 6;
            });

            // Total Section
            const totalY = 200;

            doc.setDrawColor(229, 231, 235);
            doc.line(margin, totalY, pageWidth - margin, totalY);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...textColor);
            doc.text('TOTAL DUE', margin, totalY + 15);

            doc.setFontSize(20);
            doc.setTextColor(...primaryColor);
            doc.text(Utils.formatCurrency(data.amount), pageWidth - margin, totalY + 15, { align: 'right' });

            // Footer
            const footerY = pageHeight - 30;

            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(2);
            doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.setFont('helvetica', 'normal');
            doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

            doc.text('This is a manually generated invoice.', pageWidth / 2, footerY + 7, { align: 'center' });

            // Generate filename
            const filename = `Invoice_${data.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${data.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

            // Save PDF
            doc.save(filename);

            UI.showToast('Invoice PDF generated successfully!', 'success');

        } catch (error) {
            console.error('Error generating PDF:', error);
            UI.showToast('Error generating PDF. Please try again.', 'error');
        }
    }
};

// Initialize invoice
document.addEventListener('DOMContentLoaded', () => {
    Invoice.init();
});

