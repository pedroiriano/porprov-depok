import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';

const app=new URL('../../apps/public-web-nextjs/',import.meta.url);
const ts=createRequire(new URL('package.json',app))('typescript');
const root=fileURLToPath(new URL('src/',app));
const banned=/\b(?:API(?: Gateway)?|Master Data(?: Service)?|SSE|JetStream|polling|fallback|upstream|downstream|backend|frontend|runtime|payload|UUID|Techwind|Cuba|LiveScore Center|City Guide|clean-room|proyeksi|kanonis|fase\s+\d|Event\s*#)\b/i;
const attributes=new Set(['alt','title','aria-label','caption','description','eyebrow','placeholder','label','message','helpText','emptyTitle','emptyDescription','tooltip']);

function userFacing(node){
  if(ts.isJsxText(node))return true;
  if(ts.isPropertyAssignment(node.parent)&&node.parent.name===node)return false;
  for(let current=node.parent;current&&!ts.isSourceFile(current);current=current.parent){
    if(ts.isImportDeclaration(current)||ts.isExportDeclaration(current))return false;
    if(ts.isJsxAttribute(current))return attributes.has(current.name.getText());
    if(ts.isJsxExpression(current)&&(ts.isJsxElement(current.parent)||ts.isJsxFragment(current.parent)))return true;
    if(ts.isPropertyAssignment(current)&&attributes.has(current.name.getText().replace(/^['"]|['"]$/g,'')))return true;
    // SECURITY: Errors shown to visitors must not append internal transport/service details.
    if(ts.isCallExpression(current))return /(?:set\w*(?:Error|Message|Notice)|alert|confirm)$/.test(current.expression.getText());
  }
  return false;
}

// TEST: Ignore identifiers, routes, CSS and internal diagnostics; inspect rendered copy, metadata, labels and error sinks.
export function inspectPublicCopy(file,content){
  const source=ts.createSourceFile(file,content,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const findings=[];
  function inspect(node){
    if((ts.isJsxText(node)||ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))&&userFacing(node)){
      const match=banned.exec(node.text);
      if(match)findings.push({file,line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,term:match[0]});
    }
    ts.forEachChild(node,inspect);
  }
  inspect(source);return findings;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const findings=[];let files=0;
  function walk(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory())walk(path);
    else if(/\.tsx?$/.test(path)){files++;findings.push(...inspectPublicCopy(relative(root,path),readFileSync(path,'utf8')));}
  }}
  walk(root);
  if(findings.length){console.error(findings.map(item=>`${item.file}:${item.line}: ${item.term}`).join('\n'));process.exitCode=1;}
  else console.log(`PASS: copy publik ${files} file tidak memuat istilah internal terlarang; konten dinamis tetap ditinjau terpisah.`);
}
