import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { t, toggleLang } from '../i18n'

type TabKey = 'works' | 'liked' | 'collections' | 'cardpack' | 'settings' | 'basic' | 'support'

interface WorkItem {
  id: string
  src: string
  alt: string
  title: string
}

interface CardItem {
  id: string
  name: string
  bgSeed: number
  serial: string
}

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

/** CSS-only animated card background mimicking ReactBits dynamic effects. */
function CardBackground({ seed, index }: { seed: number; index: number }) {
  const hue = (seed * 137) % 360
  const variant = index % 9

  const base = 'absolute inset-0'

  if (variant === 0) {
    // Chroma waves
    return (
      <div
        className={`${base} animate-pulse`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 80%, 50%), hsl(${(hue + 120) % 360}, 80%, 40%), hsl(${(hue + 240) % 360}, 80%, 50%))`,
          backgroundSize: '200% 200%',
          animation: 'gradientFlow 8s ease infinite',
        }}
      />
    )
  }
  if (variant === 1) {
    // Liquid bars
    return (
      <div className={`${base} overflow-hidden bg-black`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[12%] rounded-full opacity-60"
            style={{
              left: `${i * 18}%`,
              background: `linear-gradient(180deg, hsl(${hue}, 70%, 50%), transparent)`,
              transform: `scaleY(${0.4 + (i % 3) * 0.3})`,
              animation: `barWave 3s ease-in-out ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>
    )
  }
  if (variant === 2) {
    // Metallic swirl
    return (
      <div
        className={base}
        style={{
          background: `radial-gradient(circle at 30% 30%, hsl(${hue}, 20%, 80%), hsl(${hue}, 30%, 20%) 60%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `conic-gradient(from 0deg, hsl(${hue}, 60%, 60%), hsl(${(hue + 180) % 360}, 60%, 50%), hsl(${hue}, 60%, 60%))`,
            animation: 'spin 12s linear infinite',
          }}
        />
      </div>
    )
  }
  if (variant === 3) {
    // Lightspeed
    return (
      <div className={`${base} bg-black overflow-hidden`}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-white/60"
            style={{
              top: `${Math.random() * 100}%`,
              left: 0,
              right: 0,
              transform: `translateX(-100%)`,
              animation: `lightSpeed ${1 + Math.random()}s linear ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>
    )
  }
  if (variant === 4) {
    // Gradient bars
    return (
      <div className={`${base} flex`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              background: `linear-gradient(180deg, hsl(${(hue + i * 30) % 360}, 70%, 50%), hsl(${(hue + i * 30 + 40) % 360}, 70%, 30%))`,
            }}
          />
        ))}
      </div>
    )
  }
  if (variant === 5) {
    // Glass flow
    return (
      <div
        className={base}
        style={{
          background: `linear-gradient(135deg, hsla(${hue}, 60%, 70%, 0.6), hsla(${(hue + 90) % 360}, 60%, 60%, 0.4))`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at 50% 50%, hsla(${hue}, 80%, 80%, 0.8), transparent 70%)`,
            animation: 'pulse 6s ease-in-out infinite',
          }}
        />
      </div>
    )
  }
  if (variant === 6) {
    // Gradient blinds
    return (
      <div className={`${base} overflow-hidden`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${i * 9}%`,
              width: '9%',
              background: `linear-gradient(180deg, hsla(${(hue + i * 20) % 360}, 70%, 50%, 0.8), hsla(${(hue + i * 20 + 60) % 360}, 70%, 40%, 0.4))`,
              animation: `blindShift 4s ease-in-out ${i * 0.15}s infinite alternate`,
            }}
          />
        ))}
      </div>
    )
  }
  if (variant === 7) {
    // Lightning
    return (
      <div className={`${base} bg-slate-900 overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at 50% 0%, hsl(${hue}, 80%, 70%), transparent 60%)`,
            animation: 'flash 2.5s ease-in-out infinite',
          }}
        />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-white/80"
            style={{
              left: `${20 + i * 20}%`,
              transform: 'skewX(-20deg)',
              animation: `flash ${1.5 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>
    )
  }
  // Vortex
  return (
    <div className={`${base} overflow-hidden bg-black`}>
      <div
        className="absolute inset-[-50%] rounded-full opacity-80"
        style={{
          background: `conic-gradient(from 0deg, hsl(${hue}, 80%, 50%), black, hsl(${(hue + 180) % 360}, 80%, 40%), black, hsl(${hue}, 80%, 50%))`,
          animation: 'spin 10s linear infinite',
        }}
      />
      <div
        className="absolute inset-[20%] rounded-full bg-black/70"
        style={{
          boxShadow: `inset 0 0 60px hsla(${hue}, 80%, 50%, 0.5)`,
        }}
      />
    </div>
  )
}

const CARD_NAMES = [
  'Obsidian Pass', 'Aurora Membership', 'Platinum Vision', 'Core Access',
  'Genesis Token', 'Catalyst Key', 'Nebula Pass', 'Prism Card',
  'Quantum Tier', 'Horizon Elite', 'Zenith Pass', 'Lumina Key',
]

/** Generate deterministic profile data for any user id. */
function generateProfile(id: string) {
  const rng = seededRandom(id)
  const seedNum = Math.floor(rng() * 100000)

  const firstName = pick(rng, FIRST_NAMES)
  const lastName = pick(rng, LAST_NAMES)
  const displayName = `${firstName} ${lastName}`
  const role = pick(rng, ROLES)

  const followers = Math.floor(rng() * 48000) + 200
  const likesReceived = Math.floor(rng() * 120000) + 1000

  const workCount = 12 + Math.floor(rng() * 12)
  const works: WorkItem[] = Array.from({ length: workCount }, (_, i) => ({
    id: `${id}-work-${i}`,
    src: `https://picsum.photos/seed/${id}work${i}/600/600`,
    alt: `Work ${i + 1} by ${displayName}`,
    title: `${pick(rng, ['Silent', 'Mercury', 'Fluid', 'Brutalist', 'Beacon'])} ${pick(rng, ['Monolith', 'Dunes', 'Void', 'Volume', 'Frame'])}`,
  }))

  const likedCount = rng() > 0.3 ? Math.floor(rng() * 20) + 4 : 0
  const liked: WorkItem[] = Array.from({ length: likedCount }, (_, i) => ({
    id: `${id}-liked-${i}`,
    src: `https://picsum.photos/seed/${id}liked${i}/600/600`,
    alt: `Liked item ${i + 1}`,
    title: `Liked Work ${i + 1}`,
  }))

  const collectionCount = rng() > 0.4 ? Math.floor(rng() * 16) + 4 : 0
  const collections: WorkItem[] = Array.from({ length: collectionCount }, (_, i) => ({
    id: `${id}-col-${i}`,
    src: `https://picsum.photos/seed/${id}col${i}/600/600`,
    alt: `Collection item ${i + 1}`,
    title: `Collection ${i + 1}`,
  }))

  const cardCount = Math.floor(rng() * 6) + 3
  const cardPack: CardItem[] = Array.from({ length: cardCount }, (_, i) => ({
    id: `${id}-card-${i}`,
    name: `${pick(rng, CARD_NAMES)} ${String.fromCharCode(65 + i)}`,
    bgSeed: seedNum + i + 1,
    serial: `HT-${String(seedNum).padStart(5, '0')}-${String(i + 1).padStart(2, '0')}`,
  }))

  return {
    id,
    displayName,
    role,
    avatar: `https://picsum.photos/seed/${id}avatar/400/400`,
    followers,
    likesReceived,
    works,
    liked,
    collections,
    cardPack,
  }
}

/** User profile page with works, liked items, collections, cards, and settings. */
export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const profileId = id || 'me'
  const profile = useMemo(() => generateProfile(profileId), [profileId])

  const [activeTab, setActiveTab] = useState<TabKey>('works')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'works', label: t('profile.tabs.works'), count: profile.works.length },
    ...(profile.collections.length > 0 ? [{ key: 'collections' as TabKey, label: t('profile.tabs.collections'), count: profile.collections.length }] : []),
    ...(profile.liked.length > 0 ? [{ key: 'liked' as TabKey, label: t('profile.tabs.liked'), count: profile.liked.length }] : []),
    { key: 'cardpack', label: t('profile.tabs.cardPack'), count: profile.cardPack.length },
    { key: 'settings', label: t('profile.tabs.settings') },
  ]

  useEffect(() => {
    setActiveTab('works')
    setSearchQuery('')
  }, [profileId])

  const filteredWorks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return profile.works
    return profile.works.filter((w) => w.title.toLowerCase().includes(q) || w.alt.toLowerCase().includes(q))
  }, [profile.works, searchQuery])

  return (
    <div className="flex flex-col w-full">
      {/* Profile Header & Stats */}
      <section className="relative w-full px-12 py-gap-lg border-b border-black/5 bg-surface-bright">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-gap-lg">
          <Link to={`/profile/${profileId}`} className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl ring-4 ring-surface-bright">
              <img className="w-full h-full object-cover" alt={profile.displayName} src={profile.avatar} />
            </div>
          </Link>
          <div className="flex-1 pb-2">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.2em]">{profile.role}</span>
              <h1 className="font-display text-display text-primary">{profile.displayName}</h1>
              <p className="font-body-md text-body-md text-secondary max-w-xl">
                {t('profile.bioPlaceholder')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-gap-md pb-4">
            <button
              type="button"
              onClick={() => setIsFollowing((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-label-md text-label-md uppercase tracking-wider transition-all ${
                isFollowing
                  ? 'border border-primary bg-surface-bright text-primary hover:bg-surface-container'
                  : 'bg-primary text-on-primary hover:opacity-85'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{isFollowing ? 'check' : 'person_add'}</span>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <div className="flex flex-col items-start">
              <span className="font-display text-headline-lg text-primary">{formatCount(profile.followers)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.followers')}</span>
            </div>
            <div className="w-px h-12 bg-black/10" />
            <div className="flex flex-col items-start">
              <span className="font-display text-headline-lg text-primary">{formatCount(profile.likesReceived)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.likesReceived')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigation Tabs */}
      <div className="sticky top-20 z-40 bg-surface-bright/80 backdrop-blur-xl border-b border-black/5 px-12">
        <div className="max-w-6xl mx-auto flex gap-gap-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-6 font-label-md text-label-md uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-1.5 text-[11px] text-on-surface-variant/60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto w-full px-12 py-gap-lg pb-32">
        {/* Works */}
        {activeTab === 'works' && (
          <div className="flex flex-col gap-gap-md">
            {/* Search */}
            <div className="flex items-center gap-3 bg-surface-container px-4 py-3 rounded-xl border border-black/5 focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('profile.searchPlaceholder')}
                className="flex-1 bg-transparent outline-none font-body-md text-on-surface placeholder:text-on-surface-variant/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gap-md">
              {filteredWorks.map((img) => (
                <Link
                  key={img.id}
                  to={`/gallery/${img.id}`}
                  className="group relative aspect-square bg-surface-container overflow-hidden rounded-lg"
                >
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={img.alt}
                    src={img.src}
                  />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-gap-sm">
                    <span className="material-symbols-outlined text-on-primary">favorite</span>
                    <span className="material-symbols-outlined text-on-primary">visibility</span>
                  </div>
                </Link>
              ))}
            </div>
            {filteredWorks.length === 0 && (
              <div className="text-center py-20">
                <p className="font-headline-lg text-headline-lg text-on-surface-variant">{t('profile.noWorks')}</p>
              </div>
            )}
          </div>
        )}

        {/* Liked */}
        {activeTab === 'liked' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gap-md">
            {profile.liked.map((img) => (
              <Link
                key={img.id}
                to={`/gallery/${img.id}`}
                className="group relative aspect-square bg-surface-container overflow-hidden rounded-lg"
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={img.alt}
                  src={img.src}
                />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-gap-sm">
                  <span className="material-symbols-outlined text-on-primary">favorite</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Collections */}
        {activeTab === 'collections' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gap-md">
            {profile.collections.map((img) => (
              <Link
                key={img.id}
                to={`/gallery/${img.id}`}
                className="group relative aspect-square bg-surface-container overflow-hidden rounded-lg"
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={img.alt}
                  src={img.src}
                />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-gap-sm">
                  <span className="material-symbols-outlined text-on-primary">collections_bookmark</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Card Pack */}
        {activeTab === 'cardpack' && (
          <div className="flex flex-col gap-gap-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gap-md">
              {profile.cardPack.map((card, index) => (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => setFlippedCardId((current) => (current === card.id ? null : card.id))}
                  aria-pressed={flippedCardId === card.id}
                  aria-label={`Flip ${card.name}`}
                  className="group relative aspect-[1.586/1] cursor-pointer rounded-xl text-left [perspective:1200px]"
                >
                  <div
                    className="relative h-full w-full rounded-xl shadow-lg transition-transform duration-700 [transform-style:preserve-3d]"
                    style={{ transform: flippedCardId === card.id ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-xl [backface-visibility:hidden]">
                      <CardBackground seed={card.bgSeed} index={index} />
                      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30" />
                      <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                        <div className="flex items-start justify-between">
                          <span className="font-mono-sm text-[10px] uppercase tracking-widest opacity-70">HerbTable Card</span>
                          <span className="material-symbols-outlined text-[20px] opacity-70">credit_card</span>
                        </div>
                        <div>
                          <h3 className="font-headline-lg text-headline-lg-mobile mb-1">{card.name}</h3>
                          <span className="font-mono-sm text-[11px] uppercase tracking-wider opacity-60">{profile.displayName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex rotate-y-180 flex-col justify-between rounded-xl bg-primary p-6 text-on-primary [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
                      <div className="flex items-center justify-between border-b border-white/30 pb-3">
                        <span className="font-mono-sm text-[10px] uppercase tracking-widest">HerbTable · Verified</span>
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-mono-sm text-[10px] uppercase tracking-widest opacity-70">Card number</p>
                        <p className="font-display text-2xl tracking-[0.16em]">{card.serial}</p>
                        <p className="font-mono-sm text-[11px] uppercase tracking-wider opacity-75">Holder · {profile.displayName}</p>
                      </div>
                      <p className="font-mono-sm text-[9px] uppercase tracking-[0.18em] opacity-60">Tap to return to front</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-gap-lg max-w-3xl">
            <div className="flex flex-col gap-gap-sm">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('profile.profileConfiguration')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gap-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.displayName')}</label>
                  <input className="bg-surface-container p-4 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary transition-all" type="text" defaultValue={profile.displayName} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.emailAddress')}</label>
                  <input className="bg-surface-container p-4 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary transition-all" type="email" defaultValue="user@herbtable.com" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.biography')}</label>
                  <textarea
                    className="bg-surface-container p-4 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    rows={4}
                    defaultValue=""
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-gap-sm">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('profile.security')}</h2>
              <div className="bg-surface-container p-gap-md rounded-xl flex flex-col gap-gap-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-body-lg text-body-lg text-primary">{t('profile.password')}</p>
                    <p className="font-body-md text-secondary text-sm">{t('profile.passwordLastChanged')}</p>
                  </div>
                  <button className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-full uppercase tracking-wider hover:opacity-80 transition-opacity">{t('profile.update')}</button>
                </div>
                <div className="h-px bg-black/5 w-full" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-body-lg text-body-lg text-primary">{t('profile.twoFactorAuthentication')}</p>
                    <p className="font-body-md text-secondary text-sm">{t('profile.twoFactorStatus')}</p>
                  </div>
                  <button className="px-6 py-2 border border-black text-primary font-label-md text-label-md rounded-full uppercase tracking-wider hover:bg-black hover:text-white transition-all">{t('profile.manage')}</button>
                </div>
              </div>
            </div>
            <button className="w-fit px-12 py-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-transform">{t('profile.saveChanges')}</button>
          </div>
        )}

        {/* Basic Settings */}
        {activeTab === 'basic' && (
          <div className="flex flex-col gap-gap-lg max-w-3xl">
            <div className="flex flex-col gap-gap-sm">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('profile.basicSettings')}</h2>
              <div className="bg-surface-container p-gap-md rounded-xl flex flex-col gap-gap-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-body-lg text-body-lg text-primary">{t('profile.language')}</p>
                    <p className="font-body-md text-secondary text-sm">{t('profile.currentLanguage')}</p>
                  </div>
                  <button
                    onClick={toggleLang}
                    className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-full uppercase tracking-wider hover:opacity-80 transition-opacity"
                  >
                    {t('profile.switchLanguage')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gap-lg">
            <div className="md:col-span-4 flex flex-col gap-gap-md">
              <div className="bg-surface-container p-gap-md rounded-xl">
                <h3 className="font-headline-lg text-headline-lg text-primary mb-2">{t('profile.directChannel')}</h3>
                <p className="font-body-md text-secondary mb-6">{t('profile.directChannelDescription')}</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-4 bg-surface-bright rounded-lg border border-black/5">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    <div>
                      <p className="font-label-md text-label-md text-primary">{t('profile.avgResponseTime')}</p>
                      <p className="text-sm text-secondary">{t('profile.under2Hours')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-surface-bright rounded-lg border border-black/5">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div>
                      <p className="font-label-md text-label-md text-primary">{t('profile.encryption')}</p>
                      <p className="text-sm text-secondary">{t('profile.endToEnd256')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-8">
              <div className="bg-surface-container-low rounded-xl p-gap-md flex flex-col gap-gap-md border border-black/5 shadow-sm">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.inquiryType')}</label>
                  <select className="bg-surface-bright p-4 rounded-lg font-body-md border-b-2 border-primary focus:outline-none appearance-none cursor-pointer">
                    <option>Curation &amp; Exhibition</option>
                    <option>Technical Issue</option>
                    <option>Account Verification</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">{t('profile.messageBody')}</label>
                  <textarea
                    className="bg-surface-bright p-4 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Describe your inquiry in detail..."
                    rows={8}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex-1 py-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg uppercase tracking-[0.2em] hover:opacity-90 transition-opacity">{t('profile.sendTransmission')}</button>
                  <button className="p-4 bg-surface-bright text-primary rounded-lg border border-black/10 hover:bg-black hover:text-white transition-all">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
