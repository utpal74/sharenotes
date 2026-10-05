import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { effectiveNoteTitle, MAX_NOTE_BYTES, measureNoteBytes } from './note-size'
import './App.css'

type NoteSummary = { id: string; title: string; sizeBytes: number; version: number; updatedAt: string }
type Note = NoteSummary & { content: string }
type ShareResponse = { token: string; shareUrl: string }
type ApiError = { message?: string | string[]; error?: { message?: string } }

const API = 'http://localhost:3000/api/v1'
const userHeaders = { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...userHeaders, ...options.headers } })
    if (!response.ok) {
        const body = await response.json() as ApiError
        const message = body.message
        throw new Error(Array.isArray(message) ? message.join(', ') : message ?? body.error?.message ?? `Request failed (${response.status})`)
    }
    return response.status === 204 ? (undefined as T) : response.json()
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

function App() {
    const [notes, setNotes] = useState<NoteSummary[] | null>(null)
    const [listError, setListError] = useState('')
    const [selected, setSelected] = useState<Note | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [notice, setNotice] = useState('')
    const [noticeIsError, setNoticeIsError] = useState(false)
    const [shareLink, setShareLink] = useState('')
    const [shareToken, setShareToken] = useState('')
    const [shareCopied, setShareCopied] = useState(false)
    const selectionGeneration = useRef(0)
    const selectedNoteId = useRef<string | null>(null)
    const listRequestGeneration = useRef(0)

    const showNotice = (message: string, isError = false) => {
        setNotice(message)
        setNoticeIsError(isError)
    }

    const isCurrentContext = (generation: number, noteId: string | null) =>
        selectionGeneration.current === generation && selectedNoteId.current === noteId

    const clearShareState = () => {
        setShareLink('')
        setShareToken('')
        setShareCopied(false)
    }

    const loadNotes = async (failureMessage = 'Could not load notes.'): Promise<void> => {
        const requestGeneration = ++listRequestGeneration.current
        try {
            const result = await request<{ data: NoteSummary[] }>('/notes')
            if (requestGeneration !== listRequestGeneration.current) return
            setNotes(result.data)
            setListError('')
        } catch (error) {
            if (requestGeneration !== listRequestGeneration.current) return
            // List availability is workspace-scoped, not tied to the editor that saved.
            // Preserve the last loaded list and keep current share/editor notices intact.
            setListError(`${failureMessage} ${errorMessage(error, 'Please try again.')}`)
        }
    }

    useEffect(() => {
        void loadNotes()
        return () => { listRequestGeneration.current += 1 }
    }, [])

    const openNote = async (id: string) => {
        const generation = ++selectionGeneration.current
        selectedNoteId.current = id
        setSelected(null)
        setTitle('')
        setContent('')
        clearShareState()
        showNotice('')
        try {
            const note = await request<Note>(`/notes/${id}`)
            if (!isCurrentContext(generation, id)) return
            setSelected(note)
            setTitle(note.title)
            setContent(note.content)
        } catch (error) {
            if (isCurrentContext(generation, id)) showNotice(errorMessage(error, 'Could not open note'), true)
        }
    }

    const saveNote = async (event: FormEvent) => {
        event.preventDefault()
        const generation = selectionGeneration.current
        let contextNoteId = selected?.id ?? null
        if (!isCurrentContext(generation, contextNoteId)) return

        const effectiveTitle = effectiveNoteTitle(title, selected?.title)
        const sizeBytes = measureNoteBytes(effectiveTitle, content)
        if (sizeBytes > MAX_NOTE_BYTES) {
            showNotice(`This note's title and content exceed ${MAX_NOTE_BYTES.toLocaleString()} UTF-8 bytes. The server enforces the same limit.`, true)
            return
        }

        try {
            if (selected) {
                const updated = await request<Note>(`/notes/${selected.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ title, content, version: selected.version }),
                })
                if (isCurrentContext(generation, contextNoteId)) {
                    setSelected(updated)
                    showNotice('Saved just now')
                }
            } else {
                const created = await request<Note>('/notes', {
                    method: 'POST',
                    body: JSON.stringify({ title, content }),
                })
                if (isCurrentContext(generation, contextNoteId)) {
                    contextNoteId = created.id
                    selectedNoteId.current = created.id
                    setSelected(created)
                    showNotice('Note created')
                }
            }

            await loadNotes('The note was saved, but the note list could not be refreshed.')
        } catch (error) {
            if (isCurrentContext(generation, contextNoteId)) showNotice(errorMessage(error, 'Could not save note'), true)
        }
    }

    const createNew = () => {
        selectionGeneration.current += 1
        selectedNoteId.current = null
        setSelected(null)
        setTitle('')
        setContent('')
        clearShareState()
        showNotice('Draft ready')
    }

    const deleteNote = async () => {
        if (!selected || !window.confirm('Delete this note?')) return
        const noteId = selected.id
        const generation = selectionGeneration.current
        try {
            await request(`/notes/${noteId}`, { method: 'DELETE' })
            if (!isCurrentContext(generation, noteId)) return
            selectionGeneration.current += 1
            selectedNoteId.current = null
            setSelected(null)
            setTitle('')
            setContent('')
            clearShareState()
            showNotice('Note deleted')
            await loadNotes('The note was deleted, but the note list could not be refreshed.')
        } catch (error) {
            if (isCurrentContext(generation, noteId)) showNotice(errorMessage(error, 'Could not delete note'), true)
        }
    }

    const copyShareUrl = async (link: string, noteId: string, generation: number) => {
        try {
            await navigator.clipboard.writeText(link)
            if (!isCurrentContext(generation, noteId)) return
            setShareCopied(true)
            showNotice('Share link copied')
            window.setTimeout(() => {
                if (isCurrentContext(generation, noteId)) setShareCopied(false)
            }, 2600)
        } catch {
            if (isCurrentContext(generation, noteId)) {
                setShareCopied(false)
                showNotice('Share link is available below, but it was not copied. Select it or try Copy link again.', true)
            }
        }
    }

    const shareNote = async () => {
        if (!selected) return
        const noteId = selected.id
        const generation = selectionGeneration.current
        try {
            const result = await request<ShareResponse>(`/notes/${noteId}/share`, { method: 'POST' })
            if (!isCurrentContext(generation, noteId)) return
            const link = `${window.location.origin}${result.shareUrl}`
            setShareToken(result.token)
            setShareLink(link)
            setShareCopied(false)
            await copyShareUrl(link, noteId, generation)
        } catch (error) {
            if (isCurrentContext(generation, noteId)) showNotice(errorMessage(error, 'Could not create share link'), true)
        }
    }

    const revokeShare = async () => {
        if (!selected || !shareToken || !window.confirm('Revoke this share link?')) return
        const noteId = selected.id
        const token = shareToken
        const generation = selectionGeneration.current
        try {
            await request(`/notes/${noteId}/share/${token}`, { method: 'DELETE' })
            if (!isCurrentContext(generation, noteId)) return
            clearShareState()
            showNotice('Share link revoked. Previously copied links and content already viewed cannot be recalled.')
        } catch (error) {
            if (isCurrentContext(generation, noteId)) showNotice(errorMessage(error, 'Could not revoke share link'), true)
        }
    }

    if (window.location.pathname.startsWith('/shared/')) return <SharedNote token={window.location.pathname.split('/').pop() ?? ''} />

    const effectiveTitle = effectiveNoteTitle(title, selected?.title)
    const sizeBytes = measureNoteBytes(effectiveTitle, content)
    const isOversized = sizeBytes > MAX_NOTE_BYTES

    return (
        <main className="shell">
            <header className="topbar"><div className="brand"><span className="brand-mark">S</span><span>ShareNotes</span></div><div className="account"><span className="status-dot" /> Demo workspace <span className="avatar">DU</span></div></header>
            <div className="workspace">
                <aside className="sidebar"><div className="eyebrow">Your library</div><button className="new-note" onClick={createNew}><span>+</span> New note</button><div className="note-list">
                    {listError && <p role="alert">{listError}</p>}
                    {notes === null ? <p className="muted">{listError ? 'Notes unavailable.' : 'Loading notes...'}</p> : notes.length === 0 ? <p className="muted">Your first note is waiting.</p> : notes.map((note) => <button className={`note-item ${selected?.id === note.id ? 'active' : ''}`} key={note.id} onClick={() => void openNote(note.id)}><strong>{note.title}</strong><span>{new Date(note.updatedAt).toLocaleDateString()}</span></button>)}
                </div><div className="sidebar-foot"><span className="storage-icon">◈</span><span><strong>Local workspace</strong><small>Encrypted sync coming next</small></span></div></aside>
                <section className="editor-panel"><div className="editor-head"><div><span className="crumb">Notes / {selected ? 'Edit note' : 'New note'}</span><h1>{selected ? 'Edit your note' : 'Capture a thought'}</h1></div><div className="actions"><button className={`ghost share-button ${shareCopied ? 'copied' : ''}`} onClick={() => void shareNote()} disabled={!selected}><span className="share-icon">{shareCopied ? '✓' : '↗'}</span>{shareCopied ? 'Copied' : 'Share'}</button><button className="danger" onClick={() => void deleteNote()} disabled={!selected}>Delete</button></div></div>
                    {shareLink && <div className="share-preview is-visible" aria-label="Share link"><span className="preview-check" aria-hidden="true">{shareCopied ? '✓' : '↗'}</span><div className="preview-copy"><strong>{shareCopied ? 'Link copied to clipboard' : 'Share link ready'}</strong><input aria-label="Share URL" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} /></div><button type="button" className="ghost" onClick={() => void copyShareUrl(shareLink, selected?.id ?? '', selectionGeneration.current)}>Copy link</button><button type="button" className="danger" onClick={() => void revokeShare()}>Revoke link</button></div>}
                    <form className="note-form" onSubmit={(event) => void saveNote(event)}><input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" aria-label="Note title" /><div className="toolbar" aria-label="Editor toolbar"><button type="button"><strong>B</strong></button><button type="button"><em>I</em></button><button type="button">• List</button><span className="toolbar-rule" /><span className="format-label">Plain text</span></div><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Start writing something worth remembering..." aria-label="Note content" /><div className="size-feedback" role={isOversized ? 'alert' : 'status'} aria-live={isOversized ? 'assertive' : 'polite'}>Serialized title and content: {sizeBytes.toLocaleString()} / {MAX_NOTE_BYTES.toLocaleString()} UTF-8 bytes. Advisory only; the server validates this limit.{isOversized ? ' This note is over the limit.' : ''}</div><div className="form-foot"><span className="save-state" role={noticeIsError ? 'alert' : 'status'} aria-live={noticeIsError ? 'assertive' : 'polite'}>{notice || 'Private by default · changes stay in your workspace'}</span><button className="save" type="submit">{selected ? 'Save changes' : 'Save note'} <span>→</span></button></div></form>
                </section>
            </div>
        </main>
    )
}

function SharedNote({ token }: { token: string }) {
    const [note, setNote] = useState<Note | null>(null)
    const [error, setError] = useState('')
    useEffect(() => {
        let current = true
        fetch(`${API}/shared/${token}`).then(async (response) => {
            if (!current) return
            if (response.ok) setNote(await response.json())
            else setError('This note has been deleted or the link has been revoked.')
        }).catch(() => {
            if (current) setError('Shared note unavailable.')
        })
        return () => { current = false }
    }, [token])
    return <main className="shared-shell"><div className="shared-brand"><span className="brand-mark">S</span> ShareNotes <span>Read-only view</span></div>{note ? <article className="shared-note"><span className="crumb">Shared note</span><h1>{note.title}</h1><p className="shared-date">Updated {new Date(note.updatedAt).toLocaleString()}</p><div className="shared-content">{note.content || 'This note is empty.'}</div></article> : <div className="shared-empty"><span>○</span><h1>{error || 'Loading note...'}</h1><p>Check the link and try again.</p></div>}</main>
}

export default App
