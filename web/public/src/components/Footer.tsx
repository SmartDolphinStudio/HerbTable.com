import { Link } from 'react-router-dom'
import { t } from '../i18n'

/** Site footer with copyright and links */
export default function Footer() {
  const footerLinks = [
    { label: t('footer.privacy'), path: '#' },
    { label: t('footer.terms'), path: '#' },
    { label: t('footer.api'), path: '#' },
  ]

  return (
    <footer className="w-full bg-transparent py-gap-lg mt-gap-lg border-t border-black/5">
      <div className="max-w-container-max mx-auto px-margin-page flex flex-col md:flex-row justify-between items-center gap-gap-md text-on-surface-variant">
        <div className="font-label-md text-label-md">{t('footer.copyright')}</div>
        <div className="flex gap-gap-md">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              className="font-label-md text-label-md hover:text-primary transition-colors"
              href={link.path}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
