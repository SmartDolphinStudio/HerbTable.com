import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { t } from '../i18n'

interface User {
  name?: string
  avatar?: string
}

/** Navigation header with logo, nav links, and user avatar */
export default function Header() {
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('herbtable:user')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      setUser(null)
    }
  }, [location.pathname])

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.explore'), path: '/explore' },
    { label: t('nav.pricing'), path: '/pricing' },
  ]

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-bright/70 backdrop-blur-xl border-b border-black/5">
      <div className="h-20 w-full px-margin-page max-w-container-max mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-gap-sm">
          <img
            alt="HerbTable Logo"
            className="h-8 w-8 rounded-lg object-contain"
            src="/Image.png"
          />
          <span className="font-headline-lg text-headline-lg tracking-tight text-primary">
            HerbTable
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-gap-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={
                  isActive
                    ? 'tracking-wider transition-colors text-primary font-semibold'
                    : 'font-label-md text-label-md tracking-wider text-on-surface-variant hover:text-primary transition-colors'
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User Avatar → Login/Register */}
        <Link
          to={user ? `/profile/${user.name || 'me'}` : '/login'}
          className="w-8 h-8 rounded-full overflow-hidden bg-black flex items-center justify-center hover:opacity-80 transition-opacity"
          title={user ? user.name || 'Profile' : 'Login / Register'}
        >
          {user ? (
            <img
              alt={user.name || 'User'}
              className="w-full h-full object-cover"
              src={user.avatar || '/Image.png'}
            />
          ) : (
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          )}
        </Link>
      </div>
    </header>
  )
}
