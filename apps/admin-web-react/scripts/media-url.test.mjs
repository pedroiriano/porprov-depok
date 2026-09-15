import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMediaUrlFromBase } from '../src/lib/media-url.ts';

test('resolves media against the production same-origin API path', () => {
  assert.equal(
    resolveMediaUrlFromBase('/uploads/example.webp', '/api/v1', 'https://porprov.depok.go.id'),
    'https://porprov.depok.go.id/uploads/example.webp',
  );
});

test('preserves an absolute API gateway origin', () => {
  assert.equal(
    resolveMediaUrlFromBase('uploads/example.webp', 'http://localhost:8000/api/v1', 'http://localhost:5173'),
    'http://localhost:8000/uploads/example.webp',
  );
});

test('preserves already resolved and browser-local URLs', () => {
  assert.equal(resolveMediaUrlFromBase('https://cdn.example.test/image.webp', '/api/v1', 'https://porprov.depok.go.id'), 'https://cdn.example.test/image.webp');
  assert.equal(resolveMediaUrlFromBase('data:image/png;base64,AA==', '/api/v1', 'https://porprov.depok.go.id'), 'data:image/png;base64,AA==');
  assert.equal(resolveMediaUrlFromBase('', '/api/v1', 'https://porprov.depok.go.id'), '');
});
