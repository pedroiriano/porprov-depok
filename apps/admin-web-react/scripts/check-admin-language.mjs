import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const banned = [
  'Cuba Foundation', 'Cuba Phase', 'clean-room', 'Admin Workspace', 'Workspace Admin',
  'LiveScore Center', 'Media Library', 'City Guide', 'Audit Log', 'Recycle Bin',
  'Private SSE', 'transactional outbox', 'append-only', 'expected revision', 'HTTP 409',
  'Technical Delegate', 'Official scoring workspace', 'Immutable evidence trail',
  'Private event stream', 'Bounce rate', 'Page views', 'pagination server-side',
  'audit trail', 'Bulk Action', 'Select All', 'Loading', 'Retry', 'Submit',
  'Dashboard', 'Pending', 'Verified', 'Official', 'Rejected', 'Venue', 'Super Admin',
].map((phrase) => phrase.toLocaleLowerCase('id-ID'));
const allowedExtensions = new Set(['.ts', '.tsx']);
const userFacingAttributes = new Set([
  'aria-label', 'caption', 'description', 'emptyDescription', 'emptyTitle', 'helpText',
  'itemLabel', 'label', 'loadingLabel', 'placeholder', 'submitText', 'title', 'tooltip',
]);
const userFacingProperties = new Set([
  'ariaLabel', 'caption', 'description', 'emptyDescription', 'emptyTitle', 'helpText',
  'itemLabel', 'label', 'loadingLabel', 'message', 'placeholder', 'submitText', 'title', 'tooltip',
]);
const findings = [];

function isModuleSpecifier(node) {
  return ts.isImportDeclaration(node.parent)
    || ts.isExportDeclaration(node.parent)
    || (ts.isCallExpression(node.parent) && node.parent.expression.kind === ts.SyntaxKind.ImportKeyword);
}

function propertyName(node) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return '';
}

function isInsideUserFacingJsx(node) {
  let current = node.parent;
  let isMachineExpression = false;
  while (current) {
    if (ts.isJsxAttribute(current)) {
      return !isMachineExpression && userFacingAttributes.has(current.name.text);
    }
    if (ts.isJsxExpression(current) && (ts.isJsxElement(current.parent) || ts.isJsxFragment(current.parent))) {
      return !isMachineExpression;
    }
    if (ts.isBinaryExpression(current) || ts.isArrayLiteralExpression(current)) isMachineExpression = true;
    if (ts.isJsxElement(current) || ts.isJsxFragment(current)) break;
    current = current.parent;
  }
  return false;
}

function isUserFacingString(node) {
  if (ts.isJsxText(node)) return true;
  if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return false;
  if (isInsideUserFacingJsx(node)) return true;

  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isPropertyAssignment(current) && userFacingProperties.has(propertyName(current.name))) {
      return true;
    }
    if (ts.isVariableDeclaration(current) && /(?:label|labels|message|messages|title|description|copy)$/i.test(propertyName(current.name))) {
      return true;
    }
    if (ts.isCallExpression(current)) {
      const called = current.expression.getText();
      return /(?:set\w*(?:Error|Message|Notice|Feedback)|getApiErrorMessage|requestSoftDeleteReason|(?:window\.)?(?:alert|confirm|prompt))$/.test(called);
    }
    current = current.parent;
  }
  return false;
}

function inspect(sourceFile, node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
    if (!isModuleSpecifier(node) && isUserFacingString(node)) {
      const normalized = node.text.toLocaleLowerCase('id-ID');
      for (const phrase of banned) {
        if (normalized.includes(phrase)) {
          const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          findings.push(`${relative(root, sourceFile.fileName)}:${position.line + 1}: ${phrase}`);
        }
      }
    }
  }
  ts.forEachChild(node, (child) => inspect(sourceFile, child));
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!allowedExtensions.has(extname(entry.name))) continue;
    const content = await readFile(path, 'utf8');
    const scriptKind = extname(entry.name) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind);
    inspect(sourceFile, sourceFile);
  }
}

await walk(root);
if (findings.length) {
  console.error('Ditemukan istilah teknis/asing pada teks antarmuka:\n' + findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: string antarmuka Admin memenuhi daftar istilah terlarang.');
}
