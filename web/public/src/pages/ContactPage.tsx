import { t } from '../i18n'

/** Contact page with form and info */
export default function ContactPage() {
  return (
    <div className="max-w-container-max mx-auto px-margin-page py-gap-lg">
      {/* Header */}
      <div className="text-center mb-gap-lg">
        <span className="font-mono-sm text-mono-sm text-on-surface-variant uppercase tracking-tighter mb-2 block">
          03 // Contact
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary">{t('contact.title')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl mx-auto">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gap-lg max-w-5xl mx-auto">
        {/* Contact Form */}
        <div className="bg-surface-container-low rounded-lg p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('contact.form.name')}
              </label>
              <input
                type="text"
                className="w-full bg-surface-bright border border-black/10 rounded-lg px-4 py-3 font-body-md text-body-md text-on-background focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('contact.form.email')}
              </label>
              <input
                type="email"
                className="w-full bg-surface-bright border border-black/10 rounded-lg px-4 py-3 font-body-md text-body-md text-on-background focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('contact.form.subject')}
              </label>
              <input
                type="text"
                className="w-full bg-surface-bright border border-black/10 rounded-lg px-4 py-3 font-body-md text-body-md text-on-background focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('contact.form.message')}
              </label>
              <textarea
                rows={5}
                className="w-full bg-surface-bright border border-black/10 rounded-lg px-4 py-3 font-body-md text-body-md text-on-background focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('contact.form.send')}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col justify-center gap-8">
          <div className="bg-surface-container-low rounded-lg p-8">
            <span className="material-symbols-outlined text-primary text-[32px] mb-4 block">mail</span>
            <h3 className="font-headline-lg text-headline-lg text-primary mb-2">Email</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('contact.info.email')}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-8">
            <span className="material-symbols-outlined text-primary text-[32px] mb-4 block">location_on</span>
            <h3 className="font-headline-lg text-headline-lg text-primary mb-2">Location</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('contact.info.location')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
