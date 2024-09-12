import { Link } from 'react-router-dom'
import { t } from '../i18n'

interface GalleryCard {
  id: string
  title?: string
  subtitle?: string
  tag?: string
  tagStyle?: string
  image: string
  alt: string
  span: string
  aspect?: string
  grayscale?: boolean
  overlay?: 'gradient' | 'center' | 'none'
  liveFeed?: boolean
}

const galleryCards: GalleryCard[] = [
  {
    id: 'main-feature',
    title: 'Desert Monolith',
    subtitle: 'Project_082',
    tag: 'RAW',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYBilEYyErvBKolQsY6ZNn1kif4m-tevha-dXqge0E_JW8ZkDtDcr4zSnOiikQ1o3ateKLO5ljNMs5b9EOCriy-kt-dC4I3c-1qNFzeL8NtUXx2wmHTrBU_bmMr4nl1GBfr0g83oQI_xKlz_Zfhavt93F6Ma3GZTqJT4279uF1ZOw6PviPQ_gBx9yIL5xoCMHIDKsNtrs-vdd_4ih1lwbcljxNihdLyAX-FtgIapOFjuBy1ykV0eRJJg',
    alt: 'A hyper-realistic cinematic shot of a minimalist architectural structure in a desert at sunset.',
    span: 'md:col-span-7',
    aspect: 'aspect-[4/3]',
    overlay: 'gradient',
  },
  {
    id: 'vertical-card',
    tag: '4K_RENDER',
    tagStyle: 'bg-primary/90 text-on-primary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANFJfimXW5I50mHMKwOex6YDXK5ZCz8YzkOW7jkovShQ_Jhl6tS7YHoNndoKeFCV0AnN47Mi1JZre3il4RWN07I_tZvEDzrPqwHwK3LZg7rZWNi3YeSjNwuE79ruLJ1CzHsZS41VlOV4pZ7Kkfx_mpr7sn0hGx0zIZ5Zd_-HLWOGPbpxZzB5IbN5sFTG4pUDd29-TQqZ0xDGh-cjYBeP7sZSZy3MZpAvJLUR5v4iZxyH5OLShTzFNM2w',
    alt: 'Close-up macro photography of liquid metal ripples reflecting neon violet and deep azure light.',
    span: 'md:col-span-5',
  },
  {
    id: 'portrait-card',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7zJi58mhQQ3G9k2drSOovR84LGrexZRrCfEqkdxnC6BhzacImSp3Nh-uZx7MDJlyOBeEchtv9t8lHNt2G73qwjm7DkqacFexTdolP51BDUP4qhn6HpobW_2L9nSfqk1VTAkupmtfcusQER_jMskgez5ut_uqbVg1TZLeCkRxIiLG6ciOiUC3oFBEqkdby2Dds3DBKeI0nB1KN2ifVkhK1Pzbqspz7mZlzurV9xdiFFepj1iuy4GjteA',
    alt: 'A portrait of a digital entity made of light particles and fiber optic strands.',
    span: 'md:col-span-4',
    aspect: 'aspect-square',
    grayscale: true,
    overlay: 'center',
  },
  {
    id: 'panoramic-card',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqOmnI2AFzZDiQ8YX56sO10xHIXD2AuTMnjIUXXFfG2WD_n30c3lAC6bjPC3UlphAbiLyCWA8h3SeIfCe8nfYRnC0Wi2vCMar3UXu3whJ9SOGglO2n6xvQomFJRGWxf12g5yKdptEgnkaxFDWUK1DNs5h179eQGJjDcD3LDrjaVWZuARNlRt0Uf0ka0NgLh3y-wAjjqO6TrYjXG7Zmqej2mpdJW8Iqlu60VlchIXEZOEaXNwtk4x88MQ',
    alt: 'A panoramic wide-angle shot of a futuristic Tokyo street at night.',
    span: 'md:col-span-8',
    aspect: 'aspect-[21/9]',
    liveFeed: true,
  },
]

/** Bento grid gallery section */
export default function GallerySection() {
  return (
    <section className="w-full py-gap-lg bg-surface-bright relative z-10">
      <div className="max-w-container-max mx-auto px-margin-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-gap-lg gap-gap-md">
          <div className="max-w-2xl">
            <span className="font-mono-sm text-mono-sm text-on-surface-variant uppercase tracking-tighter mb-2 block">
              {t('gallery.sectionLabel')}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">{t('gallery.title')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {t('gallery.description')}
            </p>
          </div>
          <Link
            to="/explore"
            className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-60 transition-opacity"
          >
            View All
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gap-md">
          {galleryCards.map((card) => (
            <GalleryCardItem key={card.id} card={card} />
          ))}

          {/* Info Cards Row */}
          <div className="md:col-span-5 flex gap-gap-md">
            <Link
              to="/ai"
              className="flex-1 bg-surface-container-highest p-6 rounded-lg flex flex-col justify-between hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[32px]">auto_awesome</span>
              <div>
                <p className="font-label-md text-primary">{t('gallery.ctaExploreAi')}</p>
                <p className="font-body-md text-on-surface-variant text-[14px]">
                  {t('gallery.ctaExploreAiDesc')}
                </p>
              </div>
            </Link>
            <Link
              to="/explore"
              className="flex-1 bg-primary p-6 rounded-lg flex flex-col justify-between"
            >
              <span className="material-symbols-outlined text-on-primary text-[32px]">
                arrow_outward
              </span>
              <p className="font-label-md text-on-primary">{t('gallery.ctaStart')}</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function GalleryCardItem({ card }: { card: GalleryCard }) {
  return (
    <Link
      to={`/gallery/${card.id}`}
      className={`${card.span} group relative overflow-hidden bg-surface-container rounded-lg ${card.aspect ?? ''}`}
    >
      <img
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${card.grayscale ? 'grayscale group-hover:grayscale-0' : ''}`}
        alt={card.alt}
        src={card.image}
      />

      {card.overlay === 'gradient' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <div>
              <span className="font-mono-sm text-[10px] text-white/70 uppercase">{card.subtitle}</span>
              <h3 className="font-headline-lg text-white text-[24px]">{card.title}</h3>
            </div>
            <span className="font-label-md text-white border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              {card.tag}
            </span>
          </div>
        </>
      )}

      {card.tag && card.overlay !== 'gradient' && (
        <div className="absolute top-4 left-4">
          <span className={`${card.tagStyle ?? 'bg-primary/90 text-on-primary'} font-mono-sm text-[10px] px-2 py-1 backdrop-blur-sm`}>
            {card.tag}
          </span>
        </div>
      )}

      {card.overlay === 'center' && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-label-md text-white border border-white/40 px-6 py-2">VIEW SERIES</span>
        </div>
      )}

      {card.liveFeed && (
        <div className="absolute top-6 right-6">
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-mono-sm text-white text-[10px] tracking-widest">LIVE_FEED</span>
          </div>
        </div>
      )}
    </Link>
  )
}
