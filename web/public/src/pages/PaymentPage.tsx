import { useState } from 'react'

type PaymentMethod = 'web3' | 'card' | 'wallet' | 'smartdolphin'

/** Secure checkout page with payment method selection and technical receipt. */
export default function PaymentPage() {
  const [method, setMethod] = useState<PaymentMethod>('web3')

  const methods: {
    key: PaymentMethod
    icon: string
    title: string
    subtitle: string
  }[] = [
    {
      key: 'web3',
      icon: 'account_balance_wallet',
      title: 'Web3',
      subtitle: 'Pay with crypto wallet or chain-native assets',
    },
    {
      key: 'card',
      icon: 'credit_card',
      title: '信用卡 / 借记卡 / VISA',
      subtitle: 'Visa, Mastercard, Amex, UnionPay, JCB',
    },
    {
      key: 'wallet',
      icon: 'wallet',
      title: '数字钱包',
      subtitle: 'Apple Pay, Google Pay, Alipay, WeChat Pay',
    },
    {
      key: 'smartdolphin',
      icon: 'dolphin',
      title: 'Smart Dolphin / Astraeus',
      subtitle: 'Enterprise ledger settlement network',
    },
  ]

  const previewItems = [
    { seed: 'payment1', label: 'CORE_LICENSE' },
    { seed: 'payment2', label: 'COMPUTE_EXT' },
    { seed: 'payment3', label: 'STORAGE_POOL' },
    { seed: 'payment4', label: 'NETWORK_RELAY' },
    { seed: 'payment5', label: 'SECURITY_MODULE' },
  ]

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-surface-container-lowest text-on-surface">
      {/* Left Column: Product & Payment */}
      <section className="w-[65%] h-full flex flex-col overflow-y-auto bg-surface-container-lowest">
        <div className="max-w-[800px] mx-auto w-full py-20 px-12 flex flex-col gap-16">
          {/* Product Preview Row */}
          <div className="flex flex-col gap-6">
            <h2 className="text-on-surface font-headline-lg text-2xl">Configuration Review</h2>
            <div className="relative w-full">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {previewItems.map((item) => (
                  <div
                    key={item.seed}
                    className="group relative aspect-video w-[320px] shrink-0 snap-start rounded overflow-hidden bg-white/80 backdrop-blur-xl border border-black/10"
                  >
                    <img
                      alt={item.label}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      src={`https://picsum.photos/seed/${item.seed}/800/450`}
                    />
                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-mono-sm border border-black/10">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end border-b-[0.5px] border-outline-variant pb-4">
              <h2 className="text-on-surface font-headline-lg text-2xl">Payment Selection</h2>
              <button className="text-accent-indigo font-mono-sm text-[11px] uppercase tracking-widest hover:underline transition-all">
                Change Currency
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`flex items-center gap-3 p-4 border rounded-lg text-left transition-all ${
                    method === m.key
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-white/80 border-black/10 text-on-surface hover:border-primary hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{m.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-mono-sm text-[12px] font-bold uppercase tracking-wider">{m.title}</span>
                    <span className={`text-[11px] ${method === m.key ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                      {m.subtitle}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <button className="w-full h-20 rounded text-on-primary font-mono-sm font-bold tracking-[0.3em] uppercase hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 bg-gradient-to-br from-accent-indigo to-accent-magenta">
              Complete Transaction
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="mt-6 text-center text-on-surface-variant font-mono-sm text-[10px] opacity-60">
              By completing this transaction, you agree to the Aetheric Workspace EULA and Terms of Service.
            </p>
          </div>
        </div>
      </section>

      {/* Right Column: Technical Receipt */}
      <section className="w-[35%] h-full relative flex flex-col p-12 border-none bg-white/80 backdrop-blur-xl">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)',
            backgroundSize: '10px 10px',
          }}
        />
        <div className="relative z-10 flex flex-col h-full font-mono-sm uppercase text-[12px] tracking-wider leading-relaxed">
          {/* Receipt Header */}
          <div className="border-b-[0.5px] border-outline-variant pb-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant text-[10px]">Reference Number</span>
                <span className="font-bold text-on-surface text-sm">TX-AE-9921-XRT</span>
              </div>
              <span className="material-symbols-outlined text-accent-indigo">verified</span>
            </div>
            <div className="flex flex-col gap-2 text-on-surface-variant text-[10px]">
              <div className="flex gap-2 mt-2">
                <span className="border border-outline-variant px-1.5 py-0.5">TLS_1.3</span>
                <span className="border border-outline-variant px-1.5 py-0.5">AES_256_GCM</span>
              </div>
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="flex-grow flex flex-col">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-on-surface">Aetheric Pro License</span>
                  <span className="text-on-surface-variant text-[10px]">Core Runtime + SDK Access</span>
                </div>
                <span className="text-on-surface font-bold">$1,899.00</span>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-on-surface">Cloud Compute Ext.</span>
                  <span className="text-on-surface-variant text-[10px]">256-Core Cluster / 30 Days</span>
                </div>
                <span className="text-on-surface font-bold">$600.00</span>
              </div>
            </div>
            <div className="border-t-[0.5px] border-dashed border-outline-variant py-6 flex flex-col gap-3">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>$2,499.00</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Processing Fee</span>
                <span>$12.40</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>VAT / GST (0%)</span>
                <span>$0.00</span>
              </div>
            </div>
            <div className="mt-auto pt-8 border-t-[0.5px] border-outline-variant">
              <span className="text-on-surface-variant text-[10px] block mb-2">Total Amount Due</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[40px] font-bold text-primary tracking-tighter">$2,511.40</span>
                <span className="text-on-surface font-bold">USD</span>
              </div>
            </div>
          </div>

          <div className="mt-12 opacity-30 text-[9px] text-center">
            Aetheric Financial Systems © 2024
            <br />
            All transactions are final and encrypted.
          </div>
        </div>
      </section>
    </div>
  )
}
