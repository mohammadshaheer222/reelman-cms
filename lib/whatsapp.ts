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
