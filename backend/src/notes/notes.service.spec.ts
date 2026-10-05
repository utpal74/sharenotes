import { PayloadTooLargeException, UnauthorizedException } from '@nestjs/common';
import { MAX_NOTE_BYTES, NotesService } from './notes.service.js';

function contentWithSerializedSize(title: string, bytes: number): string {
    const emptyContentBytes = Buffer.byteLength(
        JSON.stringify({ title, content: '' }),
        'utf8',
    );
    const contentBytes = bytes - emptyContentBytes;
    const multibyteCharacters = Math.floor(contentBytes / 2);
    return 'é'.repeat(multibyteCharacters) + 'a'.repeat(contentBytes % 2);
}

describe('NotesService serialized note size', () => {
    it('accepts the exact normalized UTF-8 byte limit on create and update', () => {
        const service = new NotesService();
        const title = 'Boundary';
        const content = contentWithSerializedSize(title, MAX_NOTE_BYTES);
        const expectedSize = Buffer.byteLength(
            JSON.stringify({ title, content }),
            'utf8',
        );

        expect(MAX_NOTE_BYTES).toBe(31_457_280);
        expect(expectedSize).toBe(MAX_NOTE_BYTES);
        const created = service.create({ title: ` ${title} `, content });
        expect(created.title).toBe(title);
        expect(created.sizeBytes).toBe(MAX_NOTE_BYTES);

        const updated = service.update(created.id, {
            title: ` ${title} `,
            content,
            version: created.version,
        });
        expect(updated.sizeBytes).toBe(MAX_NOTE_BYTES);
        expect(updated.version).toBe(2);
    });

    it('rejects one byte over the limit without mutating create or update state', () => {
        const service = new NotesService();
        const note = service.create({ title: 'Original', content: 'saved' });
        const before = service.getOwned(note.id);
        const title = 'Boundary';
        const oversizedContent = contentWithSerializedSize(
            title,
            MAX_NOTE_BYTES + 1,
        );

        expect(() =>
            service.create({ title, content: oversizedContent }),
        ).toThrow(PayloadTooLargeException);
        expect(service.list().meta.total).toBe(1);

        expect(() =>
            service.update(note.id, {
                title,
                content: oversizedContent,
                version: note.version,
            }),
        ).toThrow(PayloadTooLargeException);
        expect(service.getOwned(note.id)).toEqual(before);
    });

    it('measures the effective normalized title', () => {
        const service = new NotesService();
        const note = service.create({ title: '   ', content: 'text' });

        expect(note.title).toBe('Untitled note');
        expect(note.sizeBytes).toBe(
            Buffer.byteLength(
                JSON.stringify({ title: 'Untitled note', content: 'text' }),
                'utf8',
            ),
        );
    });
});

describe('NotesService share ownership', () => {
    it('rejects non-owner share creation without adding an active link', () => {
        const service = new NotesService();
        const note = service.create(
            { title: 'Shared note', content: 'saved' },
            'owner',
        );
        const link = service.createShareLink(note.id, 'owner');

        expect(Reflect.get(service, 'shareLinks')).toHaveProperty('size', 1);
        expect(() => service.createShareLink(note.id, 'other')).toThrow(
            UnauthorizedException,
        );
        expect(Reflect.get(service, 'shareLinks')).toHaveProperty('size', 1);
        expect(service.getShared(link.token)).toEqual(note);
        expect(service.createShareLink(note.id, 'owner')).toEqual(link);
    });
});
