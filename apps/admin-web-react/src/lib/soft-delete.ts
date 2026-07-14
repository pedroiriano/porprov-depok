const fallbackReason = 'Diarsipkan melalui Admin Web';

// ACCESSIBILITY: Dialog browser menjaga fokus pada keputusan destruktif sampai modal design-system tersedia.
export function requestSoftDeleteReason(label: string): string | null {
  const reason = window.prompt(
    `${label} akan dipindahkan ke Recycle Bin dan dapat dipulihkan. Masukkan alasan pengarsipan:`,
    fallbackReason,
  );
  if (reason === null) return null;
  return reason.trim() || fallbackReason;
}
