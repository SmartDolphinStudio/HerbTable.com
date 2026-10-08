import { useEffect, useState } from 'react'

interface CertificationLevel {
  key: string
  label: string
  labelEn: string
  icon: string
  color: string
  bg: string
  description: string
}

const CERTIFICATION_LEVELS: CertificationLevel[] = [
  {
    key: 'official',
    label: '官方认证',
    labelEn: 'Official',
    icon: 'verified',
    color: 'text-purple-600',
    bg: 'bg-purple-600',
    description: 'Platform-verified official accounts representing HerbTable or its strategic partners.',
  },
  {
    key: 'enterprise',
    label: '企业认证',
    labelEn: 'Enterprise',
    icon: 'corporate_fare',
    color: 'text-blue-600',
    bg: 'bg-blue-600',
    description: 'Verified business and organization accounts with team-wide licensing rights.',
  },
  {
    key: 'subscriber',
    label: '订阅用户',
    labelEn: 'Subscriber',
    icon: 'subscriptions',
    color: 'text-green-600',
    bg: 'bg-green-600',
    description: 'Active paid subscribers with premium access and extended download quotas.',
  },
  {
    key: 'enterprise-subscriber',
    label: '企业订阅',
    labelEn: 'Enterprise Subscriber',
    icon: 'business_center',
    color: 'text-teal-600',
    bg: 'bg-teal-600',
    description: 'Organizations on an active enterprise subscription plan with pooled resources.',
  },
  {
    key: 'creator',
    label: '创作者认证',
    labelEn: 'Creator',
    icon: 'palette',
    color: 'text-black',
    bg: 'bg-black',
    description: 'Verified content creators who publish original works on the platform.',
  },
  {
    key: 'authorizer',
    label: '授权者认证',
    labelEn: 'Authorizer',
    icon: 'verified_user',
    color: 'text-orange-500',
    bg: 'bg-orange-500',
    description: 'Rights holders authorized to license and distribute protected content.',
  },
  {
    key: 'collector',
    label: '收藏家认证',
    labelEn: 'Collector',
    icon: 'collections_bookmark',
    color: 'text-pink-600',
    bg: 'bg-pink-600',
    description: 'Verified collectors with notable acquisition history and curation influence.',
  },
  {
    key: 'photographer',
    label: '摄影师认证',
    labelEn: 'Photographer',
    icon: 'photo_camera',
    color: 'text-red-600',
    bg: 'bg-red-600',
    description: 'Professional photographers whose portfolio meets technical quality standards.',
  },
  {
    key: 'curator',
    label: '策展人认证',
    labelEn: 'Curator',
    icon: 'museum',
    color: 'text-indigo-600',
    bg: 'bg-indigo-600',
    description: 'Senior curators recognized for editorial judgment and exhibition history.',
  },
]

/** Documentation page listing certification levels and badges. */
export default function DocsPage() {
  const [activeKey, setActiveKey] = useState<string>(CERTIFICATION_LEVELS[0].key)
  const active = CERTIFICATION_LEVELS.find((c) => c.key === activeKey) || CERTIFICATION_LEVELS[0]

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash && CERTIFICATION_LEVELS.some((c) => c.key === hash)) {
      setActiveKey(hash)
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex">
      {/* Left Directory Sidebar */}
      <aside className="hidden lg:flex w-[280px] h-screen sticky top-0 flex-col border-r border-black/10 bg-white/80 backdrop-blur-xl">
        <div className="p-6 border-b border-black/10 flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            Directory
          </span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">unfold_more</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="px-2 py-1.5 flex items-center gap-2 text-on-surface-variant font-label-md text-label-md uppercase mb-2">
            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
            Getting Started
          </div>
          <nav className="space-y-1">
            {CERTIFICATION_LEVELS.map((level) => (
              <button
                key={level.key}
                type="button"
                onClick={() => setActiveKey(level.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeKey === level.key
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg ${activeKey === level.key ? 'bg-white/20' : level.bg} flex items-center justify-center`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      activeKey === level.key ? 'text-white' : 'text-white'
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {level.icon}
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="font-body-md text-[14px]">{level.label}</span>
                  <span className={`font-mono-sm text-[10px] ${activeKey === level.key ? 'text-white/70' : 'text-on-surface-variant'}`}>
                    {level.labelEn}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-black/5 px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono-sm text-mono-sm px-3 py-1 bg-surface-container rounded-full text-on-surface-variant border-[0.5px] border-outline-variant">
                DOC-ID: HT-09
              </span>
              <span className="font-mono-sm text-mono-sm px-3 py-1 bg-surface-container rounded-full text-on-surface-variant border-[0.5px] border-outline-variant">
                VER: 1.0.0
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-magenta animate-pulse" />
              <span className="font-mono-sm text-mono-sm text-on-primary uppercase tracking-widest">Status: Final</span>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-8 py-12">
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono-sm text-mono-sm text-accent-indigo opacity-50">01 //</span>
              <h1 className="font-display text-display text-on-surface">Certification Levels</h1>
            </div>
            <p className="font-body-lg text-body-lg text-secondary max-w-3xl leading-relaxed">
              HerbTable uses a tiered verification system to help users identify trusted creators, organizations,
              rights holders, and curators. Each badge indicates a specific role and set of privileges on the platform.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CERTIFICATION_LEVELS.map((level) => (
              <div
                id={level.key}
                key={level.key}
                className={`p-6 rounded-xl border border-black/10 bg-white transition-all hover:shadow-lg ${
                  activeKey === level.key ? 'ring-1 ring-primary' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${level.bg} flex items-center justify-center shrink-0`}>
                    <span
                      className="material-symbols-outlined text-white text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {level.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-lg text-headline-lg-mobile text-primary mb-1">
                      {level.label}
                    </h3>
                    <span className="font-mono-sm text-mono-sm text-on-surface-variant uppercase tracking-widest">
                      {level.labelEn}
                    </span>
                    <p className="font-body-md text-body-md text-secondary mt-3 leading-relaxed">
                      {level.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-16 p-8 bg-white/80 backdrop-blur-xl rounded-xl border border-black/10">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Selected: {active.label}</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl ${active.bg} flex items-center justify-center`}>
                <span
                  className="material-symbols-outlined text-white text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {active.icon}
                </span>
              </div>
              <div>
                <h3 className="font-headline-lg text-headline-lg-mobile text-primary">{active.labelEn}</h3>
                <span className={`font-mono-sm text-mono-sm ${active.color} uppercase tracking-widest`}>
                  {active.label}
                </span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-secondary leading-relaxed">{active.description}</p>
          </section>
        </div>
      </main>
    </div>
  )
}
