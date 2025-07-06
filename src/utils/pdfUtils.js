import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png'; // Adjust the path to your logo

export const generateVehicleReportPdf = (vehicleInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Set default font and colors
  doc.setFont('helvetica', 'normal');
  const primaryColor = [40, 53, 147]; // Dark blue
  const secondaryColor = [100, 100, 100]; // Gray
  const textColor = [0, 0, 0]; // Black

  // Header Section
  doc.addImage(logo, 'PNG', margin, yPos, 17, 20);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('VEHICLE INFORMATION REPORT', pageWidth / 2, yPos + 10, { align: 'center' });

  // Timestamp with increased spacing
  const now = new Date();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  yPos += 20;
  doc.text(`${now.toLocaleString()}`, pageWidth - margin, yPos + 5, { align: 'right' });

  // Divider
  yPos += 15;
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Vehicle Details Section
  yPos += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Vehicle Details', margin, yPos);

  // Two-column layout for vehicle info
  yPos += 10;
  const labelWidth = 100;
  const valueWidth = pageWidth - labelWidth - margin * 2;
  const lineHeight = 10;

  doc.setFontSize(12);
  doc.setTextColor(...textColor);

  Object.entries(vehicleInfo).forEach(([key, value], index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Vehicle Details (Continued)', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
    }

    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase()) + ':';

    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);

    doc.setFont('helvetica', 'normal');
    const splitValue = doc.splitTextToSize(value || '—', valueWidth);
    doc.text(splitValue, margin + labelWidth, yPos);

    yPos += Math.max(splitValue.length * lineHeight, lineHeight);
    if (index < Object.entries(vehicleInfo).length - 1) {
      yPos += 5;
    }
  });

  // Footer
  const footerY = pageHeight - 20;
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text('© 2025 FlexEvan • Confidential Report', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, footerY + 5, { align: 'right' });

  // Watermark
  doc.setFontSize(60);
  doc.setTextColor(200, 200, 200);
  doc.setGState(new doc.GState({ opacity: 0.2 }));
  doc.text('Ampere Software Technology', pageWidth / 1.4, pageHeight / 1.4, {
    angle: 45,
    align: 'center',
  });

  doc.save(`vehicle_report_${now.getTime()}.pdf`);
};