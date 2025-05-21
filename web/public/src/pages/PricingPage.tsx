import { useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../i18n'

type BillingType = 'personal' | 'enterprise'
type PaymentInterval = 'monthly' | 'yearly'

interface PricingPlan {
  key: string
  featured?: boolean
}

const personalPlans: PricingPlan[] = [
  { key: 'free' },
  { key: 'starter', featured: true },
  { key: 'creator' },
  { key: 'pro' },
  { key: 'business' },
]

const enterprisePlans: PricingPlan[] = [
  { key: 'team' },
  { key: 'business', featured: true },
  { key: 'enterprise' },
  { key: 'platform' },
  { key: 'global' },
]

const YEARLY_DISCOUNT = { personal: 0.2, enterprise: 0.1 }

/** Check whether a plan supports yearly billing. */
function supportsYearly(billingType: BillingType, planKey: string): boolean {
  if (billingType === 'personal') {
    return planKey === 'pro' || planKey === 'business'
  }
  return planKey !== 'team'
}

/** Extract numeric price from a translated price string like "$99". */
function parsePrice(priceStr: string): number {
  const match = priceStr.replace(/,/g, '').match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

/** Format a price as "$99". */
function formatPrice(value: number): string {
  return `$${Math.round(value)}`
}

/** Pricing page with a shared monthly/yearly switch and payment link. */
export default function PricingPage() {
  const [billingType, setBillingType] = useState<BillingType>('personal')
  const [paymentInterval, setPaymentInterval] = useState<PaymentInterval>('monthly')
  const plans = billingType === 'personal' ? personalPlans : enterprisePlans

  return (
    <div className="max-w-container-max mx-auto px-margin-page py-gap-lg">
      {/* Header */}
      <div className="text-center mb-gap-md">
        <span className="font-mono-sm text-mono-sm text-on-surface-variant uppercase tracking-tighter mb-2 block">
          02 // Pricing
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary">{t('pricing.title')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Shared billing interval switch. Discounts apply only to eligible plans. */}
      <div className="flex justify-center mb-gap-lg -mt-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-surface-container-low p-1 shadow-sm">
          <button
            type="button"
            aria-pressed={paymentInterval === 'monthly'}
            onClick={() => setPaymentInterval('monthly')}
            className={`rounded-full px-5 py-2 font-label-md text-label-md uppercase tracking-wider transition-all ${
              paymentInterval === 'monthly' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={paymentInterval === 'yearly'}
            onClick={() => setPaymentInterval('yearly')}
            className={`rounded-full px-5 py-2 font-label-md text-label-md uppercase tracking-wider transition-all ${
              paymentInterval === 'yearly' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Yearly <span className="ml-1 text-[10px] opacity-80">Save {Math.round(YEARLY_DISCOUNT[billingType] * 100)}%</span>
          </button>
        </div>
      </div>

      {/* Personal / Enterprise Toggle */}
      <div className="flex justify-center mb-gap-lg">
        <div className="inline-flex bg-surface-container-low rounded-lg p-1 border border-black/5">
          <button
            type="button"
            onClick={() => setBillingType('personal')}
            className={`px-8 py-3 font-label-md text-label-md uppercase tracking-widest transition-all rounded-md ${
              billingType === 'personal'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {t('pricing.personalTab')}
          </button>
          <button
            type="button"
            onClick={() => setBillingType('enterprise')}
            className={`px-8 py-3 font-label-md text-label-md uppercase tracking-widest transition-all rounded-md ${
              billingType === 'enterprise'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {t('pricing.enterpriseTab')}
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gap-md max-w-7xl mx-auto">
        {plans.map((plan) => {
          const name = t(`pricing.${plan.key}.name`)
          const basePriceStr = t(`pricing.${plan.key}.price`)
          const description = t(`pricing.${plan.key}.description`)
          const featuresKey = `pricing.${plan.key}.features`

          const basePrice = parsePrice(basePriceStr)
          const canYearly = supportsYearly(billingType, plan.key)
          const isYearly = canYearly && paymentInterval === 'yearly'
          const discount = YEARLY_DISCOUNT[billingType]
          const price = isYearly ? basePrice * 12 * (1 - discount) : basePrice
          const period = isYearly ? '/year' : '/month'

          return (
            <div
              key={plan.key}
              className={`relative rounded-lg p-6 flex flex-col ${
                plan.featured
                  ? 'bg-primary text-on-primary scale-[1.02] shadow-2xl lg:-mt-2 lg:mb-2'
                  : 'bg-surface-container-low text-on-background border border-black/5'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-primary font-label-md text-label-md rounded-full shadow-lg">
                  POPULAR
                </div>
              )}

              <div className="mb-4">
                <h3 className={`font-headline-lg text-headline-lg ${plan.featured ? 'text-on-primary' : 'text-primary'}`}>
                  {name}
                </h3>
                <p className={`font-body-md text-body-md mt-1 ${plan.featured ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {description}
                </p>
              </div>

              {isYearly && (
                <div className={`mb-4 font-mono-sm text-[11px] uppercase tracking-wider ${plan.featured ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                  Annual billing · {Math.round(discount * 100)}% saved
                </div>
              )}

              <div className="mb-6">
                <span className={`font-display text-[40px] leading-none ${plan.featured ? 'text-on-primary' : 'text-primary'}`}>
                  {formatPrice(price)}
                </span>
                <span className={`font-label-md text-label-md ${plan.featured ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {period}
                </span>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const feature = t(`${featuresKey}.${i}`)
                  if (!feature || feature.startsWith('pricing.')) return null
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[16px] mt-0.5 ${plan.featured ? 'text-on-primary' : 'text-primary'}`}>
                        check
                      </span>
                      <span className={`font-body-md text-body-md ${plan.featured ? 'text-on-primary/90' : 'text-on-surface-variant'}`}>
                        {feature}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <Link
                to="/payment"
                className={`w-full py-3 text-center font-label-md text-label-md uppercase tracking-widest rounded-lg transition-all ${
                  plan.featured
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {t('pricing.cta')}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
