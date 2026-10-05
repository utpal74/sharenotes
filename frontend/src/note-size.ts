export const MAX_NOTE_BYTES = 31_457_280

export function effectiveNoteTitle(title: string, existingTitle?: string): string {
    return title.trim() || existingTitle || 'Untitled note'
}

export function measureNoteBytes(title: string, content: string): number {
    return new TextEncoder().encode(JSON.stringify({ title, content })).byteLength
}
