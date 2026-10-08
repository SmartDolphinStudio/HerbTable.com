import { useEffect, useMemo, useRef, useState } from 'react'

/** A single step in the assistant thinking process. */
type Step =
  | { id: string; type: 'thought'; text: string; status: 'streaming' | 'done' }
  | { id: string; type: 'tool'; text: string; status: 'streaming' | 'done' | 'error'; error?: ErrorInfo }
  | { id: string; type: 'image'; text: string; image: string; status: 'done' }

interface ErrorInfo {
  message: string
  countdown: number
  details?: string[]
}

/** Assistant message produced by the fake AI. */
interface AssistantMessage {
  role: 'assistant'
  id: string
  steps: Step[]
  finalImage?: string
  finalText: string
  finalTextStreamed: string
  thinkingCollapsed: boolean
  thinkingTime: number
  totalTime: number
  completed: boolean
}

/** User message. */
interface UserMessage {
  role: 'user'
  id: string
  text: string
}

type Message = UserMessage | AssistantMessage

/** Persisted conversation. */
interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: Message[]
}

interface ModelSelectorState {
  model: string
  strength: string
}

const CONVERSATIONS_KEY = 'herbtable_ai_conversations'
const CURRENT_CONVERSATION_KEY = 'herbtable_ai_current_conversation'
const DEFAULT_MODEL = 'Midjourney V6'
const DEFAULT_STRENGTH = 'high'

const MODELS = [
  'Midjourney V6',
  'Midjourney V6.1',
  'DALL·E 3',
  'Stable Diffusion XL',
  'Stable Diffusion 3',
  'Flux.1 [dev]',
  'Flux.1 [pro]',
  'Ideogram V2',
  'Imagen 3',
  'Kandinsky 3',
  'Playground V2.5',
  'AuraRender-7B',
]

const STRENGTHS = [
  { key: 'light', label: '轻度' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
  { key: 'very-high', label: '极高' },
  { key: 'max', label: '最高' },
]

const RECONNECT_ERRORS = [
  'Server 502 Bad Gateway',
  'Server 429 Too Many Requests',
  'Server 401 Unauthorized',
  'Cache invalidation failed',
  'Commit error: dirty state',
  'Connection reset by peer',
  'Timeout waiting for node',
  'TLS handshake interrupted',
]

const TOOL_LINES = [
  'Creating MD document...',
  'Writing MD section header...',
  'Appending render parameters...',
  'Image status: success',
  'Viewing generated image...',
  'Detected artifact in lower-right corner',
  'Patching texture layer...',
  'Retrying render with updated weights...',
  'Verifying output checksum...',
  'Calling image upscaler service...',
  'Rebuilding latent diffusion grid...',
  'Compressing final asset...',
]

const THINKING_LINES = [
  'Analyzing spatial coordinates and light propagation vectors.',
  'Computing atmospheric scattering and volumetric haze.',
  'Sampling material properties from the latent diffusion manifold.',
  'Refining edge contours and surface normals.',
  'Balancing contrast ratios and dynamic range.',
  'Applying tone mapping and color grading curves.',
  'Evaluating semantic alignment with the visual latent space.',
  'Re-rendering with a higher sampling rate to suppress noise.',
  'Denoising intermediate buffers while preserving detail.',
  'Compositing foreground, midground, and background layers.',
  'Adjusting depth-of-field parameters and bokeh shape.',
  'Checking output resolution and color-space conformance.',
  'Finalizing artifact suppression and edge-aware sharpening.',
  'Routing the inference through the upscaling pipeline.',
  'Synchronizing tensor shards across worker nodes.',
  'Applying style transfer and finishing the diffusion schedule.',
  'Cross-referencing against training-set safety filters.',
  'Packaging the generated asset for delivery.',
  'Logging render telemetry and cleaning up checkpoints.',
]

/** Deterministic pseudo-random generator from a string seed. */
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return function random() {
    h = (h * 9301 + 49297) % 233280
    return h / 233280
  }
}

/** Pick a random item from an array using the provided rng. */
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Promise-based delay that can be aborted. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

/** Format milliseconds into mm:ss:ms. */
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = Math.floor(ms % 1000)
  return `${minutes}m ${seconds}s ${millis}ms`
}

/** Generate a deterministic placeholder image from a prompt seed. */
function aiImageUrl(seed: number, width = 960, height = 540): string {
  return `https://picsum.photos/seed/ai${seed}/${width}/${height}`
}

/** Create a short title from the first user prompt. */
function makeTitle(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  if (clean.length <= 24) return clean
  return clean.slice(0, 24) + '...'
}

/** Format creation timestamp. */
function formatCreatedAt(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** Stream text into a target field character by character. */
async function streamText(
  target: { text: string },
  fullText: string,
  onUpdate: () => void,
  signal: AbortSignal,
  baseDelay = 25
) {
  for (let i = 0; i <= fullText.length; i++) {
    if (signal.aborted) return
    target.text = fullText.slice(0, i)
    onUpdate()
    await delay(baseDelay + Math.random() * 30, signal)
  }
  target.text = fullText
}

/** Fake AI streaming simulation with thinking, tools, errors, reconnections, and final image. */
async function simulateAssistantResponse(
  prompt: string,
  onUpdate: (msg: AssistantMessage) => void,
  signal: AbortSignal
) {
  const startTime = performance.now()
  const rng = seededRandom(`${prompt}-${Date.now()}`)
  const seedNum = Math.floor(rng() * 1000000)

  const assistant: AssistantMessage = {
    role: 'assistant',
    id: `assistant-${Date.now()}`,
    steps: [],
    finalText: '',
    finalTextStreamed: '',
    thinkingCollapsed: false,
    thinkingTime: 0,
    totalTime: 0,
    completed: false,
  }

  const flush = () => onUpdate({ ...assistant })

  const addStep = (step: Omit<Step, 'id'>): Step => {
    const full = { ...step, id: `step-${assistant.steps.length}` } as Step
    assistant.steps.push(full)
    flush()
    return full
  }

  const updateStep = (step: Step) => {
    const idx = assistant.steps.findIndex((s) => s.id === step.id)
    if (idx !== -1) {
      assistant.steps[idx] = step
      flush()
    }
  }

  const addThought = async (text: string) => {
    const step: Step = { id: `step-${assistant.steps.length}`, type: 'thought', text: '', status: 'streaming' }
    assistant.steps.push(step)
    flush()
    await streamText(step as { text: string }, text, flush, signal, 12)
    step.status = 'done'
    flush()
  }

  const addTool = async (text: string) => {
    const step: Step = { id: `step-${assistant.steps.length}`, type: 'tool', text: '', status: 'streaming' }
    assistant.steps.push(step)
    flush()
    await streamText(step as { text: string }, text, flush, signal, 18)

    // Randomly fail the tool call with a short reconnection countdown.
    if (rng() > 0.55) {
      step.status = 'error'
      step.error = { message: 'Connection lost, reconnecting...', countdown: 5 }
      flush()

      const reconnectAt = Math.floor(1 + rng() * 2) // reconnect between 1s and 2s left
      while ((step.error?.countdown ?? 0) > reconnectAt) {
        await delay(1000, signal)
        if (step.error) step.error.countdown -= 1
        flush()
      }

      step.status = 'streaming'
      step.error = undefined
      flush()
      await delay(300 + rng() * 400, signal)
      step.status = 'done'
      flush()
    } else {
      step.status = 'done'
      flush()
    }
  }

  const addImageStep = async (caption: string, imageSeed: number) => {
    const step: Step = {
      id: `step-${assistant.steps.length}`,
      type: 'image',
      text: caption,
      image: aiImageUrl(imageSeed, 160, 120),
      status: 'done',
    }
    assistant.steps.push(step)
    flush()
    await delay(400 + rng() * 400, signal)
  }

  const thinkingStart = performance.now()

  // Initial verbose thinking phase
  for (let i = 0; i < 12; i++) {
    if (signal.aborted) return

    if (i % 5 === 0 && i > 0) {
      await addTool(pick(rng, TOOL_LINES))
    } else if (i % 4 === 0 && i > 0) {
      await addImageStep('Inline preview rendered', seedNum + i)
    } else {
      await addThought(pick(rng, THINKING_LINES))
    }

    // Occasional short pause to simulate "stuck" thinking.
    if (rng() > 0.78) {
      await delay(400 + rng() * 600, signal)
    }
  }

  assistant.thinkingTime = Math.round(performance.now() - thinkingStart)
  flush()

  // Major reconnection event
  const reconnectStep: Step = {
    id: `step-${assistant.steps.length}`,
    type: 'tool',
    text: 'Committing render state to persistent storage...',
    status: 'error',
    error: { message: 'Server 502 Bad Gateway — reconnecting in', countdown: 5 },
  }
  assistant.steps.push(reconnectStep)
  flush()

  while ((reconnectStep.error?.countdown ?? 0) > 0) {
    await delay(1000, signal)
    if (reconnectStep.error) reconnectStep.error.countdown -= 1
    flush()
  }

  reconnectStep.error = {
    message: 'Reconnection failed — retrying with fallback nodes',
    countdown: 0,
    details: Array.from({ length: 5 }, () => pick(rng, RECONNECT_ERRORS)),
  }
  flush()
  await delay(800, signal)
  reconnectStep.status = 'done'
  reconnectStep.error = undefined
  flush()

  // Continue task after reconnect
  await addThought('I continue the above task.')
  for (let i = 0; i < 6; i++) {
    if (signal.aborted) return
    if (i % 3 === 0) await addTool(pick(rng, TOOL_LINES))
    else if (i % 2 === 0) await addImageStep('Patched preview rendered', seedNum + 100 + i)
    else await addThought(pick(rng, THINKING_LINES))
  }

  // Second smaller reconnection
  const smallReconnect: Step = {
    id: `step-${assistant.steps.length}`,
    type: 'tool',
    text: 'Finalizing asset delivery...',
    status: 'error',
    error: { message: 'Connection unstable — retrying in', countdown: 4 },
  }
  assistant.steps.push(smallReconnect)
  flush()
  while ((smallReconnect.error?.countdown ?? 0) > 1) {
    await delay(1000, signal)
    if (smallReconnect.error) smallReconnect.error.countdown -= 1
    flush()
  }
  smallReconnect.status = 'done'
  smallReconnect.error = undefined
  flush()

  // Final output
  assistant.finalImage = aiImageUrl(seedNum, 960, 540)
  assistant.finalText = `The image you requested, "${prompt}", has been generated successfully. Review the output above and let me know if you need any adjustments.`
  flush()
  const finalTarget = { text: assistant.finalTextStreamed }
  await streamText(finalTarget, assistant.finalText, flush, signal, 14)
  assistant.finalTextStreamed = finalTarget.text
  assistant.totalTime = Math.round(performance.now() - startTime)
  assistant.completed = true
  assistant.thinkingCollapsed = true
  flush()
}

/** Load conversations from localStorage. */
function loadConversations(): Conversation[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Save conversations to localStorage. */
function saveConversations(conversations: Conversation[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}

/** Create a fresh empty conversation. */
function createConversation(): Conversation {
  const now = new Date()
  return {
    id: `conv-${now.getTime()}`,
    title: 'New Conversation',
    createdAt: now.toISOString(),
    messages: [],
  }
}

/** Expandable white model/strength selector popup. */
function ModelSelectorPopup({
  selector,
  onChange,
  open,
  onToggle,
  onClose,
}: {
  selector: ModelSelectorState
  onChange: (s: ModelSelectorState) => void
  open: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState<'model' | 'strength' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setExpanded(null)
      return
    }
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">tune</span>
        <span className="font-mono-sm text-[11px]">{selector.model}</span>
        <span className="font-mono-sm text-[11px] text-black/40">
          {STRENGTHS.find((s) => s.key === selector.strength)?.label}
        </span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-black/10 shadow-2xl rounded-xl p-2 z-50">
          <button
            type="button"
            onClick={() => setExpanded(expanded === 'model' ? null : 'model')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <span className="font-body-md text-[14px] text-black">模型</span>
            <div className="flex items-center gap-1 text-black/40">
              <span className="font-mono-sm text-[12px]">{selector.model}</span>
              <span className="material-symbols-outlined text-[18px]">
                {expanded === 'model' ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>
          {expanded === 'model' && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 max-h-40 overflow-y-auto">
              {MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    onChange({ ...selector, model })
                    setExpanded(null)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] hover:bg-black/5 transition-colors"
                >
                  <span className={selector.model === model ? 'text-primary font-medium' : 'text-black/80'}>
                    {model}
                  </span>
                  {selector.model === model && (
                    <span className="material-symbols-outlined text-primary text-[18px]">check_box</span>
                  )}
                  {selector.model !== model && (
                    <span className="material-symbols-outlined text-black/20 text-[18px]">check_box_outline_blank</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-black/5 my-1" />

          <button
            type="button"
            onClick={() => setExpanded(expanded === 'strength' ? null : 'strength')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <span className="font-body-md text-[14px] text-black">绘画强度</span>
            <div className="flex items-center gap-1 text-black/40">
              <span className="font-mono-sm text-[12px]">
                {STRENGTHS.find((s) => s.key === selector.strength)?.label}
              </span>
              <span className="material-symbols-outlined text-[18px]">
                {expanded === 'strength' ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>
          {expanded === 'strength' && (
            <div className="pl-3 pr-1 py-1 space-y-0.5">
              {STRENGTHS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    onChange({ ...selector, strength: s.key })
                    setExpanded(null)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] hover:bg-black/5 transition-colors"
                >
                  <span className={selector.strength === s.key ? 'text-primary font-medium' : 'text-black/80'}>
                    {s.label}
                  </span>
                  {selector.strength === s.key && (
                    <span className="material-symbols-outlined text-primary text-[18px]">check_box</span>
                  )}
                  {selector.strength !== s.key && (
                    <span className="material-symbols-outlined text-black/20 text-[18px]">check_box_outline_blank</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** AI workspace with streaming fake AI, left history sidebar, and model selector. */
export default function AIPage() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(CURRENT_CONVERSATION_KEY) || ''
  })
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selector, setSelector] = useState<ModelSelectorState>({
    model: DEFAULT_MODEL,
    strength: DEFAULT_STRENGTH,
  })
  const [showSelector, setShowSelector] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)
  const [historyMenu, setHistoryMenu] = useState<{ x: number; y: number; conversation: Conversation } | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Ensure a current conversation exists.
  useEffect(() => {
    if (!currentId || !conversations.find((c) => c.id === currentId)) {
      const initial = createConversation()
      setConversations((prev) => [initial, ...prev])
      setCurrentId(initial.id)
    }
  }, [])

  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, currentId)
    }
  }, [currentId])

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentId) || createConversation(),
    [conversations, currentId]
  )

  const messages = currentConversation.messages

  // Smart auto-scroll: only scroll if the user is already near the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isAtBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 60
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const updateCurrentMessages = (updater: (msgs: Message[]) => Message[]) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === currentId ? { ...conv, messages: updater(conv.messages) } : conv))
    )
  }

  const updateAssistant = (updated: AssistantMessage) => {
    updateCurrentMessages((msgs) => msgs.map((m) => (m.id === updated.id ? updated : m)))
  }

  const createNewConversation = () => {
    const conv = createConversation()
    setConversations((prev) => [conv, ...prev])
    setCurrentId(conv.id)
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleSend = async () => {
    const prompt = inputValue.trim()
    if (!prompt || isStreaming) return

    const userMessage: UserMessage = { role: 'user', id: `user-${Date.now()}`, text: prompt }
    const placeholder: AssistantMessage = {
      role: 'assistant',
      id: `assistant-${Date.now()}`,
      steps: [],
      finalText: '',
      finalTextStreamed: '',
      thinkingCollapsed: false,
      thinkingTime: 0,
      totalTime: 0,
      completed: false,
    }

    // If this is the first message in a new conversation, set the title.
    const isFirstMessage = messages.length === 0

    updateCurrentMessages((msgs) => [...msgs, userMessage, placeholder])
    setInputValue('')
    setIsStreaming(true)
    isAtBottomRef.current = true

    if (isFirstMessage) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentId
            ? { ...conv, title: makeTitle(prompt), createdAt: new Date().toISOString() }
            : conv
        )
      )
    }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await simulateAssistantResponse(prompt, updateAssistant, controller.signal)
    } catch {
      // Leave current state as-is on abort/error.
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) {
        handleStop()
      } else {
        handleSend()
      }
    }
  }

  const toggleThinking = (msg: AssistantMessage) => {
    updateAssistant({ ...msg, thinkingCollapsed: !msg.thinkingCollapsed })
  }

  const handleHistoryContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault()
    setHistoryMenu({ x: e.clientX, y: e.clientY, conversation })
  }

  const confirmRename = (conversation: Conversation, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversation.id ? { ...conv, title: trimmed } : conv))
    )
    setRenameTarget(null)
  }

  const confirmDelete = (conversation: Conversation) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== conversation.id)
      if (currentId === conversation.id && next.length > 0) {
        setCurrentId(next[0].id)
      } else if (next.length === 0) {
        const fresh = createConversation()
        setCurrentId(fresh.id)
        return [fresh]
      }
      return next
    })
    setDeleteTarget(null)
  }

  return (
    <div className="fixed inset-0 bg-white flex">
      {/* Left History Sidebar */}
      <div className="hidden lg:flex w-72 border-r border-black/10 flex-col bg-white">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <span className="font-label-md text-label-md uppercase tracking-widest text-black/70">History</span>
          <button
            type="button"
            onClick={createNewConversation}
            className="p-1.5 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1" onClick={() => setHistoryMenu(null)}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setCurrentId(conv.id)}
              onContextMenu={(e) => handleHistoryContextMenu(e, conv)}
              className={`w-full text-left p-3 rounded-xl cursor-pointer group transition-colors ${
                conv.id === currentId ? 'bg-black/5' : 'hover:bg-black/5'
              }`}
            >
              <div
                className={`font-body-md text-[14px] truncate ${
                  conv.id === currentId ? 'text-primary' : 'text-black group-hover:text-primary'
                }`}
              >
                {conv.title}
              </div>
              <div className="font-mono-sm text-[11px] text-black/40 mt-1">{formatCreatedAt(new Date(conv.createdAt))}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-black/40 px-6">
              <span className="material-symbols-outlined text-[48px] mb-4">auto_awesome</span>
              <p className="font-body-md text-body-md text-center mb-8">Describe your vision and press enter.</p>
              <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                {[
                  'A brutalist concrete tower under a pastel sunset',
                  'Liquid chrome portrait with iridescent highlights',
                  'Minimalist product shot of a black keyboard',
                  'Cinematic aerial view of geometric salt flats',
                ].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => {
                      setInputValue(hint)
                      inputRef.current?.focus()
                    }}
                    className="px-4 py-2 bg-black/5 hover:bg-black/10 text-black/60 hover:text-black rounded-full text-[13px] transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="bg-black px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] text-white text-[15px] leading-6">
                      {msg.text}
                    </div>
                  </div>
                )
              }

              const assistant = msg as AssistantMessage
              return (
                <div key={assistant.id} className="flex flex-col gap-4">
                  {/* Thinking process */}
                  {assistant.steps.length > 0 && (
                    <div className="group border-l-[0.5px] border-black/20 ml-2 pl-6 py-1 relative">
                      <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full border-[0.5px] border-black/20 bg-white" />
                      <details
                        open={!assistant.thinkingCollapsed}
                        className="text-black/50 text-[13px] transition-all"
                      >
                        <summary
                          onClick={(e) => {
                            e.preventDefault()
                            toggleThinking(assistant)
                          }}
                          className="cursor-pointer font-mono-sm text-[11px] uppercase tracking-widest hover:text-black/70 flex items-center gap-2 list-none select-none"
                        >
                          <span className="material-symbols-outlined text-[14px]">psychology</span>
                          Thinking Process
                          <span className="material-symbols-outlined text-[14px] ml-auto transition-transform">
                            {assistant.thinkingCollapsed ? 'expand_more' : 'expand_less'}
                          </span>
                        </summary>
                        <div className="mt-4 font-body-md space-y-3 opacity-80 leading-relaxed border-l border-black/10 pl-4 text-[15px]">
                          {assistant.steps.map((step) => (
                            <div key={step.id} className="flex items-start gap-3">
                              {step.type === 'tool' && (
                                <span className="material-symbols-outlined text-[16px] mt-0.5 relative">
                                  {step.status === 'streaming' ? 'build_circle' : 'build_circle'}
                                  {step.status === 'streaming' && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[10px] animate-spin">progress_activity</span>
                                    </span>
                                  )}
                                </span>
                              )}
                              {step.type === 'image' && (
                                <img
                                  src={step.image}
                                  alt="inline preview"
                                  className="w-20 h-16 object-cover rounded border border-black/10"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className={step.type === 'tool' ? 'text-black/70' : ''}>{step.text}</span>
                                {step.type === 'tool' && step.status === 'error' && step.error && (
                                  <div className="mt-2 bg-error/10 border border-error/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-error font-mono-sm text-[12px]">
                                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                      <span>
                                        {step.error.message} {step.error.countdown > 0 ? step.error.countdown : 0}s
                                      </span>
                                    </div>
                                    {step.error.countdown === 0 && step.error.details && (
                                      <div className="mt-2 space-y-1">
                                        {step.error.details.map((err, idx) => (
                                          <div key={idx} className="text-error text-[12px] font-mono-sm">
                                            {err}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Final output */}
                  {assistant.finalImage && (
                    <>
                      <div className="w-full aspect-[16/9] rounded-xl border border-black/10 overflow-hidden bg-white shadow-sm relative group">
                        <img
                          className="w-full h-full object-cover"
                          alt="AI generated result"
                          src={assistant.finalImage}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/20">
                            <span className="material-symbols-outlined text-white">download</span>
                          </button>
                          <button className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/20">
                            <span className="material-symbols-outlined text-white">share</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-white border border-black/10 px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] text-black text-[15px] leading-6">
                        {assistant.finalTextStreamed}
                      </div>
                      {assistant.completed && (
                        <div className="text-black/40 font-mono-sm text-[11px] uppercase tracking-widest">
                          Task completed in {formatDuration(assistant.totalTime)} · thinking{' '}
                          {formatDuration(assistant.thinkingTime)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#f9f9f9] rounded-2xl p-2 focus-within:ring-1 focus-within:ring-black/20 transition-all">
              <textarea
                ref={inputRef}
                className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-[15px] leading-6 text-black placeholder:text-black/40 min-h-[56px] max-h-32"
                placeholder={isStreaming ? 'Generation in progress... press Enter to stop' : 'Describe your vision...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isStreaming}
                    className="p-2 text-black/40 hover:text-black transition-colors hover:bg-black/5 rounded-lg disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                  <ModelSelectorPopup
                    selector={selector}
                    onChange={setSelector}
                    open={showSelector}
                    onToggle={() => setShowSelector((v) => !v)}
                    onClose={() => setShowSelector(false)}
                  />
                </div>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center gap-2 bg-error text-on-error px-4 py-1.5 rounded-xl hover:opacity-80 transition-all font-medium text-[14px]"
                  >
                    Stop
                    <span className="material-symbols-outlined text-[18px]">stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-xl hover:opacity-80 transition-all font-medium text-[14px] disabled:opacity-40"
                  >
                    Generate
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Item Context Menu */}
      {historyMenu && (
        <div
          className="fixed z-[100] bg-white border border-black/10 shadow-2xl rounded-lg py-2 min-w-[160px]"
          style={{ top: historyMenu.y, left: historyMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setRenameTarget(historyMenu.conversation)
              setHistoryMenu(null)
            }}
            className="w-full text-left px-4 py-2.5 font-body-md text-sm text-on-surface hover:bg-surface-container transition-colors"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(historyMenu.conversation)
              setHistoryMenu(null)
            }}
            className="w-full text-left px-4 py-2.5 font-body-md text-sm text-error hover:bg-error/5 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
          onClick={() => setRenameTarget(null)}
        >
          <div
            className="bg-white rounded-xl border border-black/10 shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-lg text-headline-lg text-primary mb-4">Rename conversation</h3>
            <input
              autoFocus
              type="text"
              defaultValue={renameTarget.title}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename(renameTarget, (e.target as HTMLInputElement).value)
                }
              }}
              className="w-full bg-surface-container p-4 rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="flex-1 py-3 border border-black/10 rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement)
                  confirmRename(renameTarget, input?.value || '')
                }}
                className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl border border-black/10 shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-lg text-headline-lg text-primary mb-2">Delete conversation?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              This action cannot be undone. The conversation &quot;{deleteTarget.title}&quot; will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 border border-black/10 rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteTarget)}
                className="flex-1 py-3 bg-error text-on-error rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
