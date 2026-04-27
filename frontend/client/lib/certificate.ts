import { jsPDF } from "jspdf";
import { Certificate, Activity } from "@/types";
import { capArray, getJson, setJson, MAX_STORED_CERTIFICATES } from "@/lib/safeStorage";

/**
 * Generate a certificate of participation as PDF
 */
export const generateCertificatePDF = (
  activity: Activity,
  userName: string
): Certificate => {
  const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const issueDate = new Date().toISOString();
  
  // Create certificate record
  const certificate: Certificate = {
    id: certificateId,
    activityId: activity.id,
    activityTitle: activity.title,
    userId: "",
    userName,
    issueDate,
    activityDate: activity.date,
  };

  // Generate PDF
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border design
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  doc.setDrawColor(189, 195, 199);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Header decoration
  doc.setFillColor(41, 128, 185);
  doc.circle(pageWidth / 2, 35, 15, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("★", pageWidth / 2, 40, { align: "center" });

  // Title
  doc.setTextColor(41, 128, 185);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Participation", pageWidth / 2, 65, { align: "center" });

  // Subtitle
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("This is to certify that", pageWidth / 2, 85, { align: "center" });

  // Recipient Name
  doc.setTextColor(41, 41, 41);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(userName, pageWidth / 2, 100, { align: "center" });

  // Activity description
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("has successfully participated in", pageWidth / 2, 115, { align: "center" });

  // Activity Title
  doc.setTextColor(41, 128, 185);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(activity.title, pageWidth / 2, 130, { align: "center" });

  // Activity details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Category: ${activity.category}`, pageWidth / 2, 145, { align: "center" });
  doc.text(`Date: ${new Date(activity.date).toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, pageWidth / 2, 155, { align: "center" });
  doc.text(`Venue: ${activity.venue}`, pageWidth / 2, 165, { align: "center" });

  // Certificate ID
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, 180, { align: "center" });

  // Footer decoration
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, 185, pageWidth / 2 + 50, 185);

  // Issued by
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(11);
  doc.text("Activity Hub Manager", pageWidth / 2, 195, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Issued on: ${new Date(issueDate).toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, pageWidth / 2, 202, { align: "center" });

  // Save the PDF
  doc.save(`Certificate_${activity.title.replace(/[^a-zA-Z0-9]/g, "_")}_${userName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);

  return certificate;
};

/**
 * Save certificate to localStorage
 */
export const saveCertificate = (certificate: Certificate): void => {
  const certificates = getJson<Certificate[]>("certificates", []);
  const next = capArray([certificate, ...certificates], MAX_STORED_CERTIFICATES);
  setJson("certificates", next);
};

/**
 * Get user certificates from localStorage
 */
export const getUserCertificates = (userId: string): Certificate[] => {
  const certificates = getJson<Certificate[]>("certificates", []);
  return certificates.filter((cert) => cert.userId === userId);
};

/**
 * Check if user has certificate for an activity
 */
export const hasCertificate = (userId: string, activityId: string): boolean => {
  const certificates = getJson<Certificate[]>("certificates", []);
  return certificates.some((cert) => cert.userId === userId && cert.activityId === activityId);
};

