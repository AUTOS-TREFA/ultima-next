import React from 'react';
import { Facebook, Share2, Link as LinkIcon } from 'lucide-react';
import { WhatsAppIcon } from './icons';
import { toast } from 'sonner';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title, className = '' }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('¡Enlace copiado al portapapeles!');
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: WhatsAppIcon,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <p className="text-sm font-semibold text-gray-600">Compartir:</p>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center w-10 h-10 rounded-full text-white transition-transform active:scale-90 ${social.color}`}
          aria-label={`Share on ${social.name}`}
        >
          <social.icon className="w-5 h-5" />
        </a>
      ))}
      <button
        onClick={handleCopyLink}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-transform active:scale-90"
        aria-label="Copy link"
      >
        <LinkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ShareButtons;
