import { CONTACT, whatsappUrl } from "@/lib/contact-config";
import { MessageCircle } from "lucide-react";

/**
 * Floating WhatsApp button — bottom-right on every public page.
 * Automatically hides if no WhatsApp number is configured.
 *
 * Set CONTACT.whatsappNumber in @/lib/contact-config.ts to enable.
 */
export function WhatsAppButton({ message }: { message?: string }) {
  const url = whatsappUrl(message);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${CONTACT.brandName} on WhatsApp`}
      className="fixed bottom-5 right-5 z-50 group"
    >
      <div className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
          Chat with us
        </span>
      </div>
    </a>
  );
}
