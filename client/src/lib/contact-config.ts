/**
 * Central contact configuration for SiteTrack.
 *
 * Edit this ONE file to update contact info across the entire app
 * (legal pages, footer, contact form, WhatsApp button, etc.).
 */

export const CONTACT = {
  // Primary support email (used on landing, pricing, legal pages)
  supportEmail: "support@sitetrack.site",
  salesEmail: "sales@sitetrack.site",
  legalEmail: "legal@sitetrack.site",
  privacyEmail: "privacy@sitetrack.site",
  refundEmail: "refunds@sitetrack.site",

  // WhatsApp number in international format (digits only, no +)
  // Set to null to hide WhatsApp button everywhere.
  // Example: "919876543210" for +91 98765 43210
  whatsappNumber: null as string | null,

  // Public-facing phone number (display format). Set to null to hide.
  // Only fill this in when you have a real number to publish.
  phoneDisplay: null as string | null,

  // Brand + domain
  brandName: "SiteTrack",
  domain: "sitetrack.site",
  websiteUrl: "https://sitetrack.site",

  // Business jurisdiction (for Terms of Service)
  jurisdiction: "Chhatrapati Sambhajinagar, Maharashtra, India",

  // Support hours (plain text)
  supportHours: "Monday – Saturday, 9 AM – 6 PM IST",
} as const;

/** WhatsApp click-to-chat URL (returns null if no number configured) */
export function whatsappUrl(message = "Hi, I'd like to know more about SiteTrack."): string | null {
  if (!CONTACT.whatsappNumber) return null;
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
