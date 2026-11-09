/**
 * Utility to format and open WhatsApp directly.
 * Uses both WhatsApp application deep-linking ('whatsapp://send')
 * and universal link fallback ('https://api.whatsapp.com/send').
 */
export function openWhatsApp(phone: string, clientName?: string, preferApp: boolean = true) {
  let clean = phone.replace(/\D/g, '');
  if (!clean) return false;

  // Add 91 if standard 10-digit Indian number without country code
  if (clean.length === 10) {
    clean = `91${clean}`;
  }

  const defaultMsg = `Hi ${clientName || ''}, following up regarding your inquiry with Reelman Production.`;
  const text = encodeURIComponent(defaultMsg);

  if (preferApp) {
    // Directly opens the WhatsApp Desktop or Mobile application
    window.location.href = `whatsapp://send?phone=${clean}&text=${text}`;
  } else {
    // Opens WhatsApp Web / Browser
    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${text}`, '_blank');
  }
  return true;
}
