import { useEffect, useState } from 'react'
import { t } from '../i18n'

const curatorAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB-osw5pJhDsecfR0Fj6c_eCdC78Fbt5nWsb-VdSstd993ATz2N98yrtYD64dBQ0lxmjjV6BQ7tdSCFXbMC5CY_p3gaJD51K8XJHQwd9KjBaNQ9Glv_VWCuQ8iERG6jeZByfn2xyCBSe3-QzkFZfRijwYGpZ3OyREujJ1KsEGo275qwbF_cD5fmKkkfAEFv3iHXAsZgQOpIGYiqTNt-qc2-kpW1rpapSVkWJ1e2SWfLdp3H-bHLjf60Rg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBJuECfiTsLzokMVxuVq3E8Zkndpy2aYB0hL_-d2OJeRk4-F_x2OKWrDT15AbxinM3qoopgozwbd2-UjwxjsYrahqMbUOh3ee2JVOPhkG0VArQa3wXNXEbDS8FMHRyn4Sev3SgUmQVAlmCvafaH2XxtWfKJ9R19Ti2Ajd8H8mA8oXvqpNOhjg9xj6bSDUgN2NJ0NagC5t6zxGNZB4Cjs-YH5FPXMizxjB9nUsntJOkDsmIembb9REQSjQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAj3P5ILIokl5ZoWVNfH0_h4hy-SPjieVn-oSdoVAnbFMgiPD62-wXU-S0U98xouXf1L5n1iXPkJZuklqvjuWIoWIEjeXOOyY7cn8tBkmHHKu1E_YgzWF8OWs_BLj99UwfqgqjFhVHtRbx5TpUzz3VuM2WXAT9B9NnK4RJDzWYol9V8Y_c6M_99Tu7Ndj5MT8wXLUU-zL2x5z7ZCWyVwtgFqrNu7dP6vihrgjPjw_A-d1fy2P0SS8j6kQ',
]

/** Technical stats section with live counters */
export default function StatsSection() {
  const [assetCount, setAssetCount] = useState(0)
  const [latency, setLatency] = useState(12)

  useEffect(() => {
    setAssetCount(Math.floor(Math.random() * 400) + 600)
    setLatency(Math.floor(Math.random() * 16) + 4)

    const interval = setInterval(() => {
      setAssetCount(Math.floor(Math.random() * 400) + 600)
      setLatency(Math.floor(Math.random() * 16) + 4)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="w-full bg-surface-container-low py-gap-lg border-y border-black/5">
      <div className="max-w-container-max mx-auto px-margin-page">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-gap-lg">
          {/* Assets Counter */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-md text-primary tracking-tighter border-b border-black/10 pb-2">
              {t('stats.engineeringStats')}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[48px] leading-none">{assetCount}</span>
              <span className="font-label-md text-on-surface-variant">{t('stats.assets')}</span>
            </div>
            <div className="w-full bg-black/5 h-[2px] relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-primary w-2/3" />
            </div>
          </div>

          {/* Latency */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-md text-primary tracking-tighter border-b border-black/10 pb-2">
              {t('stats.latencyCore')}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[48px] leading-none">{latency}</span>
              <span className="font-label-md text-on-surface-variant">MS</span>
            </div>
            <div className="flex gap-1">
              <div className="h-2 w-1 bg-primary" />
              <div className="h-4 w-1 bg-primary" />
              <div className="h-3 w-1 bg-primary" />
              <div className="h-5 w-1 bg-primary" />
              <div className="h-2 w-1 bg-black/10" />
            </div>
          </div>

          {/* Uptime */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-md text-primary tracking-tighter border-b border-black/10 pb-2">
              {t('stats.uptimeRelay')}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[48px] leading-none">99.9</span>
              <span className="font-label-md text-on-surface-variant">%</span>
            </div>
            <p className="font-mono-sm text-[11px] text-on-surface-variant">{t('stats.encryptedSsl')}</p>
          </div>

          {/* Active Curators */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-md text-primary tracking-tighter border-b border-black/10 pb-2">
              {t('stats.systemAuth')}
            </h4>
            <div className="flex -space-x-2">
              {curatorAvatars.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Curator ${idx + 1}`}
                  className="w-10 h-10 rounded-full border-2 border-surface-bright object-cover"
                />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-surface-bright bg-primary flex items-center justify-center text-on-primary font-label-md text-[10px]">
                +12k
              </div>
            </div>
            <p className="font-mono-sm text-[11px] text-on-surface-variant">{t('stats.activeCurators')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
