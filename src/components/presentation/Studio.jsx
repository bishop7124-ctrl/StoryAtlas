import { useEffect, useRef } from 'react'
import YOWLogo from '../brand/YOWLogo'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export function StudioFrame({
  projectTitle,
  projectType,
  rooms,
  activeRoomId,
  onOpenRoom,
  themeTray,
  primaryAction,
  account,
  contextRail,
  contextRailOpen = true,
  onToggleContextRail,
  topBar,
  utilityContent,
  children,
}) {
  return (
    <div className={cx('studio-shell', topBar && 'has-top-bar', !contextRail && 'has-no-context', contextRail && !contextRailOpen && 'is-context-collapsed')}>
      {topBar && <div className="studio-top-bar">{topBar}</div>}

      <header className="studio-spine" aria-label="Studio navigation">
        <div className="studio-brand" title={`${projectTitle} - ${projectType}`}>
          <div className="studio-brand-mark"><YOWLogo /></div>
          <div className="studio-brand-text">
            <span className="studio-kicker">Your Own World</span>
            <span className="studio-brand-sep">·</span>
            <h1>{projectTitle}</h1>
          </div>
          {primaryAction && (
            <div className="studio-primary-action">
              {primaryAction}
            </div>
          )}
        </div>

        <nav className="studio-room-list" aria-label="Workspace">
          {rooms.map(room => (
            <button
              key={room.id}
              type="button"
              onClick={() => onOpenRoom(room)}
              className={cx('studio-room', activeRoomId === room.id && 'is-current')}
              aria-current={activeRoomId === room.id ? true : undefined}
            >
              <span className="studio-room-tab">{room.icon}</span>
              <span className="studio-room-copy">
                <strong>{room.label}</strong>
                <small>{room.description}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="studio-utility">
          {themeTray && (
            <div className="studio-material-tray">
              {themeTray}
            </div>
          )}
          {utilityContent}
        </div>

        {account && <div className="studio-account-slot">{account}</div>}
      </header>

      {children}

      {contextRail && (
        <aside className={cx('studio-context-rail', !contextRailOpen && 'is-collapsed')}>
          <button
            type="button"
            className="context-rail-toggle"
            onClick={onToggleContextRail}
            aria-label={contextRailOpen ? 'Collapse quick actions' : 'Expand quick actions'}
            title={contextRailOpen ? 'Collapse' : 'Expand'}
          >
            {contextRailOpen ? '›' : '‹'}
          </button>
          {contextRailOpen && contextRail}
        </aside>
      )}
    </div>
  )
}

export function StudioWorkspace({
  tabs,
  roomId = 'studio',
  footer,
  children,
}) {
  return (
    <main className={cx('studio-workspace', `studio-workspace-${roomId}`, tabs && 'has-tabs')}>
      {tabs && (
        <nav className="studio-section-tabs" aria-label="Room sections">
          {tabs}
        </nav>
      )}

      <section className="studio-surface">
        {children}
      </section>

      {footer && (
        <div className="studio-workspace-footer">
          {footer}
        </div>
      )}
    </main>
  )
}

export function StudioTab({ active, children, ...props }) {
  return (
    <button type="button" className={cx('studio-tab', active && 'is-current')} aria-current={active ? true : undefined} {...props}>
      {children}
    </button>
  )
}

export function StudioButton({ tone = 'secondary', size = 'md', className = '', children, ...props }) {
  return (
    <button className={cx('studio-button', `studio-button-${tone}`, `studio-button-${size}`, className)} {...props}>
      {children}
    </button>
  )
}

export function StudioBoard({ children, className = '', variant = 'desk' }) {
  return <div className={cx('studio-board', `studio-board-${variant}`, className)}>{children}</div>
}

export function StudioSplit({ children, variant = 'notebook' }) {
  return <div className={cx('studio-split', `studio-split-${variant}`)}>{children}</div>
}

export function StudioIndex({ eyebrow, title, tools, children, variant = 'index' }) {
  return (
    <aside className={cx('studio-index', `studio-index-${variant}`)}>
      <div className="studio-index-head">
        <div>
          <p className="studio-kicker">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {tools && <div className="studio-index-tools">{tools}</div>}
      </div>
      <div className="studio-index-list">{children}</div>
    </aside>
  )
}

export function StudioRecord({ active, children, className = '', ...props }) {
  return (
    <button type="button" className={cx('studio-record', active && 'is-current', className)} aria-current={active ? true : undefined} {...props}>
      {children}
    </button>
  )
}

export function StudioDetail({ children, className = '', variant = 'paper' }) {
  return <article className={cx('studio-detail', `studio-detail-${variant}`, className)}>{children}</article>
}

export function StudioMetric({ label, value, detail, variant = 'note' }) {
  return (
    <div className={cx('studio-metric', `studio-metric-${variant}`)}>
      <p className="studio-kicker">{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  )
}

export function StudioEmpty({ title, body, action, variant = 'page' }) {
  return (
    <div className={cx('studio-empty', `studio-empty-${variant}`)}>
      <p className="studio-kicker">Blank surface</p>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action && <div className="studio-empty-action">{action}</div>}
    </div>
  )
}

export function StudioSheet({ title, eyebrow = 'Editor', onClose, children, narrow = false, centered = false }) {
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current?.focus() }, [])

  return (
    <div className={cx('studio-sheet-backdrop', centered && 'is-centered')} onClick={onClose}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-sheet-heading"
        tabIndex={-1}
        className={cx('studio-sheet', narrow && 'is-narrow', centered && 'is-centered')}
        onClick={e => e.stopPropagation()}
      >
        <header>
          <div>
            <p className="studio-kicker">{eyebrow}</p>
            <h2 id="studio-sheet-heading">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="studio-sheet-body">{children}</div>
      </section>
    </div>
  )
}

export function StudioPageHeader({ eyebrow, title, meta, actions, children }) {
  return (
    <header className="studio-page-header">
      <div className="min-w-0">
        <p className="studio-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {meta && <p>{meta}</p>}
        {children}
      </div>
      {actions && <div className="studio-page-actions">{actions}</div>}
    </header>
  )
}

export function StudioNote({ children, className = '' }) {
  return <div className={cx('studio-note', className)}>{children}</div>
}

export function StudioLedger({ children, className = '' }) {
  return <div className={cx('studio-ledger', className)}>{children}</div>
}
