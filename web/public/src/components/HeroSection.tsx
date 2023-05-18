import { Link } from 'react-router-dom'
import { t } from '../i18n'

/** Hero section with headline, subtitle, and CTA buttons */
export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[921px] flex items-center overflow-hidden -mt-20">
      {/* Background Animated Orb */}
      <div className="absolute inset-0 z-0 bg-surface-bright">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-[#FF3366]/20 via-[#6633FF]/10 to-transparent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[800px] h-[800px] bg-gradient-to-tr from-primary/5 via-secondary/10 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Asymmetrical Rail */}
      <div className="hidden lg:block absolute left-0 top-0 w-rail-width h-full border-r border-black/5 z-10">
        <div className="flex flex-col items-center py-margin-page gap-gap-lg">
          <span className="[writing-mode:vertical-rl] font-mono-sm text-mono-sm text-on-surface-variant tracking-[0.2em] opacity-40 uppercase">
            HerbTable_v2.0
          </span>
          <div className="w-[1px] h-32 bg-black/10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-container-max mx-auto px-margin-page w-full grid grid-cols-12 gap-gap-md pt-32">
        <div className="col-span-12 lg:col-span-8 lg:col-start-2">
          <div className="flex flex-col items-start gap-gap-sm">
            {/* Tag */}
            <div className="flex items-center gap-gap-sm mb-4">
              <span className="w-12 h-[1px] bg-primary" />
              <span className="font-label-md text-label-md tracking-widest text-primary uppercase">
                {t('hero.tag')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-display text-primary max-w-3xl">
              {t('hero.title')}
              <br />
              {t('hero.titleLine2')}
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mt-4">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-gap-md mt-10">
              <Link
                to="/ai"
                className="group relative px-10 py-5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest overflow-hidden hover:shadow-xl transition-all duration-500 whitespace-nowrap"
              >
                <span className="relative z-10">{t('hero.ctaExplore')}</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <Link
                to="/explore"
                className="px-10 py-5 border-[0.5px] border-black/10 font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors whitespace-nowrap"
              >
                {t('hero.ctaDocs')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Metadata */}
      <div className="absolute bottom-12 right-margin-page hidden lg:flex flex-col items-end font-mono-sm text-mono-sm text-on-surface-variant opacity-60">
        <span>COOKING</span>
        <span>LAT: 35.6895° N</span>
        <span>LONG: 139.6917° E</span>
        <span>STATUS: SYNCHRONIZED</span>
      </div>
    </section>
  )
}
