import { Link } from 'react-router-dom'
import { t } from '../i18n'
import HeroSection from '../components/HeroSection'
import GallerySection from '../components/GallerySection'
import StatsSection from '../components/StatsSection'

/** Home page with hero, gallery preview, and stats */
export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <GallerySection />
      <StatsSection />
    </div>
  )
}
