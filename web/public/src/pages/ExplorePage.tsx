import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { t } from '../i18n'

interface GalleryItem {
  id: string
  category: string
  title: string
  subtitle: string
  artist: string
  tags: string[]
  image: string
  alt: string
  span: string
  aspect: string
  overlay: 'gradient' | 'info' | 'minimal' | 'full'
  likes: number
  saves: number
  enterpriseLicensed: boolean
  premiumTier: boolean
}

const categories = [
  { key: 'all', label: t('explore.categories.all') },
  { key: 'photography', label: t('explore.categories.photography') },
  { key: 'digital-art', label: t('explore.categories.digitalArt') },
  { key: 'minimalist', label: t('explore.categories.minimalist') },
  { key: 'portraits', label: t('explore.categories.portraits') },
  { key: 'architecture', label: 'ARCHITECTURE' },
  { key: 'nature', label: 'NATURE' },
]

const tagPool = [
  'RAW', '4K', 'MINIMAL', 'ARCHITECTURE', 'PORTRAIT', 'NATURE', 'ABSTRACT',
  'STUDIO', 'LANDSCAPE', 'URBAN', 'MONOCHROME', 'VIBRANT', 'CINEMATIC',
  'MOODY', 'AERIAL', 'MACRO', 'FASHION', 'CONCEPTUAL', 'GEOMETRIC', 'LIGHT',
]

const titleWords = [
  'Silent', 'Mercury', 'Fluid', 'Brutalist', 'Beacon', 'Less', 'Desert', 'Spiral',
  'Vein', 'Horizon', 'Neon', 'Eclipse', 'Crystal', 'Velvet', 'Concrete', 'Aurora',
  'Drift', 'Pulse', 'Vapor', 'Iron', 'Salt', 'Echo', 'Prism', 'Nocturne', 'Flux',
  'Obsidian', 'Lumen', 'Solstice', 'Tide', 'Rift', 'Axiom', 'Cypher', 'Halo',
]

const artistNames = [
  'Elias Vansk', '@lucia_frame', 'Marcus Aurelius', 'Elena Voss', 'Julian Vane',
  'Noah Pierce', 'Sofia Chen', 'Kai Mori', 'Ava Reed', 'Leo Dupont',
  'Mira Kowalski', 'Omar Farooq', 'Yuki Tanaka', 'Ingrid Berg', 'Dante Rossi',
]

const overlays: Array<'gradient' | 'info' | 'minimal' | 'full'> = ['gradient', 'info', 'minimal', 'full']

function generateGalleryItems(): GalleryItem[] {
  return Array.from({ length: 120 }, (_, i) => {
    const seed = i + 1
    const widths = [800, 1200, 1600, 600, 1000, 1400]
    const heights = [600, 800, 1000, 900, 1200, 700]
    const w = widths[i % widths.length]
    const h = heights[(i + 2) % heights.length]

    const categoryMap: Record<number, string> = {
      0: 'photography',
      1: 'digital-art',
      2: 'minimalist',
      3: 'portraits',
      4: 'architecture',
      5: 'nature',
      6: 'photography',
    }
    const category = categoryMap[i % 7] || 'photography'

    const title = `${titleWords[i % titleWords.length]} ${titleWords[(i * 3 + 7) % titleWords.length]}`
    const subtitle = ['RAW / 8K', 'STUDIO SERIES', 'Digital Sculptor', 'BERLIN, 2024', 'COLLECTION: STORMS', ''][i % 6]
    const artist = artistNames[i % artistNames.length]
    const tags = [
      tagPool[i % tagPool.length],
      tagPool[(i + 5) % tagPool.length],
      tagPool[(i + 11) % tagPool.length],
    ]

    const spans = [
      'md:col-span-4',
      'md:col-span-4 md:row-span-2',
      'md:col-span-8',
      'md:col-span-4',
      'md:col-span-4',
      'md:col-span-4',
    ]
    const aspects = [
      'aspect-[3/4]',
      '',
      'aspect-[16/9]',
      'aspect-square',
      'aspect-[4/3]',
      'aspect-video',
    ]

    return {
      id: String(seed),
      category,
      title: title.toUpperCase(),
      subtitle,
      artist,
      tags,
      image: `https://picsum.photos/seed/herbtable${seed}/${w}/${h}`,
      alt: `${title} by ${artist}`,
      span: spans[i % spans.length],
      aspect: aspects[i % aspects.length],
      overlay: overlays[i % overlays.length],
      likes: Math.floor(Math.random() * 5000) + 100,
      saves: Math.floor(Math.random() * 2000) + 50,
      enterpriseLicensed: i % 3 === 0,
      premiumTier: i % 5 === 0,
    }
  })
}

const galleryItems = generateGalleryItems()

/** Explore page with category filter, view modes, search, sort, and refine drawer */
export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTag = searchParams.get('tag') || ''
  const urlSearch = searchParams.get('search') || ''

  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [sortBy, setSortBy] = useState<'all' | 'popularity' | 'likes' | 'saves'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    tags: [] as string[],
    author: '',
    minLikes: '',
    maxLikes: '',
    minSaves: '',
    maxSaves: '',
    enterpriseOnly: false,
    premiumOnly: false,
  })

  useEffect(() => {
    if (urlTag) {
      setFilters((prev) => ({ ...prev, tags: [urlTag] }))
    }
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [urlTag, urlSearch])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    galleryItems.forEach((item) => item.tags.forEach((tag) => set.add(tag)))
    return Array.from(set).sort()
  }, [])

  const filteredItems = useMemo(() => {
    let result = [...galleryItems]

    if (activeCategory !== 'all') {
      result = result.filter((item) => item.category === activeCategory)
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.artist.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (filters.tags.length > 0) {
      result = result.filter((item) => filters.tags.some((tag) => item.tags.includes(tag)))
    }

    if (filters.author.trim()) {
      result = result.filter((item) => item.artist.toLowerCase().includes(filters.author.toLowerCase()))
    }

    const minLikes = filters.minLikes ? Number(filters.minLikes) : NaN
    const maxLikes = filters.maxLikes ? Number(filters.maxLikes) : NaN
    if (!isNaN(minLikes)) result = result.filter((item) => item.likes >= minLikes)
    if (!isNaN(maxLikes)) result = result.filter((item) => item.likes <= maxLikes)

    const minSaves = filters.minSaves ? Number(filters.minSaves) : NaN
    const maxSaves = filters.maxSaves ? Number(filters.maxSaves) : NaN
    if (!isNaN(minSaves)) result = result.filter((item) => item.saves >= minSaves)
    if (!isNaN(maxSaves)) result = result.filter((item) => item.saves <= maxSaves)

    if (filters.enterpriseOnly) result = result.filter((item) => item.enterpriseLicensed)
    if (filters.premiumOnly) result = result.filter((item) => item.premiumTier)

    if (sortBy === 'popularity') {
      result.sort((a, b) => b.likes + b.saves - (a.likes + a.saves))
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes)
    } else if (sortBy === 'saves') {
      result.sort((a, b) => b.saves - a.saves)
    }

    return result
  }, [activeCategory, searchQuery, sortBy, filters])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      next.set('search', searchQuery.trim())
    } else {
      next.delete('search')
    }
    setSearchParams(next)
  }

  const toggleTagFilter = (tag: string) => {
    setFilters((prev) => {
      const exists = prev.tags.includes(tag)
      const nextTags = exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
      return { ...prev, tags: nextTags }
    })
  }

  const applyFilters = () => {
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setFilters({ tags: [], author: '', minLikes: '', maxLikes: '', minSaves: '', maxSaves: '', enterpriseOnly: false, premiumOnly: false })
    setSortBy('all')
    const next = new URLSearchParams(searchParams)
    next.delete('tag')
    setSearchParams(next)
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-32">
      {/* Sticky Filter Nav */}
      <div className="sticky top-20 z-40 bg-surface-bright/80 backdrop-blur-2xl border-b border-black/5">
        <div className="max-w-container-max mx-auto px-margin-page py-4 flex items-center gap-4 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 font-label-md text-label-md transition-colors whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant/60 hover:text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Bar */}
      {(filters.tags.length > 0 || filters.author || filters.minLikes || filters.maxLikes || filters.minSaves || filters.maxSaves || filters.enterpriseOnly || filters.premiumOnly || searchQuery || sortBy !== 'all') && (
        <div className="max-w-container-max mx-auto px-margin-page pt-4 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-sm text-mono-sm text-on-surface-variant">active:</span>
            {sortBy !== 'all' && (
              <span className="px-3 py-1 bg-surface-container-high text-primary font-mono-sm text-[11px] rounded-full">
                sort: {sortBy}
              </span>
            )}
            {filters.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className="px-3 py-1 bg-primary text-on-primary font-mono-sm text-[11px] rounded-full flex items-center gap-1"
              >
                #{tag.toLowerCase()} <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            ))}
            {filters.author && (
              <span className="px-3 py-1 bg-surface-container-high text-primary font-mono-sm text-[11px] rounded-full">
                author: {filters.author}
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-surface-container-high text-primary font-mono-sm text-[11px] rounded-full">
                search: {searchQuery}
              </span>
            )}
            <button onClick={clearFilters} className="font-label-md text-label-md text-error hover:underline">
              clear all
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid / List */}
      <div className="max-w-container-max mx-auto px-margin-page py-gap-lg w-full">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gap-md">
            {filteredItems.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-gap-md">
            {filteredItems.map((item) => (
              <ListCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="font-headline-lg text-headline-lg text-on-surface-variant">No works found</p>
            <button onClick={clearFilters} className="mt-4 font-label-md text-label-md text-primary hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Workstation Floating Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-surface/80 backdrop-blur-2xl border border-black/10 rounded-full px-6 py-3 flex items-center gap-gap-md shadow-2xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 transition-opacity ${viewMode === 'grid' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <span className="font-label-md text-label-md">grid</span>
          </button>
          <div className="w-px h-4 bg-black/10" />
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 transition-opacity ${viewMode === 'list' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[20px]">view_compact</span>
            <span className="font-label-md text-label-md">regular</span>
          </button>
          <div className="w-px h-4 bg-black/10" />

          {/* Animated Search */}
          <div className={`relative flex items-center transition-all duration-500 ${searchMode ? 'w-64' : 'w-[76px]'}`}>
            <button
              onClick={() => setSearchMode(true)}
              className={`absolute left-0 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all duration-300 ${
                searchMode ? 'opacity-0 -translate-x-3 pointer-events-none' : 'opacity-100 translate-x-0'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span className="font-label-md text-label-md">search</span>
            </button>
            <form
              onSubmit={handleSearchSubmit}
              className={`absolute left-0 flex items-center gap-2 w-full transition-all duration-300 ${
                searchMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
            >
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works, artists, tags..."
                className="bg-transparent border-b border-black/20 focus:border-primary focus:outline-none font-body-md text-body-md px-2 py-1 w-full"
              />
              <button type="submit" className="text-primary hover:opacity-70 transition-opacity shrink-0">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode(false); setSearchQuery(''); const next = new URLSearchParams(searchParams); next.delete('search'); setSearchParams(next) }}
                className="text-on-surface-variant hover:text-error transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </form>
          </div>

          <div className="w-px h-4 bg-black/10" />
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="font-label-md text-label-md">refine</span>
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {filterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-50"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-bright z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <h2 className="font-headline-lg text-headline-lg text-primary">refine results</h2>
              <button onClick={() => setFilterOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Sort */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">sort by</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'default' },
                    { key: 'popularity', label: 'popularity' },
                    { key: 'likes', label: 'likes' },
                    { key: 'saves', label: 'saves' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key as typeof sortBy)}
                      className={`px-3 py-1.5 rounded-full font-mono-sm text-[11px] transition-colors ${
                        sortBy === opt.key
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-primary hover:bg-surface-container'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">tags & keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-full font-mono-sm text-[11px] transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-primary hover:bg-surface-container'
                      }`}
                    >
                      #{tag.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Authors */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">popular authors</h3>
                <div className="flex flex-wrap gap-2">
                  {artistNames.map((artist) => (
                    <button
                      key={artist}
                      onClick={() => setFilters((prev) => ({ ...prev, author: artist === filters.author ? '' : artist }))}
                      className={`px-3 py-1.5 rounded-full font-mono-sm text-[11px] transition-colors ${
                        filters.author === artist
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-primary hover:bg-surface-container'
                      }`}
                    >
                      {artist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author Search */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">search author</h3>
                <input
                  type="text"
                  value={filters.author}
                  onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="type artist name..."
                  className="w-full bg-surface-container p-4 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Likes Range */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">likes range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minLikes}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minLikes: e.target.value }))}
                    placeholder="min"
                    className="w-full bg-surface-container p-3 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-on-surface-variant">-</span>
                  <input
                    type="number"
                    value={filters.maxLikes}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxLikes: e.target.value }))}
                    placeholder="max"
                    className="w-full bg-surface-container p-3 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Saves Range */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">saves range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minSaves}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minSaves: e.target.value }))}
                    placeholder="min"
                    className="w-full bg-surface-container p-3 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-on-surface-variant">-</span>
                  <input
                    type="number"
                    value={filters.maxSaves}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxSaves: e.target.value }))}
                    placeholder="max"
                    className="w-full bg-surface-container p-3 rounded-lg font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Pricing & License */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant tracking-widest mb-4">license & plan</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.enterpriseOnly || false}
                      onChange={(e) => setFilters((prev) => ({ ...prev, enterpriseOnly: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="font-body-md text-body-md">enterprise licensed only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.premiumOnly || false}
                      onChange={(e) => setFilters((prev) => ({ ...prev, premiumOnly: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="font-body-md text-body-md">premium tier content</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 flex gap-4">
              <button
                onClick={clearFilters}
                className="flex-1 py-4 border border-black/10 font-label-md text-label-md tracking-widest rounded-lg hover:bg-surface-container transition-colors"
              >
                reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-4 bg-primary text-on-primary font-label-md text-label-md tracking-widest rounded-lg hover:opacity-90 transition-opacity"
              >
                confirm ({filteredItems.length})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/gallery/${item.id}`}
      className={`${item.span} group relative overflow-hidden bg-surface-container-low transition-all duration-700 hover:shadow-xl`}
    >
      <div className={`${item.aspect} w-full overflow-hidden`}>
        <img
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          alt={item.alt}
          src={item.image}
          loading="lazy"
        />
      </div>

      {item.overlay === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-gap-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-sm text-mono-sm text-surface-bright/70 uppercase tracking-tighter">
                {item.subtitle}
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-primary">{item.title}</h3>
              <p className="font-body-md text-body-md text-surface-bright/80">{item.artist}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
                className={`w-10 h-10 rounded-full backdrop-blur-md bg-white/10 flex items-center justify-center hover:bg-white/30 transition-colors ${liked ? 'text-error' : 'text-on-primary'}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {item.overlay === 'info' && (
        <div className="p-6 bg-surface-bright/90 backdrop-blur-md border-t border-black/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              {item.subtitle && (
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                  {item.subtitle}
                </p>
              )}
              <h4 className="font-headline-lg text-headline-lg leading-none">{item.title}</h4>
            </div>
          </div>
          {item.artist && (
            <div className="flex items-center justify-between">
              <span className="font-mono-sm text-mono-sm text-on-surface-variant">{item.artist}</span>
              <div className="flex gap-3 text-on-surface-variant/60">
                <span className="flex items-center gap-1 font-mono-sm text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">favorite</span>
                  {item.likes}
                </span>
                <span className="flex items-center gap-1 font-mono-sm text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">bookmark</span>
                  {item.saves}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {item.overlay === 'minimal' && (
        <>
          <div className="absolute top-4 right-4 flex gap-1">
            {item.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="px-3 py-1 bg-primary text-on-primary font-mono-sm text-[10px] tracking-widest rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className="p-6 bg-surface-bright/50 backdrop-blur-xl absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <h4 className="font-label-md text-label-md uppercase tracking-tighter">{item.title}</h4>
            <p className="font-mono-sm text-mono-sm text-on-surface-variant">{item.subtitle}</p>
          </div>
        </>
      )}

      {item.overlay === 'full' && (
        <div className="absolute inset-0 p-8 flex flex-col justify-between">
          <div className="flex justify-end">
            <span className="font-label-md text-label-md text-on-primary bg-black/40 px-3 py-1 backdrop-blur-md">
              {item.subtitle}
            </span>
          </div>
          <div className="mix-blend-difference">
            <h2 className="font-display text-display text-white">{item.title}</h2>
            <p className="font-label-md text-label-md text-white tracking-widest">{item.artist}</p>
          </div>
        </div>
      )}
    </Link>
  )
}

function ListCard({ item }: { item: GalleryItem }) {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/gallery/${item.id}`}
      className="group relative overflow-hidden bg-surface-container-low aspect-square transition-all duration-700 hover:shadow-xl"
    >
      <img
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        alt={item.alt}
        src={item.image}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
        <h4 className="font-label-md text-label-md text-white uppercase tracking-tighter">{item.title}</h4>
        <p className="font-mono-sm text-mono-sm text-white/70">{item.artist}</p>
        <div className="flex items-center gap-3 mt-2 text-white/80">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
            className="flex items-center gap-1 font-mono-sm text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
            {item.likes}
          </button>
          <span className="flex items-center gap-1 font-mono-sm text-[11px]">
            <span className="material-symbols-outlined text-[14px]">bookmark</span>
            {item.saves}
          </span>
        </div>
      </div>
    </Link>
  )
}
