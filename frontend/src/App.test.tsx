import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { effectiveNoteTitle, MAX_NOTE_BYTES, measureNoteBytes } from './note-size'

type NoteData = {
    id: string
    title: string
    content: string
    sizeBytes: number
    version: number
    updatedAt: string
}

const API = 'http://localhost:3000/api/v1'
const notes: NoteData[] = [
    { id: 'note-a', title: 'Note A', content: 'Saved A', sizeBytes: 15, version: 1, updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'note-b', title: 'Note B', content: 'Saved B', sizeBytes: 15, version: 1, updatedAt: '2026-01-02T00:00:00.000Z' },
]

const fetchMock = vi.fn<typeof fetch>()
const clipboardWriteText = vi.fn<(text: string) => Promise<void>>()

function response(body: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response
}

function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

function apiPath(input: RequestInfo | URL): string {
    return String(input).replace(API, '')
}

async function selectNote(user: ReturnType<typeof userEvent.setup>, noteTitle = 'Note A') {
    await user.click(await screen.findByRole('button', { name: new RegExp(noteTitle) }))
    await screen.findByDisplayValue(noteTitle)
}

function setupUser() {
    const user = userEvent.setup({ writeToClipboard: false })
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: clipboardWriteText },
    })
    return user
}

beforeEach(() => {
    fetchMock.mockReset()
    clipboardWriteText.mockReset()
    clipboardWriteText.mockResolvedValue(undefined)
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: clipboardWriteText },
    })
    window.history.replaceState(null, '', '/')
    fetchMock.mockResolvedValue(response({ data: [] }))
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('ShareNotes owner and public interactions', () => {
    it('creates, opens, and saves a note using the demo owner identity', async () => {
        const user = setupUser()
        let currentNote: NoteData = { ...notes[0], title: 'Created', content: 'First draft' }
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes' && init?.method === 'POST') return response(currentNote, 201)
            if (path === `/notes/${currentNote.id}` && init?.method === 'PATCH') {
                const update = JSON.parse(String(init.body)) as { title: string; content: string; version: number }
                currentNote = { ...currentNote, ...update, version: currentNote.version + 1 }
                return response(currentNote)
            }
            if (path === '/notes') return response({ data: [currentNote] })
            if (path === `/notes/${currentNote.id}`) return response(currentNote)
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await user.click(screen.getByRole('button', { name: /New note/ }))
        await user.type(screen.getByRole('textbox', { name: 'Note title' }), 'Created')
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), 'First draft')
        await user.click(screen.getByRole('button', { name: /Save note/ }))
        expect(screen.getByText(/Serialized title and content/).getAttribute('role')).toBe('status')
        expect(await screen.findByText('Note created')).toBeTruthy()

        await selectNote(user, 'Created')
        await user.clear(screen.getByRole('textbox', { name: 'Note content' }))
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), 'Saved update')
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        expect(await screen.findByText('Saved just now')).toBeTruthy()

        const ownerCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/notes'))
        expect(ownerCalls.length).toBeGreaterThan(0)
        for (const [, init] of ownerCalls) {
            expect(init?.headers).toMatchObject({ 'x-user-id': 'demo-user' })
        }
        expect(currentNote.content).toBe('Saved update')
    })

    it('keeps public reading unauthenticated and read-only', async () => {
        window.history.replaceState(null, '', '/shared/public-token')
        fetchMock.mockResolvedValue(response({ ...notes[0], title: 'Public title', content: 'Latest saved text' }))

        render(<App />)
        expect(await screen.findByRole('heading', { name: 'Public title' })).toBeTruthy()
        expect(screen.getByText('Latest saved text')).toBeTruthy()
        expect(screen.queryByRole('button', { name: /Save|Delete|Share|Revoke/ })).toBeNull()

        const publicCall = fetchMock.mock.calls[0]
        expect(String(publicCall[0])).toBe(`${API}/shared/public-token`)
        expect(publicCall[1]).toBeUndefined()
    })

    it('keeps unsaved edits private and serves the latest saved content publicly', async () => {
        const user = setupUser()
        let latestSaved: NoteData = {
            ...notes[0],
            title: 'Saved title',
            content: 'Latest saved text',
        }
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return response({ data: [latestSaved] })
            if (path === '/notes/note-a' && init?.method === 'PATCH') {
                const update = JSON.parse(String(init.body)) as {
                    title: string
                    content: string
                    version: number
                }
                latestSaved = {
                    ...latestSaved,
                    ...update,
                    version: latestSaved.version + 1,
                }
                return response(latestSaved)
            }
            if (path === '/notes/note-a') return response(latestSaved)
            if (path === '/shared/public-token') return response(latestSaved)
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user, 'Saved title')
        await user.clear(screen.getByRole('textbox', { name: 'Note title' }))
        await user.type(screen.getByRole('textbox', { name: 'Note title' }), 'Unsaved draft title')
        await user.clear(screen.getByRole('textbox', { name: 'Note content' }))
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), 'Unsaved draft text')

        expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
        expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)

        window.history.replaceState(null, '', '/shared/public-token')
        const publicView = render(<App />)
        const publicPage = within(publicView.container)
        expect(await publicPage.findByRole('heading', { name: 'Saved title' })).toBeTruthy()
        expect(publicPage.getByText('Latest saved text')).toBeTruthy()
        expect(publicPage.queryByRole('heading', { name: 'Unsaved draft title' })).toBeNull()
        expect(publicPage.queryByText('Unsaved draft text')).toBeNull()
        const publicCall = fetchMock.mock.calls.find(([url]) =>
            apiPath(url) === '/shared/public-token',
        )
        expect(publicCall?.[1]).toBeUndefined()

        window.history.replaceState(null, '', '/')
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        expect(await screen.findByText('Saved just now')).toBeTruthy()
        expect(latestSaved).toMatchObject({
            title: 'Unsaved draft title',
            content: 'Unsaved draft text',
        })

        publicView.unmount()
        window.history.replaceState(null, '', '/shared/public-token')
        const latestPublicView = render(<App />)
        const latestPublicPage = within(latestPublicView.container)
        expect(await latestPublicPage.findByRole('heading', { name: 'Unsaved draft title' })).toBeTruthy()
        expect(latestPublicPage.getByText('Unsaved draft text')).toBeTruthy()
    })

    it('shows the normalized UTF-8 size contract with advisory feedback', async () => {
        expect(MAX_NOTE_BYTES).toBe(31_457_280)
        const multibyteContent = 'é'.repeat(Math.floor((MAX_NOTE_BYTES - measureNoteBytes('Boundary', '')) / 2))
        const finalContent = `${multibyteContent}${'a'.repeat(MAX_NOTE_BYTES - measureNoteBytes('Boundary', multibyteContent))}`
        expect(effectiveNoteTitle('  ', '')).toBe('Untitled note')
        expect(effectiveNoteTitle('  ', 'Existing title')).toBe('Existing title')
        expect(measureNoteBytes(effectiveNoteTitle(' Boundary '), finalContent)).toBe(MAX_NOTE_BYTES)
        expect(measureNoteBytes('Boundary', `${finalContent}a`)).toBe(MAX_NOTE_BYTES + 1)

        render(<App />)
        const feedback = screen.getByText(/Advisory only/)
        expect(feedback.getAttribute('role')).toBe('status')
        expect(feedback.textContent).toContain('31,457,280 UTF-8 bytes')
    })

    it('announces and blocks an oversized draft using the normalized serialized size', async () => {
        const user = setupUser()
        const contentBytes = MAX_NOTE_BYTES - measureNoteBytes('Untitled note', '')
        const oversizedContent = 'é'.repeat(Math.floor(contentBytes / 2)) + 'a'.repeat(contentBytes % 2 + 1)
        fetchMock.mockResolvedValue(response({ data: [] }))

        render(<App />)
        fireEvent.change(screen.getByRole('textbox', { name: 'Note content' }), {
            target: { value: oversizedContent },
        })
        expect(screen.getByText(/This note is over the limit/).getAttribute('role')).toBe('alert')

        await user.click(screen.getByRole('button', { name: /Save note/ }))
        expect(screen.getByText(/exceed 31,457,280 UTF-8 bytes/).getAttribute('role')).toBe('alert')
        expect(fetchMock.mock.calls.some(([url, init]) => apiPath(url) === '/notes' && init?.method === 'POST')).toBe(false)
    })

    it('announces stale-save and share-creation failures without success feedback', async () => {
        const user = setupUser()
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return response({ data: [notes[0]] })
            if (path === '/notes/note-a' && init?.method === 'PATCH') return response({ message: 'This note changed since it was opened.' }, 409)
            if (path === '/notes/note-a/share' && init?.method === 'POST') return response({ message: 'Share creation failed' }, 500)
            if (path === '/notes/note-a') return response(notes[0])
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        expect((await screen.findByRole('alert')).textContent).toContain('changed since it was opened')
        expect(screen.queryByText('Saved just now')).toBeNull()

        await user.click(screen.getByRole('button', { name: /Share/ }))
        expect((await screen.findByRole('alert')).textContent).toContain('Share creation failed')
        expect(screen.queryByRole('textbox', { name: 'Share URL' })).toBeNull()
        expect(screen.queryByText('Share link copied')).toBeNull()
    })

    it('retains a share URL when copying fails, confirms revoke, and allows a fresh link', async () => {
        const user = setupUser()
        let shareCount = 0
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return response({ data: [notes[0]] })
            if (path === '/notes/note-a') return response(notes[0])
            if (path === '/notes/note-a/share' && init?.method === 'POST') {
                shareCount += 1
                const token = `token-${shareCount}`
                return response({ token, shareUrl: `/shared/${token}` }, 201)
            }
            if (path === '/notes/note-a/share/token-1' && init?.method === 'DELETE') return response(undefined, 204)
            throw new Error(`Unexpected request: ${path}`)
        })
        clipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'))
        expect(navigator.clipboard.writeText).toBe(clipboardWriteText)
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Share/ }))
        const shareUrl = `${window.location.origin}/shared/token-1`
        expect((await screen.findByRole('textbox', { name: 'Share URL' }) as HTMLInputElement).value).toBe(shareUrl)
        expect((await screen.findByRole('alert')).textContent).toContain('it was not copied')

        await user.click(screen.getByRole('button', { name: 'Copy link' }))
        expect(await screen.findByText('Share link copied')).toBeTruthy()
        expect(clipboardWriteText).toHaveBeenLastCalledWith(shareUrl)

        await user.click(screen.getByRole('button', { name: 'Revoke link' }))
        expect(confirm).toHaveBeenCalledWith('Revoke this share link?')
        expect(fetchMock.mock.calls.some(([url, init]) => apiPath(url) === '/notes/note-a/share/token-1' && init?.method === 'DELETE')).toBe(false)

        confirm.mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: 'Revoke link' }))
        expect(await screen.findByText(/Share link revoked/)).toBeTruthy()
        expect(screen.queryByRole('textbox', { name: 'Share URL' })).toBeNull()

        await user.click(screen.getByRole('button', { name: /Share/ }))
        expect((await screen.findByRole('textbox', { name: 'Share URL' }) as HTMLInputElement).value).toBe(`${window.location.origin}/shared/token-2`)
    })

    it('retains share context and reports a revoke failure without success feedback', async () => {
        const user = setupUser()
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return response({ data: [notes[0]] })
            if (path === '/notes/note-a') return response(notes[0])
            if (path === '/notes/note-a/share' && init?.method === 'POST') return response({ token: 'retry-token', shareUrl: '/shared/retry-token' }, 201)
            if (path === '/notes/note-a/share/retry-token' && init?.method === 'DELETE') return response({ message: 'revoke failed' }, 500)
            throw new Error(`Unexpected request: ${path}`)
        })
        vi.spyOn(window, 'confirm').mockReturnValue(true)

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Share/ }))
        const url = await screen.findByRole('textbox', { name: 'Share URL' })
        await user.click(screen.getByRole('button', { name: 'Revoke link' }))

        expect((await screen.findByRole('alert')).textContent).toContain('revoke failed')
        expect(screen.getByRole('textbox', { name: 'Share URL' })).toBe(url)
        expect(screen.queryByText(/Share link revoked/)).toBeNull()
    })

    it('requires delete confirmation and shows delete failures', async () => {
        const user = setupUser()
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return response({ data: [notes[0]] })
            if (path === '/notes/note-a' && init?.method === 'DELETE') return response({ message: 'delete failed' }, 500)
            if (path === '/notes/note-a') return response(notes[0])
            throw new Error(`Unexpected request: ${path}`)
        })
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect(confirm).toHaveBeenCalledWith('Delete this note?')
        expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)

        confirm.mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect((await screen.findByRole('alert')).textContent).toContain('delete failed')
    })
})

describe('notes-list refresh failures', () => {
    it('reports an initial list failure without implying an empty library', async () => {
        fetchMock.mockRejectedValue(new Error('List offline'))
        render(<App />)

        expect((await screen.findByRole('alert')).textContent).toContain('Could not load notes. List offline')
        expect(screen.getByText('Notes unavailable.')).toBeTruthy()
        expect(screen.queryByText('Your first note is waiting.')).toBeNull()
        expect(screen.queryByText('Loading notes...')).toBeNull()
    })

    it('preserves the list on a normal saved-note refresh failure and clears the error after a successful refresh', async () => {
        const user = setupUser()
        let listCalls = 0
        fetchMock.mockImplementation(async (input, init) => {
            const path = apiPath(input)
            if (path === '/notes') {
                listCalls += 1
                if (listCalls === 2) return response({ message: 'List offline' }, 503)
                return response({ data: notes })
            }
            if (path === '/notes/note-a' && init?.method === 'PATCH') return response({ ...notes[0], version: 2 })
            if (path === '/notes/note-a') return response(notes[0])
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        expect((await screen.findByRole('alert')).textContent).toContain('The note was saved, but the note list could not be refreshed. List offline')
        expect(screen.getByText('Saved just now').getAttribute('role')).toBe('status')
        expect(screen.getByRole('button', { name: /Note A/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /Note B/ })).toBeTruthy()
        expect(screen.getByDisplayValue('Saved A')).toBeTruthy()
        expect(screen.queryByText('Your first note is waiting.')).toBeNull()

        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
        expect(listCalls).toBe(3)
    })

    it.each(['create', 'update'] as const)('reports a late successful %s followed by refresh failure without changing the navigated editor or share notice', async (operation) => {
        const user = setupUser()
        const lateSave = deferred<Response>()
        const refresh = deferred<Response>()
        const saved = { ...notes[0], title: 'Background saved', content: 'Background content', version: 2 }
        let listCalls = 0
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes' && init?.method === 'POST') return lateSave.promise
            if (path === '/notes') {
                listCalls += 1
                return listCalls === 1 ? Promise.resolve(response({ data: notes })) : refresh.promise
            }
            if (path === '/notes/note-a' && init?.method === 'PATCH') return lateSave.promise
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            if (path === '/notes/note-b/share') {
                return Promise.resolve(operation === 'create'
                    ? response({ token: 'current-token', shareUrl: '/shared/current-token' }, 201)
                    : response({ message: 'Current share failed' }, 500))
            }
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        if (operation === 'update') await selectNote(user)
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), 'Pending content')
        await user.click(screen.getByRole('button', { name: operation === 'create' ? /Save note/ : /Save changes/ }))
        await selectNote(user, 'Note B')
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), ' unsaved edits')
        await user.click(screen.getByRole('button', { name: /Share/ }))
        const shareNotice = operation === 'create' ? 'Share link copied' : 'Current share failed'
        await screen.findByText(shareNotice)

        await act(async () => { lateSave.resolve(response(saved, operation === 'create' ? 201 : 200)) })
        expect(listCalls).toBe(2)
        await act(async () => { refresh.reject(new Error('Refresh offline')) })

        const error = screen.getByText('The note was saved, but the note list could not be refreshed. Refresh offline')
        expect(error.getAttribute('role')).toBe('alert')
        expect(screen.getByRole('button', { name: /Note A/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /Note B/ })).toBeTruthy()
        expect(screen.getByDisplayValue('Note B')).toBeTruthy()
        expect(screen.getByDisplayValue('Saved B unsaved edits')).toBeTruthy()
        expect(screen.getByText(shareNotice).getAttribute('role')).toBe(operation === 'create' ? 'status' : 'alert')
        if (operation === 'create') {
            expect((screen.getByRole('textbox', { name: 'Share URL' }) as HTMLInputElement).value).toBe(`${window.location.origin}/shared/current-token`)
            expect(screen.getByRole('button', { name: /Copied/ })).toBeTruthy()
        }
        expect(screen.queryByText('Saved just now')).toBeNull()
        expect(screen.queryByText('Note created')).toBeNull()
        expect(screen.queryByText('Your first note is waiting.')).toBeNull()
    })

    it.each([
        ['success', 'success'],
        ['failure', 'success'],
        ['success', 'failure'],
        ['failure', 'failure'],
    ])('ignores an older refresh %s after the newest refresh %s', async (olderOutcome, newestOutcome) => {
        const user = setupUser()
        const olderList = deferred<Response>()
        const newestList = deferred<Response>()
        let listCalls = 0
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes') {
                listCalls += 1
                if (listCalls === 1) return Promise.resolve(response({ data: notes }))
                return listCalls === 2 ? olderList.promise : newestList.promise
            }
            if (path === '/notes/note-a' && init?.method === 'PATCH') return Promise.resolve(response({ ...notes[0], version: 2 }))
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        await waitFor(() => expect(listCalls).toBe(2))
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        await waitFor(() => expect(listCalls).toBe(3))
        await act(async () => {
            if (newestOutcome === 'success') newestList.resolve(response({ data: [{ ...notes[0], title: 'Newest entry' }, notes[1]] }))
            else newestList.reject(new Error('Newest refresh failed'))
        })
        await act(async () => {
            if (olderOutcome === 'success') olderList.resolve(response({ data: [] }))
            else olderList.reject(new Error('Older refresh failed'))
        })

        if (newestOutcome === 'success') {
            expect(screen.getByRole('button', { name: /Newest entry/ })).toBeTruthy()
            expect(screen.queryByRole('alert')).toBeNull()
        } else {
            expect(screen.getByRole('alert').textContent).toContain('The note was saved, but the note list could not be refreshed. Newest refresh failed')
            expect(screen.getByRole('button', { name: /Note A/ })).toBeTruthy()
        }
        expect(screen.getByRole('button', { name: /Note B/ })).toBeTruthy()
        expect(screen.getByDisplayValue('Note A')).toBeTruthy()
        expect(screen.getByDisplayValue('Saved A')).toBeTruthy()
        expect(screen.queryByText(/Older refresh failed/)).toBeNull()
        expect(screen.queryByText('Your first note is waiting.')).toBeNull()
    })
})

describe('stale note operation protection', () => {
    it('does not let a late note open replace the currently selected note', async () => {
        const user = setupUser()
        const lateOpen = deferred<Response>()
        fetchMock.mockImplementation((input) => {
            const path = apiPath(input)
            if (path === '/notes') return Promise.resolve(response({ data: notes }))
            if (path === '/notes/note-a') return lateOpen.promise
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await user.click(await screen.findByRole('button', { name: /Note A/ }))
        await user.click(screen.getByRole('button', { name: /Note B/ }))
        expect(await screen.findByDisplayValue('Note B')).toBeTruthy()
        lateOpen.resolve(response(notes[0]))
        await waitFor(() => expect(screen.getByDisplayValue('Note B')).toBeTruthy())
        expect(screen.queryByDisplayValue('Note A')).toBeNull()
    })

    it('does not initiate a clipboard write when share creation finishes after switching notes', async () => {
        const user = setupUser()
        const lateShare = deferred<Response>()
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return Promise.resolve(response({ data: notes }))
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            if (path === '/notes/note-a/share' && init?.method === 'POST') return lateShare.promise
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Share/ }))
        await user.click(screen.getByRole('button', { name: /Note B/ }))
        await screen.findByDisplayValue('Note B')
        lateShare.resolve(response({ token: 'old-token', shareUrl: '/shared/old-token' }, 201))

        await waitFor(() => expect(clipboardWriteText).not.toHaveBeenCalled())
        expect(screen.queryByRole('textbox', { name: 'Share URL' })).toBeNull()
    })

    it('does not restore a copied state after switching notes during a clipboard write', async () => {
        const user = setupUser()
        const clipboardResult = deferred<void>()
        clipboardWriteText.mockReturnValue(clipboardResult.promise)
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return Promise.resolve(response({ data: notes }))
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            if (path === '/notes/note-a/share' && init?.method === 'POST') {
                return Promise.resolve(response({ token: 'old-token', shareUrl: '/shared/old-token' }, 201))
            }
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Share/ }))
        await screen.findByRole('textbox', { name: 'Share URL' })
        await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledOnce())
        await user.click(screen.getByRole('button', { name: /Note B/ }))
        await screen.findByDisplayValue('Note B')
        clipboardResult.resolve()

        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Share URL' })).toBeNull())
        expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull()
    })

    it('does not apply a pending save result to a different selected note', async () => {
        const user = setupUser()
        const lateSave = deferred<Response>()
        const updatedNoteA = { ...notes[0], title: 'Updated A', version: 2 }
        let listCalls = 0
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes') {
                listCalls += 1
                return Promise.resolve(response({ data: listCalls === 1 ? notes : [updatedNoteA, notes[1]] }))
            }
            if (path === '/notes/note-a' && init?.method === 'PATCH') return lateSave.promise
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            if (path === '/notes/note-b/share' && init?.method === 'POST') {
                return Promise.resolve(response({ message: 'Current note share failed' }, 500))
            }
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await selectNote(user)
        await user.clear(screen.getByRole('textbox', { name: 'Note title' }))
        await user.type(screen.getByRole('textbox', { name: 'Note title' }), 'Updated A')
        await user.clear(screen.getByRole('textbox', { name: 'Note content' }))
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), 'pending update')
        await user.click(screen.getByRole('button', { name: /Save changes/ }))
        await user.click(screen.getByRole('button', { name: /Note B/ }))
        await screen.findByDisplayValue('Note B')
        await user.click(screen.getByRole('button', { name: /Share/ }))
        expect((await screen.findByRole('alert')).textContent).toContain('Current note share failed')
        lateSave.resolve(response({ ...updatedNoteA, content: 'pending update' }))

        expect(await screen.findByRole('button', { name: /Updated A/ })).toBeTruthy()
        expect(screen.getByDisplayValue('Note B')).toBeTruthy()
        expect(screen.getByDisplayValue('Saved B')).toBeTruthy()
        expect(screen.getByRole('alert').textContent).toContain('Current note share failed')
        expect(screen.queryByText('Saved just now')).toBeNull()
    })

    it('adds a successfully created note to the sidebar after navigating away without changing the current editor or notice', async () => {
        const user = setupUser()
        const lateCreate = deferred<Response>()
        const createdNote = {
            id: 'note-created',
            title: 'Late created note',
            content: 'Created in the background',
            sizeBytes: 42,
            version: 1,
            updatedAt: '2026-01-03T00:00:00.000Z',
        }
        let listCalls = 0
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes' && init?.method === 'POST') return lateCreate.promise
            if (path === '/notes') {
                listCalls += 1
                return Promise.resolve(response({ data: listCalls === 1 ? notes : [...notes, createdNote] }))
            }
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-a/share' && init?.method === 'POST') {
                return Promise.resolve(response({ message: 'Current note share failed' }, 500))
            }
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await user.click(screen.getByRole('button', { name: /New note/ }))
        await user.type(screen.getByRole('textbox', { name: 'Note title' }), createdNote.title)
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), createdNote.content)
        await user.click(screen.getByRole('button', { name: /Save note/ }))
        await user.click(await screen.findByRole('button', { name: /Note A/ }))
        await screen.findByDisplayValue('Note A')
        await user.click(screen.getByRole('button', { name: /Share/ }))
        expect((await screen.findByRole('alert')).textContent).toContain('Current note share failed')

        lateCreate.resolve(response(createdNote, 201))

        expect(await screen.findByRole('button', { name: /Late created note/ })).toBeTruthy()
        expect(screen.getByDisplayValue('Note A')).toBeTruthy()
        expect(screen.getByDisplayValue('Saved A')).toBeTruthy()
        expect(screen.getByRole('alert').textContent).toContain('Current note share failed')
        expect(screen.queryByText('Note created')).toBeNull()
    })

    it('ignores an older notes-list response when a later refresh has completed', async () => {
        const user = setupUser()
        const olderList = deferred<Response>()
        const createdNote = {
            id: 'note-created',
            title: 'Fresh list entry',
            content: 'Created note',
            sizeBytes: 30,
            version: 1,
            updatedAt: '2026-01-03T00:00:00.000Z',
        }
        let listCalls = 0
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes' && init?.method === 'POST') return Promise.resolve(response(createdNote, 201))
            if (path === '/notes') {
                listCalls += 1
                return listCalls === 1
                    ? olderList.promise
                    : Promise.resolve(response({ data: [createdNote] }))
            }
            throw new Error(`Unexpected request: ${path}`)
        })

        render(<App />)
        await user.type(screen.getByRole('textbox', { name: 'Note title' }), createdNote.title)
        await user.type(screen.getByRole('textbox', { name: 'Note content' }), createdNote.content)
        await user.click(screen.getByRole('button', { name: /Save note/ }))
        expect(await screen.findByRole('button', { name: /Fresh list entry/ })).toBeTruthy()

        olderList.resolve(response({ data: notes }))

        expect(await screen.findByRole('button', { name: /Fresh list entry/ })).toBeTruthy()
        expect(screen.queryByRole('button', { name: /Note A/ })).toBeNull()
    })

    it('does not apply a late revoke result after switching notes', async () => {
        const user = setupUser()
        const lateRevoke = deferred<Response>()
        fetchMock.mockImplementation((input, init) => {
            const path = apiPath(input)
            if (path === '/notes') return Promise.resolve(response({ data: notes }))
            if (path === '/notes/note-a') return Promise.resolve(response(notes[0]))
            if (path === '/notes/note-b') return Promise.resolve(response(notes[1]))
            if (path === '/notes/note-a/share' && init?.method === 'POST') return Promise.resolve(response({ token: 'old-token', shareUrl: '/shared/old-token' }, 201))
            if (path === '/notes/note-a/share/old-token' && init?.method === 'DELETE') return lateRevoke.promise
            throw new Error(`Unexpected request: ${path}`)
        })
        vi.spyOn(window, 'confirm').mockReturnValue(true)

        render(<App />)
        await selectNote(user)
        await user.click(screen.getByRole('button', { name: /Share/ }))
        await screen.findByRole('textbox', { name: 'Share URL' })
        await user.click(screen.getByRole('button', { name: 'Revoke link' }))
        await user.click(screen.getByRole('button', { name: /Note B/ }))
        await screen.findByDisplayValue('Note B')
        lateRevoke.resolve(response(undefined, 204))

        await waitFor(() => expect(screen.queryByText(/Share link revoked/)).toBeNull())
        expect(screen.queryByRole('textbox', { name: 'Share URL' })).toBeNull()
    })
})
