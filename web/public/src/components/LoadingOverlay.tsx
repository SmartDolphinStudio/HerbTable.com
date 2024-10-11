interface LoadingOverlayProps {
  visible: boolean
  message?: string
}

/** Floating loading card overlay for genuine slow operations */
export default function LoadingOverlay({ visible, message = 'loading' }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-6">
      <div className="bg-surface-bright border border-black/5 shadow-2xl rounded-xl px-10 py-8 flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
        <span className="font-mono-sm text-mono-sm text-on-surface-variant tracking-widest">{message}</span>
      </div>
    </div>
  )
}
