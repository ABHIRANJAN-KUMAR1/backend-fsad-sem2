import jsPDF from "jspdf";
import { Activity } from "@/types";

/**
 * Export a single activity details as PDF
 */
export const exportActivityToPDF = (activity: Activity): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Activity Details", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Activity Hub Manager", 105, 32, { align: "center" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 55;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(activity.title, 20, yPos);
  yPos += 15;

  // Category Badge
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(20, yPos - 5, 30, 8, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(activity.category, 35, yPos, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Details section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Details", 20, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  // Date
  doc.text(`Date: ${new Date(activity.date).toLocaleDateString()}`, 25, yPos);
  yPos += 7;
  
  // Venue
  doc.text(`Venue: ${activity.venue}`, 25, yPos);
  yPos += 7;
  
  // Participants
  doc.text(`Participants: ${activity.currentParticipants.length} / ${activity.maxParticipants}`, 25, yPos);
  yPos += 7;
  
  // Waitlist
  if (activity.waitlist.length > 0) {
    doc.text(`Waitlist: ${activity.waitlist.length} students`, 25, yPos);
    yPos += 7;
  }
  yPos += 5;

  // Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Description", 20, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const splitDescription = doc.splitTextToSize(activity.description, 170);
  doc.text(splitDescription, 25, yPos);
  yPos += splitDescription.length * 5 + 10;

  // Ratings section
  if (activity.ratings.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ratings & Reviews", 20, yPos);
    yPos += 8;
    
    const avgRating = (activity.ratings.reduce((sum, r) => sum + r.score, 0) / activity.ratings.length).toFixed(1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Average Rating: ${avgRating} / 5 (${activity.ratings.length} reviews)`, 25, yPos);
    yPos += 10;
  }

  // Comments section
  if (activity.comments.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Comments", 20, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    activity.comments.slice(0, 5).forEach((comment) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${comment.userName}:`, 25, yPos);
      doc.setFont("helvetica", "normal");
      const splitComment = doc.splitTextToSize(comment.content, 150);
      doc.text(splitComment, 30, yPos + 5);
      yPos += splitComment.length * 5 + 10;
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(240, 240, 240);
  doc.rect(0, pageHeight - 20, 210, 20, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()} by Activity Hub Manager`, 105, pageHeight - 10, { align: "center" });

  // Save
  doc.save(`${activity.title.replace(/\s+/g, "-")}-details.pdf`);
};

/**
 * Export list of activities as PDF
 */
export const exportActivitiesListToPDF = (activities: Activity[]): void => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 297, 25, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Activities Report", 148.5, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${activities.length} activities`, 148.5, 20, { align: "center" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 40;

  // Table header
  doc.setFillColor(59, 130, 246);
  doc.rect(15, yPos - 5, 267, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("#", 20, yPos);
  doc.text("Title", 30, yPos);
  doc.text("Category", 100, yPos);
  doc.text("Date", 140, yPos);
  doc.text("Venue", 175, yPos);
  doc.text("Participants", 220, yPos);
  doc.text("Status", 265, yPos);

  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  activities.forEach((activity, index) => {
    yPos += 10;
    
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 267, 8, "F");
    }
    
    doc.setFontSize(9);
    
    // Check if we need a new page
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`${index + 1}`, 20, yPos);
    
    // Truncate title if too long
    const title = activity.title.length > 30 ? activity.title.substring(0, 27) + "..." : activity.title;
    doc.text(title, 30, yPos);
    doc.text(activity.category, 100, yPos);
    doc.text(new Date(activity.date).toLocaleDateString(), 140, yPos);
    doc.text(activity.venue.length > 15 ? activity.venue.substring(0, 12) + "..." : activity.venue, 175, yPos);
    doc.text(`${activity.currentParticipants.length}/${activity.maxParticipants}`, 220, yPos);
    
    const isUpcoming = new Date(activity.date) > new Date();
    const isFull = activity.currentParticipants.length >= activity.maxParticipants;
    let status = isUpcoming ? "Upcoming" : "Past";
    if (isFull && isUpcoming) status = "Full";
    
    doc.text(status, 265, yPos);
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()} by Activity Hub Manager`, 148.5, 200, { align: "center" });

  // Save
  doc.save(`activities-report-${new Date().toISOString().split("T")[0]}.pdf`);
};

/**
 * Export activity certificate as PDF
 */
export const exportCertificatePDF = (activity: Activity, userName: string): void => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Certificate border
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);
  
  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, 270, 180);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(0, 51, 102);
  doc.text("CERTIFICATE OF PARTICIPATION", 148.5, 45, { align: "center" });

  // Decorative line
  doc.setLineWidth(1);
  doc.line(80, 55, 217, 55);

  // "This is to certify that"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text("This is to certify that", 148.5, 70, { align: "center" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.text(userName, 148.5, 90, { align: "center" });

  // Underline for name
  doc.setLineWidth(0.5);
  doc.line(100, 95, 197, 95);

  // "has successfully participated in"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text("has successfully participated in the activity", 148.5, 110, { align: "center" });

  // Activity title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102);
  doc.text(activity.title, 148.5, 130, { align: "center" });

  // Activity details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`Category: ${activity.category}`, 148.5, 150, { align: "center" });
  doc.text(`Date: ${new Date(activity.date).toLocaleDateString()}`, 148.5, 160, { align: "center" });
  doc.text(`Venue: ${activity.venue}`, 148.5, 170, { align: "center" });

  // Footer branding
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Activity Hub Manager", 148.5, 195, { align: "center" });
  doc.text("Organizing and Managing Student Extracurricular Activities", 148.5, 202, { align: "center" });

  // Save
  doc.save(`Certificate-${activity.title.replace(/\s+/g, "-")}.pdf`);
};

