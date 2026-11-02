export const CONTACT = {
  phoneDisplay: '+96566414350',
  phoneTel: '+96566414350',
  whatsappNumber: '96566414350',
  email: 'travelpeek@gmail.com',
  facebook: 'https://www.facebook.com',
  x: 'https://x.com/GootajInfo',
  instagram: 'https://www.instagram.com/gootajinfo/',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3472.797281340866!2d47.9619108!3d29.2736705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fcf9b0b8e604495%3A0x3f653160abef7ceb!2z2YXYs9iq2LTYp9ihINiz2YrYqNinINin2YTYp9mB2Yog2KfZhNmG2YTYqti5!5e0!3m2!1sen!2seg!4v1710161869275',
};

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
