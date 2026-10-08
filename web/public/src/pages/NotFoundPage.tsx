import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/** 404 Not Found page with parallax effect and report interaction */
export default function NotFoundPage() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [reportState, setReportState] = useState<'idle' | 'scanning' | 'logged'>('idle')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.02
      const moveY = (e.clientY - window.innerHeight / 2) * 0.02
      setParallax({ x: moveX, y: moveY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleReport = () => {
    if (reportState !== 'idle') return
    setReportState('scanning')
    setTimeout(() => {
      setReportState('logged')
      setTimeout(() => setReportState('idle'), 2000)
    }, 1500)
  }

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-start justify-center bg-background pt-[15vh]">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-secondary/5 to-transparent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-[100px]" />
        {/* Grid overlay - darker/more visible */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center pt-[18vh] md:pt-[22vh] px-margin-page">
        {/* 404 Text - bolder stroke, moved down */}
        <div className="relative group select-none">
          <h1
            className="font-display text-[150px] md:text-[240px] leading-none tracking-tighter text-transparent transition-transform duration-300 ease-out"
            style={{
              WebkitTextStroke: '1.5px rgba(0,0,0,0.5)',
              transform: `translate(${parallax.x}px, ${parallax.y}px)`,
            }}
          >
            404
          </h1>
          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-primary" />
            <div className="absolute left-1/2 top-0 w-[0.5px] h-full bg-primary" />
          </div>
        </div>

        {/* Content Block - positioned diagonally below 404, no overlap */}
        <div className="flex flex-col max-w-xl ml-[60px] md:ml-[160px] lg:ml-[220px] mt-2 md:mt-4 text-left">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-12 h-[0.5px] bg-primary/40" />
            <span className="font-label-md text-label-md tracking-[0.4em] text-primary uppercase">
              Protocol Failure
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="font-headline-lg text-primary tracking-tight">Lost in the digital void.</h2>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                The masterpiece you are looking for has drifted beyond our neural horizons. Our algorithms are scanning the latent space for its recovery.
              </p>
            </div>
            {/* Action Area */}
            <div className="flex flex-wrap items-start gap-gap-md pt-10">
              <Link
                to="/"
                className="group relative px-8 py-4 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Return to Gallery{' '}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <button
                className="border border-black/10 px-8 py-4 font-label-md text-label-md uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:pointer-events-none"
                disabled={reportState !== 'idle'}
                onClick={handleReport}
              >
                {reportState === 'idle' && 'Report Issue'}
                {reportState === 'scanning' && 'Scanning Log...'}
                {reportState === 'logged' && '✓ Logged'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="absolute bottom-12 left-margin-page right-0 px-margin-page flex justify-between items-center z-10 text-[10px] font-label-md text-on-surface-variant tracking-widest opacity-40 uppercase hidden md:flex">
        <div className="flex gap-gap-md">
          <span>Coord: 0.00.00</span>
          <span>Entropy: 0.9992</span>
        </div>
        <div className="flex gap-gap-md">
          <span>© HerbTable Protocol</span>
          <span>V.02-E-1</span>
        </div>
      </div>
    </div>
  )
}
