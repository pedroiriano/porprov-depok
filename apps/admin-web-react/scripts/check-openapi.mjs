import { readFile } from 'node:fs/promises';

const document = JSON.parse(await readFile(new URL('../../../openapi/openapi.yaml', import.meta.url), 'utf8'));
const requiredPaths = ['/drafts', '/integrations/health', '/master-data/media'];
const missing = requiredPaths.filter((path) => !document.paths?.[path]);
if (document.openapi !== '3.1.0' || !document.components?.securitySchemes?.bearerAuth || missing.length) {
  throw new Error(`Kontrak OpenAPI tidak lengkap: ${missing.join(', ') || 'metadata/security'}`);
}
console.log('PASS: kontrak OpenAPI Admin Enterprise tersedia dan dapat dibaca.');
