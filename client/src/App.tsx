import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
  ApiError,
  api,
  clearToken,
  getToken,
  saveToken,
  type Answer,
  type Family,
  type FamilyMember,
  type Memory,
  type MemoryInput,
  type MemoryType,
  type User,
} from './api'
import './App.css'

type Page = 'overview' | 'memories' | 'people' | 'ask'
type Overlay =
  | { kind: 'memory'; memory?: Memory }
  | { kind: 'member'; member?: FamilyMember }
  | { kind: 'family'; family?: Family }
  | null

const memoryTypes: MemoryType[] = ['story', 'recipe', 'note', 'document', 'photo']
const typeLabels: Record<MemoryType, string> = {
  story: 'Story',
  recipe: 'Recipe',
  note: 'Note',
  document: 'Document',
  photo: 'Photo',
}
const typePluralLabels: Record<MemoryType, string> = {
  story: 'Stories',
  recipe: 'Recipes',
  note: 'Notes',
  document: 'Documents',
  photo: 'Photos',
}

const iconPaths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6',
  spark: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z',
  plus: 'M12 5v14M5 12h14',
  search: 'm20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  chevron: 'm9 18 6-6-6-6',
  down: 'm7 10 5 5 5-5',
  arrow: 'M7 17 17 7M7 7h10v10',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
  clock: 'M12 8v4l2.5 2.5M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  wand: 'm15 4 5 5M3 21l12.5-12.5M7 4v4M5 6h4M19 14v4M17 16h4',
  close: 'M18 6 6 18M6 6l12 12',
  trash: 'M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z',
  bookOpen: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  pin: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0ZM12 10h.01',
  leaf: 'M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 9-8 9-16ZM4 21c2-5 6-8 11-11',
} as const

type IconName = keyof typeof iconPaths

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  disabled = false,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  )
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    const dismissOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    optionRefs.current[activeIndex]?.focus()

    return () => document.removeEventListener('pointerdown', dismissOutside)
  }, [activeIndex, open])

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const moveActive = (index: number) => {
    const nextIndex = (index + options.length) % options.length
    setActiveIndex(nextIndex)
    optionRefs.current[nextIndex]?.focus()
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    if (!open) {
      setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
      setOpen(true)
      return
    }
    moveActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1))
  }

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(index + (event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      moveActive(event.key === 'Home' ? 0 : options.length - 1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  return (
    <div className={`dropdown ${className}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        disabled={disabled}
        onClick={() => {
          if (open) {
            close(false)
          } else {
            setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
            setOpen(true)
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label ?? value}</span>
        <Icon name="down" size={14} />
      </button>
      {open && (
        <div className="dropdown-menu" id={`${id}-options`} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              className={`dropdown-option ${option.value === value ? 'dropdown-option-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              onClick={() => {
                onChange(option.value)
                close()
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="dropdown-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value))
}

function initials(value: string) {
  return value
    .split(/[@\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function App() {
  const [ready, setReady] = useState(() => !getToken())
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [families, setFamilies] = useState<Family[]>([])
  const [activeFamilyId, setActiveFamilyId] = useState('')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [page, setPage] = useState<Page>('overview')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [conversation, setConversation] = useState<Array<Answer & { question: string }>>([])
  const [isAsking, setIsAsking] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeFamily = families.find((family) => family.id === activeFamilyId) ?? null
  const getMemoryMemberIds = (memory: Memory) =>
    memory.memberIds ?? (memory.memberId ? [memory.memberId] : [])

  const handleApiFailure = (reason: unknown) => {
    if (reason instanceof ApiError && reason.status === 401) {
      clearToken()
      setUser(null)
      setFamilies([])
      setActiveFamilyId('')
      setMembers([])
      setMemories([])
      setConversation([])
      setError('Your session has expired. Please sign in again.')
      return
    }
    setError(errorMessage(reason))
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return

    let current = true
    api.me()
      .then((currentUser) => {
        if (current) setUser(currentUser)
      })
      .catch((reason: unknown) => {
        if (current) handleApiFailure(reason)
      })
      .finally(() => {
        if (current) setReady(true)
      })

    return () => {
      current = false
    }
  }, [])

  useEffect(() => {
    if (!user) return

    let current = true
    api.families()
      .then((items) => {
        if (!current) return
        setFamilies(items)
        setActiveFamilyId((current) =>
          items.some((family) => family.id === current) ? current : (items[0]?.id ?? ''),
        )
      })
      .catch((reason: unknown) => {
        if (current) handleApiFailure(reason)
      })

    return () => {
      current = false
    }
  }, [user])

  useEffect(() => {
    if (!activeFamilyId) return

    let current = true
    Promise.all([api.members(activeFamilyId), api.memories(activeFamilyId)])
      .then(([familyMembers, familyMemories]) => {
        if (!current) return
        setMembers(familyMembers)
        setMemories(familyMemories)
      })
      .catch((reason: unknown) => {
        if (current) handleApiFailure(reason)
      })
    return () => {
      current = false
    }
  }, [activeFamilyId])

  const filteredMemories = useMemo(() => {
    const term = search.trim().toLowerCase()
    return memories.filter((memory) => {
      const matchesType = typeFilter === 'all' || memory.type === typeFilter
      const matchesTerm =
        !term ||
        memory.title.toLowerCase().includes(term) ||
        memory.content.toLowerCase().includes(term)
      return matchesType && matchesTerm
    })
  }, [memories, search, typeFilter])

  const signOut = () => {
    clearToken()
    setUser(null)
    setFamilies([])
    setActiveFamilyId('')
    setMembers([])
    setMemories([])
    setConversation([])
    setError('')
  }

  const handleAuth = async (email: string, password: string) => {
    setBusy(true)
    setError('')
    try {
      const result = authMode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password)
      saveToken(result.token)
      setUser(result.user)
      setReady(true)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const handleFamilySave = async (name: string, family?: Family) => {
    setBusy(true)
    setError('')
    try {
      if (family) {
        const updated = await api.renameFamily(family.id, name)
        setFamilies((items) => items.map((item) => item.id === updated.id ? updated : item))
      } else {
        const created = await api.createFamily(name)
        setFamilies((items) => [created, ...items])
        setMembers([])
        setMemories([])
        setActiveFamilyId(created.id)
        setConversation([])
      }
      setOverlay(null)
    } catch (reason) {
      handleApiFailure(reason)
    } finally {
      setBusy(false)
    }
  }

  const handleMemorySave = async (input: MemoryInput, memory?: Memory) => {
    if (!activeFamilyId) return
    setBusy(true)
    setError('')
    try {
      if (memory) {
        const updated = await api.updateMemory(memory.id, input)
        setMemories((items) => items.map((item) => item.id === updated.id ? updated : item))
      } else {
        const created = await api.createMemory(activeFamilyId, input)
        setMemories((items) => [created, ...items])
      }
      setOverlay(null)
    } catch (reason) {
      handleApiFailure(reason)
    } finally {
      setBusy(false)
    }
  }

  const handleMemoryDelete = async (memory: Memory) => {
    if (!window.confirm(`Delete "${memory.title}"? This can't be undone.`)) return
    setError('')
    try {
      await api.deleteMemory(memory.id)
      setMemories((items) => items.filter((item) => item.id !== memory.id))
    } catch (reason) {
      handleApiFailure(reason)
    }
  }

  const handleMemberSave = async (name: string, relation: string, member?: FamilyMember) => {
    if (!activeFamilyId) return
    setBusy(true)
    setError('')
    try {
      if (member) {
        const updated = await api.updateMember(activeFamilyId, member.id, name, relation)
        setMembers((items) => items.map((item) => item.id === updated.id ? updated : item).sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        const created = await api.createMember(activeFamilyId, name, relation)
        setMembers((items) => [...items, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setOverlay(null)
    } catch (reason) {
      handleApiFailure(reason)
    } finally {
      setBusy(false)
    }
  }

  const handleMemberDelete = async (member: FamilyMember) => {
    if (!activeFamilyId || !window.confirm(`Remove ${member.name} from this family?`)) return
    setError('')
    try {
      await api.deleteMember(activeFamilyId, member.id)
      setMembers((items) => items.filter((item) => item.id !== member.id))
      setMemories((items) => items.map((item) => ({
          ...item,
          memberIds: getMemoryMemberIds(item).filter((memberId) => memberId !== member.id),
          memberId: item.memberId === member.id ? null : item.memberId,
        })))
    } catch (reason) {
      handleApiFailure(reason)
    }
  }

  const handleAsk = async (question: string): Promise<boolean> => {
    if (!activeFamilyId) return false
    setIsAsking(true)
    setError('')
    try {
      const answer = await api.ask(activeFamilyId, question)
      setConversation((items) => [...items, { ...answer, question }])
      return true
    } catch (reason) {
      handleApiFailure(reason)
      return false
    } finally {
      setIsAsking(false)
    }
  }

  if (!ready) {
    return <div className="startup"><span className="brand-mark"><Icon name="leaf" /></span><span>Opening your vault…</span></div>
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={(mode) => { setAuthMode(mode); setError('') }}
        onSubmit={handleAuth}
        busy={busy}
        error={error}
      />
    )
  }

  const navItems: Array<{ id: Page; label: string; icon: IconName }> = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'memories', label: 'Memories', icon: 'book' },
    { id: 'people', label: 'Our people', icon: 'users' },
    { id: 'ask', label: 'Ask your vault', icon: 'spark' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('overview') }}>
          <span className="brand-mark"><Icon name="leaf" size={20} /></span>
          <span className="brand-name">memory<span>vault</span></span>
        </a>

        <div className="family-switcher">
          <span className="section-label">YOUR SPACE</span>
          {activeFamily ? (
            <button
              className="family-select"
              onClick={() => setOverlay({ kind: 'family', family: activeFamily })}
              title="Rename this family"
            >
              <span className="family-symbol"><Icon name="heart" size={16} /></span>
              <span className="family-select-copy"><strong>{activeFamily.name}</strong><small>Family vault</small></span>
              <Icon name="edit" size={15} />
            </button>
          ) : (
            <div className="family-empty">Create a family space to get started.</div>
          )}
          {families.length > 1 && (
            <div className="family-switcher-select">
              <span>Switch space</span>
              <Dropdown
                className="family-dropdown"
                value={activeFamilyId}
                ariaLabel="Switch family space"
                options={families.map((family) => ({ value: family.id, label: family.name }))}
                onChange={(familyId) => {
                  setMembers([])
                  setMemories([])
                  setConversation([])
                  setActiveFamilyId(familyId)
                }}
              />
            </div>
          )}
          <button className="add-family" onClick={() => setOverlay({ kind: 'family' })}>
            <Icon name="plus" size={15} /> Add a family
          </button>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <span className="section-label">LIBRARY</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'nav-active' : ''}`}
              onClick={() => { setPage(item.id); setMobileNavOpen(false) }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === 'memories' && <span className="nav-count">{memories.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="vault-note">
            <span className="note-spark"><Icon name="heart" size={15} /></span>
            <strong>Little things, kept close.</strong>
            <p>Your family's stories are safe here, one memory at a time.</p>
          </div>
          <div className="user-row">
            <span className="avatar avatar-user">{initials(user.email)}</span>
            <span className="user-copy"><strong>{user.email.split('@')[0]}</strong><small>{user.email}</small></span>
            <button className="icon-button signout" aria-label="Sign out" title="Sign out" onClick={signOut}>
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setMobileNavOpen((open) => !open)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumbs"><span>MemoryVault</span><Icon name="chevron" size={14} /><strong>{navItems.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-right">
            <span className="private-pill"><span /> Private family space</span>
            {activeFamily && (
              <button className="top-add-button" onClick={() => setOverlay({ kind: 'memory' })}>
                <Icon name="plus" size={16} /><span>Save a memory</span>
              </button>
            )}
          </div>
        </header>

        <div className="page-wrap">
          <AnimatePresence>
            {error && (
              <motion.div className="error-banner" role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <span>{error}</span>
                <button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}><Icon name="close" size={16} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {!activeFamily ? (
            <WelcomePage onCreate={() => setOverlay({ kind: 'family' })} />
          ) : (
            <>
              {page === 'overview' && (
                <OverviewPage
                  family={activeFamily}
                  memories={memories}
                  members={members}
                  onCreateMemory={() => setOverlay({ kind: 'memory' })}
                  onNavigate={setPage}
                  onEdit={(memory) => setOverlay({ kind: 'memory', memory })}
                />
              )}
              {page === 'memories' && (
                <MemoriesPage
                  memories={filteredMemories}
                  members={members}
                  search={search}
                  onSearch={setSearch}
                  typeFilter={typeFilter}
                  onTypeFilter={setTypeFilter}
                  onCreate={() => setOverlay({ kind: 'memory' })}
                  onEdit={(memory) => setOverlay({ kind: 'memory', memory })}
                  onDelete={handleMemoryDelete}
                />
              )}
              {page === 'people' && (
                <PeoplePage members={members} memories={memories} onAdd={() => setOverlay({ kind: 'member' })} onEdit={(member) => setOverlay({ kind: 'member', member })} onDelete={handleMemberDelete} />
              )}
              {page === 'ask' && (
                <AskPage family={activeFamily} memories={memories} conversation={conversation} isAsking={isAsking} onAsk={handleAsk} />
              )}
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {overlay?.kind === 'memory' && (
          <MemoryModal
            key={overlay.memory?.id ?? 'new-memory'}
            memory={overlay.memory}
            members={members}
            busy={busy}
            error={error}
            onClose={() => setOverlay(null)}
            onSubmit={handleMemorySave}
            onDownload={async (memory) => {
              try {
                const file = await api.downloadAttachment(memory.id)
                const url = URL.createObjectURL(file)
                const link = document.createElement('a')
                link.href = url
                link.download = memory.attachment?.fileName ?? memory.title
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.setTimeout(() => URL.revokeObjectURL(url), 1000)
              } catch (reason) {
                handleApiFailure(reason)
              }
            }}
          />
        )}
        {overlay?.kind === 'member' && (
          <MemberModal member={overlay.member} busy={busy} onClose={() => setOverlay(null)} onSubmit={handleMemberSave} />
        )}
        {overlay?.kind === 'family' && (
          <FamilyModal
            family={overlay.family}
            busy={busy}
            onClose={() => setOverlay(null)}
            onSubmit={handleFamilySave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AuthScreen({
  mode,
  onModeChange,
  onSubmit,
  busy,
  error,
}: {
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
  onSubmit: (email: string, password: string) => Promise<void>
  busy: boolean
  error: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit(email.trim(), password)
  }

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <a className="brand auth-brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><Icon name="leaf" size={20} /></span>
          <span className="brand-name">memory<span>vault</span></span>
        </a>
        <div className="auth-story-copy">
          <span className="eyebrow"><Icon name="heart" size={15} /> A little place for everything</span>
          <h1>Some things are too good to <em>forget.</em></h1>
          <p>Keep the stories, recipes, and little everyday moments that make your family yours.</p>
        </div>
        <div className="memory-quote">
          <span className="quote-mark">“</span>
          <p>Grandma's Sunday sauce. Dad's terrible jokes. The way we all fit around one table.</p>
          <span className="quote-caption">The moments that make a family</span>
        </div>
        <div className="auth-decoration decoration-one" />
        <div className="auth-decoration decoration-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow auth-mobile-eyebrow"><Icon name="heart" size={15} /> Your family's private space</span>
          <h2>{mode === 'login' ? 'Welcome back' : 'Make room for memories'}</h2>
          <p className="auth-intro">{mode === 'login' ? 'Your memories are right where you left them.' : 'Create your account and start your family vault.'}</p>
          <form className="auth-form" onSubmit={submit}>
            <label className="field-label" htmlFor="email">Email address</label>
            <input id="email" className="text-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" className="text-input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} />
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>
              {busy ? 'One moment…' : mode === 'login' ? 'Open my vault' : 'Create my account'}
              {!busy && <Icon name="arrow" size={16} />}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? 'New to MemoryVault?' : 'Already have an account?'}{' '}
            <button onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="auth-footnote"><Icon name="heart" size={13} /> Just for your family. Always.</p>
        </div>
      </section>
    </main>
  )
}

function WelcomePage({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.section className="welcome-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="welcome-icon"><Icon name="heart" size={24} /></span>
      <span className="eyebrow">A home for your family's stories</span>
      <h1>Start with the people<br />who feel like home.</h1>
      <p>Create your first family vault. Add the recipes, stories, and small moments you want to keep close.</p>
      <button className="primary-button" onClick={onCreate}><Icon name="plus" size={17} /> Create your family vault</button>
      <div className="welcome-foot"><Icon name="pin" size={15} /> Your memories stay private to your account.</div>
    </motion.section>
  )
}

function OverviewPage({
  family,
  memories,
  members,
  onCreateMemory,
  onNavigate,
  onEdit,
}: {
  family: Family
  memories: Memory[]
  members: FamilyMember[]
  onCreateMemory: () => void
  onNavigate: (page: Page) => void
  onEdit: (memory: Memory) => void
}) {
  const recent = memories.slice(0, 3)
  const recipeCount = memories.filter((memory) => memory.type === 'recipe').length

  return (
    <motion.section className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="welcome-heading">
        <div>
          <span className="eyebrow"><Icon name="heart" size={14} /> YOUR FAMILY VAULT</span>
          <h1>Good to see you here.</h1>
          <p>Every memory you keep makes <strong>{family.name}</strong> feel a little closer.</p>
        </div>
        <button className="primary-button" onClick={onCreateMemory}><Icon name="plus" size={17} /> Save a memory</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-large">
          <span className="stat-icon memory-stat"><Icon name="book" size={18} /></span>
          <span className="stat-label">Memories kept</span>
          <strong className="stat-number">{memories.length}</strong>
          <span className="stat-foot">{memories.length ? 'A growing collection of moments' : 'Your story starts with one'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon people-stat"><Icon name="users" size={18} /></span>
          <span className="stat-label">People in your circle</span>
          <strong className="stat-number">{members.length}</strong>
          <span className="stat-foot">The ones who make it home</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon recipe-stat"><Icon name="heart" size={18} /></span>
          <span className="stat-label">Family recipes</span>
          <strong className="stat-number">{recipeCount}</strong>
          <span className="stat-foot">Made with love, saved for later</span>
        </div>
      </div>

      <div className="section-heading">
        <div><span className="eyebrow">FRESH FROM YOUR VAULT</span><h2>Recently remembered</h2></div>
        <button className="text-button" onClick={() => onNavigate('memories')}>See all memories <Icon name="chevron" size={15} /></button>
      </div>

      {recent.length > 0 ? (
        <div className="recent-grid">
          {recent.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} members={members} index={index} onClick={() => onEdit(memory)} />
          ))}
        </div>
      ) : (
        <div className="empty-state empty-recent">
          <div className="empty-illustration"><span><Icon name="bookOpen" size={23} /></span><i /><b /></div>
          <h3>Every family's story starts somewhere.</h3>
          <p>Save a recipe, a story, or a tiny detail you never want to lose.</p>
          <button className="secondary-button" onClick={onCreateMemory}><Icon name="plus" size={15} /> Add your first memory</button>
        </div>
      )}

      <div className="gentle-reminder"><span><Icon name="spark" size={18} /></span><p><strong>A gentle reminder</strong> — You don't have to capture it all. Just the things that matter to you.</p></div>
    </motion.section>
  )
}

function MemoriesPage({
  memories,
  members,
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  onCreate,
  onEdit,
  onDelete,
}: {
  memories: Memory[]
  members: FamilyMember[]
  search: string
  onSearch: (value: string) => void
  typeFilter: MemoryType | 'all'
  onTypeFilter: (value: MemoryType | 'all') => void
  onCreate: () => void
  onEdit: (memory: Memory) => void
  onDelete: (memory: Memory) => void
}) {
  return (
    <motion.section className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="welcome-heading">
        <div><span className="eyebrow"><Icon name="book" size={14} /> THE FAMILY ARCHIVE</span><h1>All the good things.</h1><p>A little collection of the moments, recipes, and stories worth keeping.</p></div>
        <button className="primary-button" onClick={onCreate}><Icon name="plus" size={17} /> Save a memory</button>
      </div>
      <div className="memory-toolbar">
        <label className="search-box"><Icon name="search" size={17} /><input aria-label="Search memories" placeholder="Find a memory…" value={search} onChange={(event) => onSearch(event.target.value)} />{search && <button aria-label="Clear search" onClick={() => onSearch('')}><Icon name="close" size={15} /></button>}</label>
        <div className="filter-select"><span>Show</span><Dropdown
          className="filter-dropdown"
          ariaLabel="Filter memories by type"
          value={typeFilter}
          options={[
            { value: 'all', label: 'Everything' },
            ...memoryTypes.map((type) => ({ value: type, label: typePluralLabels[type] })),
          ]}
          onChange={(value) => onTypeFilter(value as MemoryType | 'all')}
        /></div>
      </div>
      {memories.length ? (
        <div className="memory-grid">
          {memories.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} members={members} index={index} onClick={() => onEdit(memory)} onDelete={() => onDelete(memory)} />
          ))}
        </div>
      ) : (
        <div className="empty-state memories-empty">
          <div className="empty-illustration"><span><Icon name={search || typeFilter !== 'all' ? 'search' : 'bookOpen'} size={23} /></span><i /><b /></div>
          <h3>{search || typeFilter !== 'all' ? 'Nothing tucked away here.' : 'Your memory shelf is waiting.'}</h3>
          <p>{search || typeFilter !== 'all' ? 'Try a different search or pick another type.' : 'Save a story, recipe, or little moment to get started.'}</p>
          {!search && typeFilter === 'all' && <button className="secondary-button" onClick={onCreate}><Icon name="plus" size={15} /> Save your first memory</button>}
        </div>
      )}
      {memories.length > 0 && <p className="collection-count">Showing {memories.length} {memories.length === 1 ? 'memory' : 'memories'} from your family vault</p>}
    </motion.section>
  )
}

function MemoryCard({
  memory,
  members,
  index,
  onClick,
  onDelete,
}: {
  memory: Memory
  members: FamilyMember[]
  index: number
  onClick: () => void
  onDelete?: () => void
}) {
  const linkedMembers = members.filter((item) =>
    (memory.memberIds ?? (memory.memberId ? [memory.memberId] : [])).includes(item.id),
  )

  return (
    <motion.article className={`memory-card card-${memory.type}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.045, 0.18) }}>
      <button className="memory-card-main" onClick={onClick} aria-label={`Open ${memory.title}`}>
        <div className={`memory-art art-${memory.type}`} aria-hidden="true">
          <span className="art-stamp"><Icon name={memory.type === 'recipe' ? 'heart' : memory.type === 'story' ? 'bookOpen' : memory.type === 'photo' ? 'spark' : 'book'} size={19} /></span>
          <span className="art-line art-line-one" /><span className="art-line art-line-two" /><span className="art-line art-line-three" />
          <span className="art-type">{typeLabels[memory.type]}</span>
        </div>
        <div className="memory-card-copy">
          <div className="memory-meta"><span className={`type-dot type-${memory.type}`} />{typeLabels[memory.type]}<span className="meta-divider">·</span>{dateLabel(memory.createdAt)}</div>
          <h3>{memory.title}</h3>
          <p>{memory.content || (memory.attachment ? `Attached: ${memory.attachment.fileName}` : '')}</p>
          <div className="memory-card-footer">
            <span>
              {memory.isUserAssociated || linkedMembers.length > 0 ? (
                <>
                  {memory.isUserAssociated && <span className="tiny-avatar tiny-avatar-user" title="Me">M</span>}
                  {linkedMembers.slice(0, 2).map((member) => <span className="tiny-avatar" title={member.name} key={member.id}>{initials(member.name)}</span>)}
                  {[
                    ...(memory.isUserAssociated ? ['Me'] : []),
                    ...linkedMembers.map((member) => member.name),
                  ].join(', ')}
                </>
              ) : (
                <><Icon name="heart" size={13} /> From the family</>
              )}
            </span>
            <Icon name="arrow" size={15} />
          </div>
        </div>
      </button>
      {onDelete && <button className="card-delete icon-button" aria-label={`Delete ${memory.title}`} title="Delete memory" onClick={(event) => { event.stopPropagation(); onDelete() }}><Icon name="trash" size={15} /></button>}
    </motion.article>
  )
}

function PeoplePage({
  members,
  memories,
  onAdd,
  onEdit,
  onDelete,
}: {
  members: FamilyMember[]
  memories: Memory[]
  onAdd: () => void
  onEdit: (member: FamilyMember) => void
  onDelete: (member: FamilyMember) => void
}) {
  return (
    <motion.section className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="welcome-heading">
        <div><span className="eyebrow"><Icon name="users" size={14} /> THE PEOPLE WHO MAKE IT HOME</span><h1>Our people.</h1><p>Keep your favorite memories close to the people they're about.</p></div>
        <button className="primary-button" onClick={onAdd}><Icon name="plus" size={17} /> Add someone</button>
      </div>
      {members.length ? (
        <div className="people-grid">
          {members.map((member, index) => {
            const count = memories.filter((memory) =>
              (memory.memberIds ?? (memory.memberId ? [memory.memberId] : [])).includes(member.id),
            ).length
            return (
              <motion.article className="person-card" key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <div className={`person-avatar person-color-${index % 5}`}>{initials(member.name)}</div>
                <div className="person-details"><h3>{member.name}</h3><p>{member.relation || 'Family member'}</p></div>
                <div className="person-memories"><Icon name="heart" size={14} /><span>{count} {count === 1 ? 'memory' : 'memories'}</span></div>
                <div className="person-actions">
                  <button className="person-action icon-button" title={`Edit ${member.name}`} aria-label={`Edit ${member.name}`} onClick={() => onEdit(member)}><Icon name="edit" size={14} /></button>
                  <button className="person-action icon-button" title={`Remove ${member.name}`} aria-label={`Remove ${member.name}`} onClick={() => onDelete(member)}><Icon name="trash" size={14} /></button>
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state people-empty">
          <div className="people-empty-art"><span className="person-orb orb-a">Y</span><span className="person-orb orb-b">O</span><span className="person-orb orb-c">U</span></div>
          <h3>Every good story has its people.</h3><p>Add the people who make your family's memories what they are.</p>
          <button className="secondary-button" onClick={onAdd}><Icon name="plus" size={15} /> Add your first person</button>
        </div>
      )}
      <div className="people-tip"><Icon name="heart" size={17} /><span><strong>Memories belong to everyone.</strong> Connect a memory with someone as you save it, and it will be easy to find together later.</span></div>
    </motion.section>
  )
}

function AskPage({
  family,
  memories,
  conversation,
  isAsking,
  onAsk,
}: {
  family: Family
  memories: Memory[]
  conversation: Array<Answer & { question: string }>
  isAsking: boolean
  onAsk: (question: string) => Promise<boolean>
}) {
  const [question, setQuestion] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = question.trim()
    if (trimmed.length < 2 || isAsking) return
    void onAsk(trimmed).then((success) => { if (success) setQuestion('') })
  }
  const prompts = ['What was Grandma’s pasta sauce recipe?', 'Tell me a story about our family.', 'What do we know about summer holidays?']

  return (
    <motion.section className="page-content ask-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ask-intro">
        <span className="ask-orb"><Icon name="spark" size={24} /></span>
        <span className="eyebrow">A LITTLE HELP FROM YOUR MEMORIES</span>
        <h1>Ask your family vault.</h1>
        <p>Ask a question and find the answer in the stories you've saved for {family.name}.</p>
        <span className="ask-local-note"><Icon name="heart" size={13} /> Answers come from your saved memories</span>
      </div>

      {conversation.length === 0 && memories.length > 0 && (
        <div className="prompt-suggestions"><span className="section-label">A FEW IDEAS</span><div>{prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)}>{prompt}<Icon name="arrow" size={14} /></button>)}</div></div>
      )}

      {conversation.length > 0 && (
        <div className="conversation-list">
          {conversation.map((turn, index) => (
            <div className="conversation-turn" key={`${index}-${turn.question}`}>
              <div className="question-bubble"><span className="question-avatar">{initials(family.name)}</span><p>{turn.question}</p></div>
              <div className="answer-block"><span className="answer-avatar"><Icon name="spark" size={16} /></span><div className="answer-copy"><p>{turn.answer}</p>{turn.sources.length > 0 && <div className="answer-sources"><span>FOUND IN YOUR MEMORIES</span>{turn.sources.map((source) => <div key={source.memoryId}><Icon name="bookOpen" size={14} /> {source.title}</div>)}</div>}</div></div>
            </div>
          ))}
        </div>
      )}

      {memories.length === 0 && <div className="ask-empty"><Icon name="bookOpen" size={21} /><p>Your vault is still waiting for its first memory. Once you save a few, you can ask questions and find them here.</p></div>}
      <form className="ask-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="ask-question">Ask your family vault a question</label>
        <input id="ask-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about a recipe, a story, a moment…" minLength={2} maxLength={1000} disabled={!memories.length || isAsking} />
        <button type="submit" className="ask-submit" disabled={!memories.length || question.trim().length < 2 || isAsking} aria-label="Send question">{isAsking ? <span className="mini-spinner" /> : <Icon name="arrow" size={18} />}</button>
      </form>
      <p className="ask-footnote">A thoughtful answer takes a moment. Your saved memories are the only source.</p>
    </motion.section>
  )
}

function ModalFrame({ children, onClose, title, description }: { children: ReactNode; onClose: () => void; title: string; description: string }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
      <motion.section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.18 }}>
        <div className="modal-heading"><div><span className="eyebrow">A LITTLE SOMETHING TO KEEP</span><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        {children}
      </motion.section>
    </motion.div>
  )
}

function MemoryModal({
  memory,
  members,
  busy,
  error,
  onClose,
  onSubmit,
  onDownload,
}: {
  memory?: Memory
  members: FamilyMember[]
  busy: boolean
  error: string
  onClose: () => void
  onSubmit: (input: MemoryInput, memory?: Memory) => Promise<void>
  onDownload: (memory: Memory) => Promise<void>
}) {
  const [title, setTitle] = useState(memory?.title ?? '')
  const [content, setContent] = useState(memory?.content ?? '')
  const [type, setType] = useState<MemoryType>(memory?.type ?? 'story')
  const [memberIds, setMemberIds] = useState(
    memory?.memberIds ?? (memory?.memberId ? [memory.memberId] : []),
  )
  const [isUserAssociated, setIsUserAssociated] = useState(memory?.isUserAssociated ?? false)
  const [wholeFamily, setWholeFamily] = useState(
    memberIds.length === 0 && !(memory?.isUserAssociated ?? false),
  )
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const isFileMemory = type === 'document' || type === 'photo'
  const savedAttachmentId = memory?.attachment ? memory.id : undefined
  const savedAttachmentType = memory?.attachment?.contentType
  const currentAttachmentMatchesType =
    memory?.attachment &&
    (type === 'document'
      ? memory.attachment.contentType === 'application/pdf'
      : type === 'photo' && memory.attachment.contentType.startsWith('image/'))
  const hasAttachment = Boolean(attachment || currentAttachmentMatchesType)

  useEffect(() => {
    let current = true
    let previewUrl = ''

    if (type !== 'photo') {
      return
    }

    if (!attachment && savedAttachmentId && savedAttachmentType?.startsWith('image/')) {
      api.downloadAttachment(savedAttachmentId)
        .then((file) => {
          if (!current) return
          previewUrl = URL.createObjectURL(file)
          setAttachmentPreview(previewUrl)
        })
        .catch((reason: unknown) => {
          if (current) setAttachmentError(errorMessage(reason))
        })
    }

    return () => {
      current = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [attachment, savedAttachmentId, savedAttachmentType, type])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!wholeFamily && memberIds.length === 0 && !isUserAssociated) return
    void onSubmit(
      {
        title: title.trim(),
        content: content.trim(),
        type,
        memberIds,
        isUserAssociated,
        attachment,
      },
      memory,
    )
  }

  return (
    <ModalFrame onClose={onClose} title={memory ? 'A memory, kept close.' : 'Save a little something.'} description={memory ? 'Give this memory a quick edit.' : 'A recipe, a story, or a tiny detail you never want to lose.'}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field-label" htmlFor="memory-title">Give it a name</label>
        <input id="memory-title" className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Grandma's Sunday sauce" maxLength={160} required autoFocus />
        <label className="field-label" htmlFor="memory-type">Memory type</label>
        <Dropdown
          className="memory-type-dropdown"
          ariaLabel="Memory type"
          value={type}
          options={memoryTypes.map((value) => ({ value, label: typeLabels[value] }))}
          onChange={(value) => {
            setType(value as MemoryType)
            setAttachment(null)
            setAttachmentPreview('')
            setAttachmentError('')
          }}
          disabled={busy}
        />
        {isFileMemory ? (
          <div className="form-field">
            <label className="field-label" htmlFor="memory-attachment">
              {type === 'photo' ? 'Choose a photo' : 'Choose a PDF document'}
            </label>
            <input
              className="file-picker-input"
              id="memory-attachment"
              type="file"
              accept={type === 'photo' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'}
              onChange={(event) => { setAttachment(event.target.files?.[0] ?? null); setAttachmentPreview(''); setAttachmentError('') }}
              disabled={busy}
            />
            <div className="file-picker">
              <label className="file-picker-button" htmlFor="memory-attachment">
                {attachment ? 'Choose another file' : 'Browse files'}
              </label>
              <span className={`file-picker-name ${attachment ? 'file-picker-name-selected' : ''}`}>
                {attachment?.name ?? 'No file selected'}
              </span>
            </div>
            <div className="input-hint">PDF for documents; JPEG, PNG, or WebP for photos. Maximum 15 MB.</div>
            {attachment && <div className="attachment-current">Selected: {attachment.name}</div>}
            {type === 'photo' && attachmentPreview && (
              <img className="attachment-preview" src={attachmentPreview} alt="Selected family memory" />
            )}
            {attachmentError && <p className="auth-error" role="alert">{attachmentError}</p>}
            {!attachment && currentAttachmentMatchesType && memory && (
              <div className="attachment-current">
                Current file: {memory.attachment?.fileName}
                <button type="button" className="text-button" onClick={() => void onDownload(memory)}>
                  Download
                </button>
              </div>
            )}
            <label className="field-label" htmlFor="memory-content">
              Add a note <span className="optional-label">OPTIONAL</span>
            </label>
            <textarea id="memory-content" className="text-input text-area" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add a caption or details to remember…" maxLength={20000} rows={4} disabled={busy} />
            <div className="input-hint">{content.length.toLocaleString()} / 20,000 characters</div>
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="memory-content">Tell us about it</label>
            <textarea id="memory-content" className="text-input text-area" value={content} onChange={(event) => setContent(event.target.value)} placeholder={type === 'recipe' ? 'Ingredients, steps, and the little secret…' : 'Write it down just how you remember it…'} maxLength={20000} required rows={6} disabled={busy} />
            <div className="input-hint">{content.length.toLocaleString()} / 20,000 characters</div>
          </>
        )}
        <div className="form-row">
          <fieldset className="member-picker">
            <legend className="field-label">Connected to</legend>
            <label className="member-checkbox">
              <input
                type="checkbox"
                checked={wholeFamily}
                onChange={(event) => {
                  setWholeFamily(event.target.checked)
                  if (event.target.checked) {
                    setMemberIds([])
                    setIsUserAssociated(false)
                  }
                }}
                disabled={busy}
              />
              The whole family
            </label>
            <label className="member-checkbox">
              <input
                type="checkbox"
                checked={isUserAssociated}
                onChange={(event) => {
                  setIsUserAssociated(event.target.checked)
                  if (event.target.checked) setWholeFamily(false)
                  else if (memberIds.length === 0) setWholeFamily(true)
                }}
                disabled={busy}
              />
              Me
            </label>
            {members.length > 0 ? (
              <div className="member-checkbox-list">
                {members.map((member) => (
                  <label className="member-checkbox" key={member.id}>
                    <input
                      type="checkbox"
                      checked={memberIds.includes(member.id)}
                      onChange={(event) => {
                        const selected = event.target.checked
                          ? [...memberIds, member.id]
                          : memberIds.filter((id) => id !== member.id)
                        setMemberIds(selected)
                        setWholeFamily(selected.length === 0 && !isUserAssociated)
                      }}
                      disabled={busy}
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="input-hint">Add people to your family to connect them to memories.</p>
            )}
            {!wholeFamily && memberIds.length === 0 && !isUserAssociated && (
              <p className="input-hint">Choose the whole family or at least one person.</p>
            )}
          </fieldset>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" type="submit" disabled={busy || !title.trim() || (!isFileMemory && !content.trim()) || (isFileMemory && !hasAttachment) || (!wholeFamily && memberIds.length === 0 && !isUserAssociated)}>{busy ? 'Saving…' : memory ? 'Save changes' : 'Keep this memory'} {!busy && <Icon name="heart" size={15} />}</button></div>
      </form>
    </ModalFrame>
  )
}

function MemberModal({ member, busy, onClose, onSubmit }: { member?: FamilyMember; busy: boolean; onClose: () => void; onSubmit: (name: string, relation: string, member?: FamilyMember) => Promise<void> }) {
  const [name, setName] = useState(member?.name ?? '')
  const [relation, setRelation] = useState(member?.relation ?? '')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit(name.trim(), relation.trim(), member)
  }
  return (
    <ModalFrame onClose={onClose} title={member ? 'Edit someone special.' : 'Add someone special.'} description={member ? 'Update how this person is remembered in your family space.' : 'Give your family memories a few familiar faces.'}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field-label" htmlFor="member-name">Their name</label><input id="member-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Auntie May" maxLength={100} required autoFocus />
        <label className="field-label" htmlFor="member-relation">How they're part of your family <span className="optional-label">OPTIONAL</span></label><input id="member-relation" className="text-input" value={relation} onChange={(event) => setRelation(event.target.value)} placeholder="Grandmother, cousin, chosen family…" maxLength={80} />
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : member ? 'Save changes' : 'Add to our people'} <Icon name="heart" size={15} /></button></div>
      </form>
    </ModalFrame>
  )
}

function FamilyModal({ family, busy, onClose, onSubmit }: { family?: Family; busy: boolean; onClose: () => void; onSubmit: (name: string, family?: Family) => Promise<void> }) {
  const [name, setName] = useState(family?.name ?? '')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit(name.trim(), family)
  }
  return (
    <ModalFrame onClose={onClose} title={family ? 'Name your family space.' : 'Start a family vault.'} description={family ? 'A name that feels like home.' : 'Choose a name for the memories you’ll keep together.'}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field-label" htmlFor="family-name">Family space name</label><input id="family-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="The Parkers" maxLength={100} required autoFocus />
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : family ? 'Save name' : 'Create our space'} <Icon name="heart" size={15} /></button></div>
      </form>
    </ModalFrame>
  )
}

export default App
