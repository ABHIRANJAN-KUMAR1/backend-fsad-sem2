import { Activity } from "@/types";

/**
 * Generate an iCal formatted string for an activity
 */
export const generateICalEvent = (activity: Activity): string => {
  const startDate = new Date(activity.date);
  
  // Use activity's startTime if available, otherwise use midnight
  if (activity.startTime) {
    const [hours, minutes] = activity.startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Calculate end date - use activity's endTime if available, otherwise assume 2 hours
  let endDate: Date;
  if (activity.endTime) {
    endDate = new Date(activity.date);
    const [endHours, endMinutes] = activity.endTime.split(":");
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
  } else {
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  }

  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Activity Hub Manager//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${escapeICalText(activity.title)}`,
    `DESCRIPTION:${escapeICalText(activity.description)}`,
    `LOCATION:${escapeICalText(activity.venue)}`,
    `UID:${activity.id}@activityhubmanager`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return icsContent;
};

/**
 * Download an iCal file for an activity
 */
export const downloadICalEvent = (activity: Activity): void => {
  const icsContent = generateICalEvent(activity);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activity.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (activity: Activity): string => {
  const startDate = new Date(activity.date);
  
  // Use activity's startTime if available
  if (activity.startTime) {
    const [hours, minutes] = activity.startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Calculate end date
  let endDate: Date;
  if (activity.endTime) {
    endDate = new Date(activity.date);
    const [endHours, endMinutes] = activity.endTime.split(":");
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
  } else {
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  }

  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: activity.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: activity.description,
    location: activity.venue,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Web Calendar URL
 */
export const generateOutlookCalendarUrl = (activity: Activity): string => {
  const startDate = new Date(activity.date);
  
  // Use activity's startTime if available
  if (activity.startTime) {
    const [hours, minutes] = activity.startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Calculate end date
  let endDate: Date;
  if (activity.endTime) {
    endDate = new Date(activity.date);
    const [endHours, endMinutes] = activity.endTime.split(":");
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
  } else {
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  }

  const formatOutlookDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const params = new URLSearchParams({
    subject: activity.title,
    startdt: formatOutlookDate(startDate),
    enddt: formatOutlookDate(endDate),
    body: activity.description,
    location: activity.venue,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Copy activity link to clipboard
 */
export const copyActivityLink = async (activityId: string): Promise<boolean> => {
  const baseUrl = window.location.origin;
  const activityUrl = `${baseUrl}/activities/${activityId}`;
  
  try {
    await navigator.clipboard.writeText(activityUrl);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = activityUrl;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

