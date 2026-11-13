/**
 * Utility to format and open WhatsApp directly.
 * Uses both WhatsApp application deep-linking ('whatsapp://send')
 * and universal link fallback ('https://api.whatsapp.com/send').
 */

export const WHATSAPP_TEMPLATES = {
  inquiry: (name?: string) =>
    `Hello ${name ? name.trim() + ' ' : ''}! 👋\n\nThank you for reaching out to *Reelman Production*. We specialize in cinematic wedding films, photography, and premium event coverage.\n\nWe'd love to discuss your upcoming event dates, vision, and packages. When would be a convenient time to connect?`,
  proposal: (name?: string) =>
    `Hello ${name ? name.trim() + ' ' : ''}! 👋\n\nHope you're doing well. We have prepared your curated photography & cinematography proposal from *Reelman Production*.\n\nPlease take a look and let us know if you'd like any customizations or have any questions!`,
  dateCheck: (name?: string, date?: string) =>
    `Hello ${name ? name.trim() + ' ' : ''}! 👋\n\nThis is a quick check regarding your upcoming event${date ? ` on *${date}*` : ''}. We are finalizing our shoot schedule at *Reelman Production* and would love to reserve our crew for your date.\n\nLet us know if you'd like to lock in the booking!`,
  quick: (name?: string) =>
    `Hi ${name ? name.trim() + ' ' : ''}! 👋 Following up from *Reelman Production* regarding your photography & film inquiry. Looking forward to speaking with you!`,
};

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES | 'status';

export function formatStatusWhatsAppMessage(
  template: string,
  clientName?: string,
  eventDate?: string,
  statusName?: string
): string {
  if (!template) return '';
  let msg = template;
  msg = msg.replace(/\{name\}/gi, clientName?.trim() || 'there');
  msg = msg.replace(/\{date\}/gi, eventDate || 'your event date');
  msg = msg.replace(/\{status\}/gi, statusName || '');
  return msg;
}

export function getDefaultWhatsAppMessage(
  clientName?: string,
  templateKey: WhatsAppTemplateKey = 'inquiry',
  eventDate?: string,
  statusTemplate?: string,
  statusName?: string
): string {
  if (templateKey === 'status' && statusTemplate) {
    return formatStatusWhatsAppMessage(statusTemplate, clientName, eventDate, statusName);
  }
  if (templateKey === 'dateCheck') {
    return WHATSAPP_TEMPLATES.dateCheck(clientName, eventDate);
  }
  if (templateKey in WHATSAPP_TEMPLATES) {
    return (WHATSAPP_TEMPLATES as Record<string, (n?: string) => string>)[templateKey](clientName);
  }
  return WHATSAPP_TEMPLATES.inquiry(clientName);
}

export function openWhatsApp(
  phone: string,
  clientName?: string,
  customMessage?: string,
  preferApp: boolean = true
) {
  let clean = phone.replace(/\D/g, '');
  if (!clean) return false;

  // Add 91 if standard 10-digit Indian number without country code
  if (clean.length === 10) {
    clean = `91${clean}`;
  }

  const message = customMessage || WHATSAPP_TEMPLATES.inquiry(clientName);
  const text = encodeURIComponent(message);

  if (preferApp) {
    // Directly opens WhatsApp Desktop or Mobile application
    window.location.href = `whatsapp://send?phone=${clean}&text=${text}`;
  } else {
    // Opens WhatsApp Web / Browser
    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${text}`, '_blank');
  }
  return true;
}

export function formatBookingSummaryWhatsAppMessage({
  name,
  date,
  workPrice = 0,
  advancePaid = 0,
  portalUrl,
}: {
  name?: string;
  date?: string;
  workPrice?: number;
  advancePaid?: number;
  portalUrl?: string;
}): string {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'your event date';
  const balanceDue = Math.max(0, workPrice - advancePaid);
  const formattedTotal = `₹${workPrice.toLocaleString('en-IN')}`;
  const formattedAdvance = `₹${advancePaid.toLocaleString('en-IN')}`;
  const formattedBalance = `₹${balanceDue.toLocaleString('en-IN')}`;

  let msg = `Hi ${name ? name.trim() : 'there'}! 📸 Your booking with *Reelman Production* for *${formattedDate}* is confirmed.\n\n`;
  msg += `*Booking Summary:*\n`;
  msg += `• Total Confirmed: ${formattedTotal}\n`;
  msg += `• Advance Received: ${formattedAdvance} ✅\n`;
  if (balanceDue > 0) {
    msg += `• Balance Due on Event Day: ${formattedBalance} ⏳\n`;
  } else {
    msg += `• Payment Status: Fully Paid ✅\n`;
  }
  if (portalUrl) {
    msg += `\nView your package details & track your deliverables here:\n${portalUrl}`;
  } else {
    msg += `\nWe are thrilled to capture your special day!`;
  }
  return msg;
}

export function formatPaymentReceiptWhatsAppMessage({
  name,
  amountPaid,
  paymentMethod = 'UPI',
  remainingBalance = 0,
  stageName = 'Payment',
  portalUrl,
}: {
  name?: string;
  amountPaid: number;
  paymentMethod?: string;
  remainingBalance?: number;
  stageName?: string;
  portalUrl?: string;
}): string {
  let msg = `Hi ${name ? name.trim() : 'there'}! 🧾 *Payment Receipt from Reelman Production*\n\n`;
  msg += `We have received your payment of *₹${amountPaid.toLocaleString('en-IN')}* via ${paymentMethod.toUpperCase()} for *${stageName}*.\n`;
  if (remainingBalance > 0) {
    msg += `• Remaining Balance: *₹${remainingBalance.toLocaleString('en-IN')}*\n`;
  } else {
    msg += `• Balance: *₹0 (All Dues Cleared)* ✅\n`;
  }
  if (portalUrl) {
    msg += `\nTrack your updated receipt and deliverables here:\n${portalUrl}`;
  }
  return msg;
}

export function formatMilestoneUpdateWhatsAppMessage({
  name,
  milestoneTitle,
  link,
  portalUrl,
}: {
  name?: string;
  milestoneTitle: string;
  link?: string;
  portalUrl?: string;
}): string {
  let msg = `Hi ${name ? name.trim() : 'there'}! 🎉 Great news from *Reelman Production*!\n\n`;
  msg += `Your milestone *"${milestoneTitle}"* is now ready! 🎬✨\n`;
  if (link) {
    msg += `\nAccess link: ${link}\n`;
  }
  if (portalUrl) {
    msg += `\nView your live project pipeline & status here:\n${portalUrl}`;
  }
  return msg;
}
