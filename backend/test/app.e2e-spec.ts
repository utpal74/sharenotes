import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApplication } from '../src/create-application.js';
import { MAX_NOTE_BYTES } from '../src/notes/notes.service.js';

function contentWithSerializedSize(title: string, bytes: number): string {
  const emptyContentBytes = Buffer.byteLength(
    JSON.stringify({ title, content: '' }),
    'utf8',
  );
  const contentBytes = bytes - emptyContentBytes;
  return (
    'é'.repeat(Math.floor(contentBytes / 2)) +
    'a'.repeat(contentBytes % 2)
  );
}

describe('ShareNotes HTTP API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApplication();
  });

  it('uses the configured API prefix and retains the health endpoint', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('supports fallback identity, lifecycle, owner authorization, and version conflicts', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .send({ title: 'First note', content: 'original' })
      .expect(201);

    expect(created.body.ownerId).toBe('demo-user');
    expect(created.body.version).toBe(1);

    const listed = await request(app.getHttpServer())
      .get('/api/v1/notes')
      .expect(200);
    expect(listed.body.data).toHaveLength(1);

    await request(app.getHttpServer())
      .get(`/api/v1/notes/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.content).toBe('original'));

    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${created.body.id}`)
      .set('x-user-id', 'other-user')
      .send({ title: 'Unauthorized', content: 'changed', version: 1 })
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/notes/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.content).toBe('original');
        expect(body.version).toBe(1);
      });

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/notes/${created.body.id}`)
      .send({ title: 'Updated', content: 'latest', version: 1 })
      .expect(200);
    expect(updated.body.version).toBe(2);

    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${created.body.id}`)
      .send({ title: 'Stale overwrite', content: 'wrong', version: 1 })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/api/v1/notes/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Updated');
        expect(body.content).toBe('latest');
        expect(body.version).toBe(2);
      });
  });

  it('enforces owner-only sharing, active-link reuse, revocation, and deletion', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title: 'Shared note', content: 'saved' })
      .expect(201);
    const notePath = `/api/v1/notes/${created.body.id}`;

    const firstLink = await request(app.getHttpServer())
      .post(`${notePath}/share`)
      .set('x-user-id', 'owner')
      .expect(201);
    const reusedLink = await request(app.getHttpServer())
      .post(`${notePath}/share`)
      .set('x-user-id', 'owner')
      .expect(201);
    expect(reusedLink.body.token).toBe(firstLink.body.token);

    await request(app.getHttpServer())
      .post(`${notePath}/share`)
      .set('x-user-id', 'other')
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1${firstLink.body.shareUrl}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Shared note');
        expect(body.content).toBe('saved');
      });
    const ownerLinkAfterRejection = await request(app.getHttpServer())
      .post(`${notePath}/share`)
      .set('x-user-id', 'owner')
      .expect(201);
    expect(ownerLinkAfterRejection.body.token).toBe(firstLink.body.token);

    await request(app.getHttpServer())
      .patch(notePath)
      .set('x-user-id', 'owner')
      .send({
        title: 'Latest title',
        content: 'Latest saved text',
        version: created.body.version,
      })
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1${firstLink.body.shareUrl}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Latest title');
        expect(body.content).toBe('Latest saved text');
      });

    await request(app.getHttpServer())
      .delete(`${notePath}/share/${firstLink.body.token}`)
      .set('x-user-id', 'other')
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1${firstLink.body.shareUrl}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`${notePath}/share/${firstLink.body.token}`)
      .set('x-user-id', 'owner')
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1${firstLink.body.shareUrl}`)
      .expect(404);

    const freshLink = await request(app.getHttpServer())
      .post(`${notePath}/share`)
      .set('x-user-id', 'owner')
      .expect(201);
    expect(freshLink.body.token).not.toBe(firstLink.body.token);

    await request(app.getHttpServer())
      .delete(notePath)
      .set('x-user-id', 'other')
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1${freshLink.body.shareUrl}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(notePath)
      .set('x-user-id', 'owner')
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1${freshLink.body.shareUrl}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(notePath)
      .set('x-user-id', 'owner')
      .expect(404);
  });

  it('accepts and rejects the semantic byte boundary over HTTP on create', async () => {
    expect(MAX_NOTE_BYTES).toBe(31_457_280);
    const title = 'Boundary';
    const oversizedContent = contentWithSerializedSize(title, MAX_NOTE_BYTES + 1);
    await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title, content: oversizedContent })
      .expect(413)
      .expect(({ body }) =>
        expect(body.message).toContain('31,457,280 UTF-8 bytes'),
      );
    await request(app.getHttpServer())
      .get('/api/v1/notes')
      .set('x-user-id', 'owner')
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));

    const content = contentWithSerializedSize(title, MAX_NOTE_BYTES);
    expect(
      Buffer.byteLength(JSON.stringify({ title, content }), 'utf8'),
    ).toBe(MAX_NOTE_BYTES);
    await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title, content })
      .expect(201)
      .expect(({ body }) => expect(body.sizeBytes).toBe(MAX_NOTE_BYTES));
  });

  it('accepts and rejects the semantic byte boundary over HTTP on update without mutation', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title: 'Small', content: 'saved' })
      .expect(201);
    const notePath = `/api/v1/notes/${created.body.id}`;
    const title = 'Boundary';
    const content = contentWithSerializedSize(title, MAX_NOTE_BYTES);
    expect(
      Buffer.byteLength(JSON.stringify({ title, content }), 'utf8'),
    ).toBe(MAX_NOTE_BYTES);

    const updated = await request(app.getHttpServer())
      .patch(notePath)
      .set('x-user-id', 'owner')
      .send({ title, content, version: created.body.version })
      .expect(200);
    expect(updated.body.sizeBytes).toBe(MAX_NOTE_BYTES);

    await request(app.getHttpServer())
      .patch(notePath)
      .set('x-user-id', 'owner')
      .send({ title, content: `${content}a`, version: updated.body.version })
      .expect(413);

    await request(app.getHttpServer())
      .get(notePath)
      .set('x-user-id', 'owner')
      .expect(200)
      .expect(({ body }) => {
        expect(body.content).toBe(content);
        expect(body.sizeBytes).toBe(MAX_NOTE_BYTES);
        expect(body.version).toBe(updated.body.version);
      });
  });

  it('returns explicit 413 above the raw JSON cap, passes parser errors, and retains URL-encoded parsing', async () => {
    const rawLimit = 32 * 1024 * 1024;
    const title = 'Raw cap';
    let content = 'x'.repeat(
      rawLimit - Buffer.byteLength(JSON.stringify({ title, content: '' }), 'utf8'),
    );
    expect(Buffer.byteLength(JSON.stringify({ title, content }), 'utf8')).toBe(rawLimit);
    await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title, content })
      .expect(413)
      .expect(({ body }) =>
        expect(body.message).toContain('31,457,280 UTF-8 bytes'),
      );

    content = 'x'.repeat(rawLimit);
    await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .send({ title, content })
      .expect(413)
      .expect(({ body }) => {
        expect(body.message).toBe('Request body exceeds the 32 MiB limit');
      });
    await request(app.getHttpServer())
      .get('/api/v1/notes')
      .set('x-user-id', 'owner')
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));

    await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);

    content = '';
    const formNote = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('x-user-id', 'owner')
      .type('form')
      .send({ title: 'Form note', content: 'supported' })
      .expect(201);
    expect(formNote.body.content).toBe('supported');
  });

  afterEach(async () => {
    await app.close();
  });
});
