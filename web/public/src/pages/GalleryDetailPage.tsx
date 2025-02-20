import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'

type BadgeType =
  | 'creator'
  | 'enterprise'
  | 'official'
  | 'vip'
  | 'subscriber'
  | 'collector'
  | 'photographer'
  | 'curator'

interface RelatedWork {
  id: string
  title: string
  subtitle: string
  image: string
  alt: string
}

interface Artist {
  id: string
  name: string
  role: string
  avatar: string
  badge: BadgeType
  verified: boolean
}

interface GalleryMeta {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  likes: number
  saves: number
  protected: boolean
  artist: Artist
  specs: {
    camera: string
    lens: string
    shutter: string
    aperture: string
  }
  relatedWorks: RelatedWork[]
}

const BADGE_CONFIG: Record<
  BadgeType,
  { bg: string; text: string; icon: string; label: string }
> = {
  creator: { bg: 'bg-black', text: 'text-white', icon: 'check_circle', label: 'Verified Creator' },
  enterprise: { bg: 'bg-blue-600', text: 'text-white', icon: 'corporate_fare', label: 'Enterprise Account' },
  official: { bg: 'bg-yellow-500', text: 'text-black', icon: 'verified', label: 'Official Account' },
  vip: { bg: 'bg-purple-600', text: 'text-white', icon: 'stars', label: 'VIP Member' },
  subscriber: { bg: 'bg-green-600', text: 'text-white', icon: 'subscriptions', label: 'Subscriber' },
  collector: { bg: 'bg-orange-500', text: 'text-white', icon: 'collections_bookmark', label: 'Verified Collector' },
  photographer: { bg: 'bg-pink-600', text: 'text-white', icon: 'photo_camera', label: 'Photographer' },
  curator: { bg: 'bg-teal-600', text: 'text-white', icon: 'museum', label: 'Senior Curator' },
}

const FIRST_NAMES = [
  'Elena', 'Julian', 'Marcus', 'Sofia', 'Kai', 'Ava', 'Leo', 'Mira', 'Omar', 'Yuki',
  'Ingrid', 'Dante', 'Lila', 'Finn', 'Aria', 'Theo', 'Zoe', 'Noah', 'Isla', 'Ezra',
]

const LAST_NAMES = [
  'Voss', 'Vane', 'Aurelius', 'Chen', 'Mori', 'Reed', 'Dupont', 'Kowalski', 'Farooq', 'Tanaka',
  'Berg', 'Rossi', 'Moon', 'Sato', 'Kim', 'Liu', 'Pierce', 'Vansk', 'Frame', 'Novi',
]

const ROLES = [
  'Senior Curator', 'Visual Artist', 'Photographer', 'Digital Sculptor', 'Creative Director',
  'Brand Strategist', 'Art Collector', 'Independent Creator', 'Gallery Owner', 'Design Lead',
]

const CAMERAS = [
  'Phase One XF', 'Hasselblad X2D', 'Sony A7R V', 'Canon R5', 'Leica SL3', 'Fujifilm GFX 100S',
  'Nikon Z9', 'RED V-Raptor', 'Arri Alexa 35', 'Blackmagic URSA',
]

const LENSES = [
  '35mm f/2.8 Blue Ring', '50mm f/1.2 Summilux', '85mm f/1.4 GM', '24-70mm f/2.8 Art',
  '16-35mm f/2.8 Zoom', '90mm f/2.8 Macro', '135mm f/1.8 Tele', '14mm f/1.8 Astro',
]

const SHUTTERS = ['1/250s', '1/500s', '1/125s', '1/60s', '1/1000s', '1/4000s', '2s', '10s']
const APERTURES = ['f/8.0', 'f/2.8', 'f/1.4', 'f/5.6', 'f/11', 'f/16', 'f/4.0']

const TAG_POOL = [
  'BRUTALISM', 'ARCHITECTURE', 'MINIMAL', 'PORTRAIT', 'NATURE', 'ABSTRACT', 'STUDIO',
  'LANDSCAPE', 'URBAN', 'MONOCHROME', 'VIBRANT', 'CINEMATIC', 'MOODY', 'AERIAL', 'MACRO',
  'FASHION', 'CONCEPTUAL', 'GEOMETRIC', 'LIGHT', 'RAW', '8K', 'DIGITAL', 'FILM', 'NOCTURNE',
]

const ADJECTIVES = [
  'Silent', 'Mercury', 'Fluid', 'Brutalist', 'Beacon', 'Less', 'Desert', 'Spiral', 'Vein',
  'Horizon', 'Neon', 'Eclipse', 'Crystal', 'Velvet', 'Concrete', 'Aurora', 'Drift', 'Pulse',
  'Vapor', 'Iron', 'Salt', 'Echo', 'Prism', 'Nocturne', 'Flux', 'Obsidian', 'Lumen', 'Solstice',
  'Tide', 'Rift', 'Axiom', 'Cypher', 'Halo', 'Frost', 'Ember', 'Solar', 'Lunar', 'Glass',
]

const NOUNS = [
  'Monolith', 'Dunes', 'Void', 'Volume', 'Structure', 'Frame', 'Storm', 'Oasis', 'Reflection',
  'Fragment', 'Orbit', 'Trace', 'Residue', 'Frequency', 'Signal', 'Wave', 'Particle', 'Boundary',
  'Threshold', 'Continuum', 'Surface', 'Gradient', 'Texture', 'Shadow', 'Light', 'Form', 'Line',
]

const DESCRIPTION_TEMPLATES = [
  'Part of the "{series}" series, exploring the intersection of {topic1} and {topic2}. Captured during the {event} in {location}.',
  'A study in {topic1} from the "{series}" collection. Shot on location in {location} during {event}.',
  'From the "{series}" archive: {topic1} meets {topic2}. Recorded in {location} for the {event} project.',
  'Commissioned piece for the {event} initiative. Blends {topic1} with {topic2} in {location}.',
]

const TOPICS = [
  'brutalist geometry', 'extreme natural environments', 'urban density', 'organic decay',
  'artificial light', 'natural silence', 'temporal motion', 'material contrast', 'color theory',
  'spatial absence', 'digital precision', 'analog imperfection',
]

const LOCATIONS = [
  'Uyuni', 'Tokyo', 'Reykjavik', 'Berlin', 'Patagonia', 'Kyoto', 'Svalbard', 'Dubai',
  'New York', 'Lisbon', 'Seoul', 'Marrakech', 'Helsinki', 'Cape Town', 'Bangkok',
]

const EVENTS = [
  'the solstice', 'a winter storm', 'blue hour', 'the equinox', 'a summer drought',
  'a lunar eclipse', 'golden hour', 'midnight sun', 'monsoon season', 'aurora season',
]

const BADGE_TYPES: BadgeType[] = [
  'creator', 'enterprise', 'official', 'vip', 'subscriber', 'collector', 'photographer', 'curator',
]

/** Deterministic pseudo-random generator from a string seed. */
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return function random() {
    h = (h * 9301 + 49297) % 233280
    return h / 233280
  }
}

/** Pick a random item from an array using the provided rng. */
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Format a number like 1200 to 1.2k. */
function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return String(n)
}

/** Generate deterministic metadata for a gallery detail page. */
function generateGalleryMeta(id: string): GalleryMeta {
  const rng = seededRandom(id)
  const seedNum = Math.floor(rng() * 100000)

  const firstName = pick(rng, FIRST_NAMES)
  const lastName = pick(rng, LAST_NAMES)
  const name = `${firstName} ${lastName}`
  const artistId = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`

  const adjective = pick(rng, ADJECTIVES)
  const noun = pick(rng, NOUNS)
  const title = `${adjective} ${noun}`

  const series = `${adjective} ${noun}`
  const topic1 = pick(rng, TOPICS)
  const topic2 = pick(rng, TOPICS)
  const location = pick(rng, LOCATIONS)
  const event = pick(rng, EVENTS)
  const description = pick(rng, DESCRIPTION_TEMPLATES)
    .replace('{series}', series)
    .replace('{topic1}', topic1)
    .replace('{topic2}', topic2)
    .replace('{location}', location)
    .replace('{event}', event)

  const tagCount = 3 + Math.floor(rng() * 3)
  const tags = Array.from({ length: tagCount }, () => pick(rng, TAG_POOL)).filter(
    (tag, index, arr) => arr.indexOf(tag) === index
  )

  const likes = Math.floor(rng() * 48000) + 200
  const saves = Math.floor(rng() * 12000) + 50

  const relatedWorks: RelatedWork[] = Array.from({ length: 4 }, (_, i) => {
    const relAdj = pick(rng, ADJECTIVES)
    const relNoun = pick(rng, NOUNS)
    return {
      id: `${id}-related-${i}`,
      title: `${relAdj} ${relNoun}`,
      subtitle: `0${i + 1}`,
      image: `https://picsum.photos/seed/herbtable${seedNum + i + 1}/600/800`,
      alt: `${relAdj} ${relNoun} by ${name}`,
    }
  })

  return {
    id,
    title,
    description,
    image: `https://picsum.photos/seed/herbtable${seedNum}/1600/1000`,
    tags,
    likes,
    saves,
    protected: rng() > 0.3,
    artist: {
      id: artistId,
      name,
      role: pick(rng, ROLES),
      avatar: `https://picsum.photos/seed/avatar${seedNum}/200/200`,
      badge: pick(rng, BADGE_TYPES),
      verified: rng() > 0.15,
    },
    specs: {
      camera: pick(rng, CAMERAS),
      lens: pick(rng, LENSES),
      shutter: pick(rng, SHUTTERS),
      aperture: pick(rng, APERTURES),
    },
    relatedWorks,
  }
}

/** Follow button with toggle state. */
function FollowButton() {
  const [following, setFollowing] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setFollowing((v) => !v)}
      className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all uppercase tracking-widest ${
        following
          ? 'bg-surface-container-high text-on-surface border border-black/10 hover:bg-error hover:text-on-error'
          : 'bg-primary text-on-primary hover:bg-primary/80'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

/** Verification badge with tooltip and link to documentation. */
function VerificationBadge({ type }: { type: BadgeType }) {
  const [show, setShow] = useState(false)
  const c = BADGE_CONFIG[type]
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <Link
        to={`/docs#${type}`}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${c.bg} ${c.text} hover:scale-110 transition-transform`}
      >
        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {c.icon}
        </span>
      </Link>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs rounded whitespace-nowrap z-50 shadow-lg">
          {c.label}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
      )}
    </div>
  )
}

/** Gallery detail page showing a single artwork and related works. */
export default function GalleryDetailPage() {
  const { id = '1' } = useParams<{ id: string }>()
  const meta = useMemo(() => generateGalleryMeta(id), [id])

  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  })
  const imageRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPanelVisible(false)
    const timer = setTimeout(() => setPanelVisible(true), 100)
    return () => clearTimeout(timer)
  }, [id])

  const openContextMenu = useCallback((x: number, y: number) => {
    setContextMenu({ x, y, visible: true })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      openContextMenu(e.clientX, e.clientY)
    },
    [openContextMenu]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      longPressTimer.current = setTimeout(() => {
        openContextMenu(touch.clientX, touch.clientY)
      }, 600)
    },
    [openContextMenu]
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  useEffect(() => {
    const handleClick = () => closeContextMenu()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [closeContextMenu])

  const menuItems = [
    { label: 'Download', action: () => alert('Download original') },
    ...(meta.protected
      ? [{ label: 'Purchase & Download', action: () => alert('Redirect to checkout') }]
      : []),
    { label: 'Download HD Version', action: () => alert('Download HD') },
    { label: 'Download Watermark-Free', action: () => alert('Download watermark-free') },
    { label: 'Copy Image Address', action: () => navigator.clipboard.writeText(meta.image) },
  ]

  return (
    <div className="flex flex-col w-full">
      {/* Content Header: Contextual Navigation & Status */}
      <div className="px-margin-page py-6 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-gap-sm">
          <Link to="/explore" className="group flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
            <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant group-hover:text-primary">
              Back to Curation
            </span>
          </Link>
          <div className="h-4 w-px bg-black/10 mx-2" />
          <span className="font-mono-sm text-mono-sm text-on-surface-variant uppercase">
            REF: AG-{id.toUpperCase()}-X
          </span>
        </div>
        <div className="hidden md:flex items-center gap-gap-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-label-md text-label-md text-on-surface-variant">ORIGINAL RESOLUTION AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* Main Viewport Section */}
      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-160px)]">
        {/* Left Panel: Main Imagery Focus */}
        <div className="relative flex-1 bg-surface-container-low overflow-hidden group">
          <div className="absolute inset-0 flex items-center justify-center p-margin-page">
            <div
              ref={imageRef}
              className="relative w-full h-full shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.02] cursor-context-menu"
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
            >
              <img
                className="w-full h-full object-cover rounded-sm select-none"
                alt={meta.title}
                src={meta.image}
                draggable={false}
              />
              {/* Image Metadata Overlay */}
              <div className="absolute bottom-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-2">
                  <span className="bg-primary/90 backdrop-blur-md text-on-primary font-mono-sm text-[10px] px-2 py-1 uppercase tracking-tighter">
                    RAW
                  </span>
                  <span className="bg-primary/90 backdrop-blur-md text-on-primary font-mono-sm text-[10px] px-2 py-1 uppercase tracking-tighter">
                    P3 COLOR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Controls - removed magnifier, kept fullscreen only */}
          <div className="absolute top-margin-page right-margin-page flex flex-col gap-2">
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center hover:bg-primary/80 transition-all"
              title="Fullscreen"
            >
              <span className="material-symbols-outlined text-[20px]">fullscreen</span>
            </button>
          </div>
        </div>

        {/* Right Side Panel: Glassy UI */}
        <div
          className={`w-full lg:w-[420px] bg-surface-bright border-l border-black/5 flex flex-col transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            panelVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
          }`}
        >
          {/* Artist Profile Section */}
          <div className="p-8 border-b border-black/5 bg-surface-container-lowest/50">
            <div className="flex items-center justify-between mb-8">
              <Link to={`/profile/${meta.artist.id}`} className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <img className="w-full h-full object-cover" alt={meta.artist.name} src={meta.artist.avatar} />
                  </div>
                  {meta.artist.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-surface-bright">
                      <span className="material-symbols-outlined text-on-primary text-[10px]">verified</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-lg text-[20px] tracking-tight text-primary group-hover:underline underline-offset-4">
                      {meta.artist.name}
                    </span>
                    <VerificationBadge type={meta.artist.badge} />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                    {meta.artist.role}
                  </span>
                </div>
              </Link>
              <FollowButton />
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-[32px] leading-tight text-primary">{meta.title}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{meta.description}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {meta.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/explore?tag=${encodeURIComponent(tag)}`}
                  className="bg-surface-container-high px-3 py-1.5 font-mono-sm text-mono-sm text-primary rounded-full hover:bg-primary hover:text-on-primary transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Interaction & Metrics */}
          <div className="p-8 space-y-8 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLiked(!liked)}
                className={`flex items-center justify-center gap-3 py-4 transition-all group ${
                  liked ? 'bg-error text-on-error' : 'bg-surface-container-low hover:bg-primary hover:text-on-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                <span className="font-label-md text-label-md uppercase tracking-widest">
                  {formatCount(meta.likes)} Likes
                </span>
              </button>
              <button
                onClick={() => setSaved(!saved)}
                className={`flex items-center justify-center gap-3 py-4 transition-all group ${
                  saved ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-primary hover:text-on-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
                >
                  bookmark
                </span>
                <span className="font-label-md text-label-md uppercase tracking-widest">Save</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  Technical Specifications
                </span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">info</span>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <div className="flex flex-col">
                  <span className="font-label-md text-[10px] text-on-surface-variant/60 uppercase">Camera</span>
                  <span className="font-mono-sm text-mono-sm">{meta.specs.camera}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-[10px] text-on-surface-variant/60 uppercase">Lens</span>
                  <span className="font-mono-sm text-mono-sm">{meta.specs.lens}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-[10px] text-on-surface-variant/60 uppercase">Shutter</span>
                  <span className="font-mono-sm text-mono-sm">{meta.specs.shutter}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-[10px] text-on-surface-variant/60 uppercase">Aperture</span>
                  <span className="font-mono-sm text-mono-sm">{meta.specs.aperture}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-primary text-on-primary">
            <button className="w-full flex items-center justify-between group">
              <span className="font-label-md text-label-md uppercase tracking-[0.2em]">Acquire Limited Edition</span>
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Posts: High-Density Grid */}
      <div className="px-margin-page py-16 bg-surface-container-lowest">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="font-label-md text-label-md text-primary/40 uppercase tracking-[0.3em] block mb-2">
              Discovery
            </span>
            <h2 className="font-display text-headline-lg text-primary uppercase">His Previous Works</h2>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-px bg-primary/20 self-center" />
            <Link
              to="/explore"
              className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-50"
            >
              View Gallery
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {meta.relatedWorks.map((work) => (
            <Link
              key={work.id}
              to={`/gallery/${work.id}`}
              className="group relative aspect-[3/4] overflow-hidden bg-surface-container-high cursor-pointer"
            >
              <img
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt={work.alt}
                src={work.image}
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors" />
              <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-surface-bright/90 backdrop-blur-md">
                <span className="font-mono-sm text-[10px] text-primary uppercase">
                  {work.subtitle} / {work.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Interaction Bar (Mobile Context) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-bright/80 backdrop-blur-2xl border border-black/5 px-6 py-3 rounded-full flex items-center gap-8 shadow-xl lg:hidden z-50">
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span className="font-label-md text-label-md">{formatCount(meta.likes)}</span>
        </button>
        <button className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
          <span className="font-label-md text-label-md">{formatCount(Math.floor(meta.likes * 0.04))}</span>
        </button>
        <button className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[100] bg-surface-bright border border-black/10 shadow-2xl rounded-lg py-2 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.action()
                closeContextMenu()
              }}
              className="w-full text-left px-4 py-2.5 font-body-md text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img
            className="max-w-full max-h-full object-contain p-4"
            alt="Fullscreen artwork"
            src={meta.image}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
