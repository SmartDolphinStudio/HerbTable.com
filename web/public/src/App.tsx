import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import GalleryDetailPage from './pages/GalleryDetailPage'
import ProfilePage from './pages/ProfilePage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'
import EnterpriseLoginPage from './pages/EnterpriseLoginPage'
import AIPage from './pages/AIPage'
import NotFoundPage from './pages/NotFoundPage'
import DocsPage from './pages/DocsPage'
import PaymentPage from './pages/PaymentPage'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'

/** Known routes that render with header/footer */
const LAYOUT_ROUTES = ['/', '/explore', '/gallery', '/profile', '/pricing']

/** Check if current path is a known layout route */
function isLayoutRoute(pathname: string): boolean {
  return LAYOUT_ROUTES.includes(pathname) || pathname.startsWith('/gallery/') || pathname.startsWith('/profile/')
}

/** Root application component with routing */
export default function App() {
  const location = useLocation()

  if (isLayoutRoute(location.pathname)) {
    return (
      <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/gallery/:id" element={<GalleryDetailPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent />
      </div>
    )
  }

  // Full-page routes (no header/footer): login, enterprise-login, ai, 404
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/enterprise-login" element={<EnterpriseLoginPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieConsent />
    </>
  )
}
