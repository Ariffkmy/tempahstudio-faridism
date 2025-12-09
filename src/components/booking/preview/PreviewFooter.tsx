// =============================================
// PREVIEW FOOTER COMPONENT
// =============================================
// Preview of custom footer with social media links

import { Facebook, Instagram, MessageCircle } from 'lucide-react';

interface PreviewFooterProps {
  whatsappLink: string;
  facebookLink: string;
  instagramLink: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

const PreviewFooter = ({
  whatsappLink,
  facebookLink,
  instagramLink,
  brandColorPrimary,
  brandColorSecondary,
}: PreviewFooterProps) => {
  const socialLinks = [
    {
      icon: MessageCircle,
      link: whatsappLink,
      label: 'WhatsApp',
      visible: !!whatsappLink,
    },
    {
      icon: Facebook,
      link: facebookLink,
      label: 'Facebook',
      visible: !!facebookLink,
    },
    {
      icon: Instagram,
      link: instagramLink,
      label: 'Instagram',
      visible: !!instagramLink,
    },
  ].filter(item => item.visible);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <footer
      className="py-6 mt-auto"
      style={{
        backgroundColor: brandColorPrimary,
        color: brandColorSecondary,
      }}
    >
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Social Media Icons */}
          <div className="flex items-center gap-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href="#"
                className="hover:opacity-80 transition-opacity cursor-not-allowed"
                aria-label={social.label}
                onClick={(e) => e.preventDefault()}
                style={{ color: brandColorSecondary }}
              >
                <social.icon className="h-6 w-6" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-sm opacity-80">
            © {new Date().getFullYear()} Studio. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PreviewFooter;
