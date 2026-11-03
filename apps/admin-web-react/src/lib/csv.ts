// SECURITY: Quoting alone does not stop spreadsheet formulas, including leading whitespace/control characters.
export function escapeCsvCell(value:unknown):string {
  const text=String(value??'');
  const safe=/^\s*[=+@-]|^[\t\r\n]/u.test(text)?`'${text}`:text;
  return `"${safe.replaceAll('"','""')}"`;
}
