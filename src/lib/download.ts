export function sanitizeBaseName(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  const clean = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return clean || 'worldbook';
}

export function getDownloadNames(sourceName: string): { raw: string; legacy: string; rikkahub: string } {
  const base = sanitizeBaseName(sourceName);
  return {
    raw: `${base}.worldbook.raw.json`,
    legacy: `${base}.world_info.legacy.json`,
    rikkahub: `${base}.rikkahub.lorebook.json`,
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
