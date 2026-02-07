import { parseInputFile } from './lib/card';
import { downloadJson, getDownloadNames } from './lib/download';
import { ParseError } from './lib/png';
import { convertCharacterBookToLegacy } from './lib/transform';
import type { CharacterBook, LegacyWorldInfo } from './types';

type AppState = {
  sourceName: string;
  raw: CharacterBook | null;
  legacy: LegacyWorldInfo | null;
};

const state: AppState = {
  sourceName: '',
  raw: null,
  legacy: null,
};

function pretty(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function getById<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const node = root.querySelector(`#${id}`);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Missing required node: #${id}`);
  }
  return node as T;
}

function setMessage(root: HTMLElement, text: string, tone: 'idle' | 'ok' | 'warn' | 'error'): void {
  const el = getById<HTMLElement>(root, 'status-message');
  el.textContent = text;
  el.dataset.tone = tone;
}

function setStats(root: HTMLElement, sourceName: string, bookName: string, count: number): void {
  const source = getById<HTMLElement>(root, 'stat-source');
  const name = getById<HTMLElement>(root, 'stat-book');
  const entries = getById<HTMLElement>(root, 'stat-count');
  source.textContent = sourceName;
  name.textContent = bookName;
  entries.textContent = String(count);
}

function clearStats(root: HTMLElement): void {
  setStats(root, '-', '-', 0);
}

function setButtonsDisabled(root: HTMLElement, disabled: boolean): void {
  getById<HTMLButtonElement>(root, 'download-raw').disabled = disabled;
  getById<HTMLButtonElement>(root, 'download-legacy').disabled = disabled;
  getById<HTMLButtonElement>(root, 'download-both').disabled = disabled;
  getById<HTMLButtonElement>(root, 'copy-raw').disabled = disabled;
  getById<HTMLButtonElement>(root, 'copy-legacy').disabled = disabled;
}

function resetOutput(root: HTMLElement): void {
  getById<HTMLElement>(root, 'preview-raw').textContent = '{}';
  getById<HTMLElement>(root, 'preview-legacy').textContent = '{}';
}

function updateOutput(root: HTMLElement, raw: CharacterBook, legacy: LegacyWorldInfo): void {
  getById<HTMLElement>(root, 'preview-raw').textContent = pretty(raw);
  getById<HTMLElement>(root, 'preview-legacy').textContent = pretty(legacy);
}

function setResult(root: HTMLElement, sourceName: string, raw: CharacterBook, legacy: LegacyWorldInfo): void {
  const entryCount = raw.entries.length;
  const bookName = raw.name?.trim() || '(未命名世界书)';

  state.sourceName = sourceName;
  state.raw = raw;
  state.legacy = legacy;

  updateOutput(root, raw, legacy);
  setStats(root, sourceName, bookName, entryCount);
  setButtonsDisabled(root, false);

  if (entryCount === 0) {
    setMessage(root, '解析成功：检测到世界书，但 entries 为 0。仍可下载。', 'warn');
  } else {
    setMessage(root, '解析成功：已生成 raw 与 legacy 两份 JSON。', 'ok');
  }
}

function clearResult(root: HTMLElement, message: string, tone: 'idle' | 'warn' | 'error' = 'idle'): void {
  state.sourceName = '';
  state.raw = null;
  state.legacy = null;
  resetOutput(root);
  clearStats(root);
  setButtonsDisabled(root, true);
  setMessage(root, message, tone);
}

function downloadRaw(): void {
  if (!state.raw || !state.sourceName) {
    return;
  }

  const names = getDownloadNames(state.sourceName);
  downloadJson(names.raw, state.raw);
}

function downloadLegacy(): void {
  if (!state.legacy || !state.sourceName) {
    return;
  }

  const names = getDownloadNames(state.sourceName);
  downloadJson(names.legacy, state.legacy);
}

async function copyText(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error('Clipboard copy is not supported.');
  }
}

function setDropActive(root: HTMLElement, active: boolean): void {
  getById<HTMLElement>(root, 'drop-zone').classList.toggle('is-active', active);
}

async function handleFile(root: HTMLElement, file: File): Promise<void> {
  try {
    setMessage(root, '正在解析角色卡，请稍候...', 'idle');
    const { sourceName, characterBook } = await parseInputFile(file);
    const legacy = convertCharacterBookToLegacy(characterBook);
    setResult(root, sourceName, characterBook, legacy);
  } catch (error) {
    if (error instanceof ParseError) {
      clearResult(root, `解析失败 [${error.code}]：${error.message}`, 'error');
    } else {
      clearResult(root, '解析失败：发生未知错误。', 'error');
    }
  }
}

async function copyRaw(root: HTMLElement): Promise<void> {
  if (!state.raw) {
    return;
  }

  try {
    await copyText(pretty(state.raw));
    setMessage(root, '已复制 Raw JSON 到剪贴板。', 'ok');
  } catch {
    setMessage(root, '复制失败：当前环境不支持剪贴板写入。', 'error');
  }
}

async function copyLegacy(root: HTMLElement): Promise<void> {
  if (!state.legacy) {
    return;
  }

  try {
    await copyText(pretty(state.legacy));
    setMessage(root, '已复制 Legacy JSON 到剪贴板。', 'ok');
  } catch {
    setMessage(root, '复制失败：当前环境不支持剪贴板写入。', 'error');
  }
}

function wireUpload(root: HTMLElement): void {
  const input = getById<HTMLInputElement>(root, 'card-input');
  const dropZone = getById<HTMLElement>(root, 'drop-zone');

  input.addEventListener('change', async () => {
    const file = input.files?.[0];

    if (!file) {
      clearResult(root, '请选择一个角色卡文件（.json 或 .png）。');
      return;
    }

    try {
      await handleFile(root, file);
    } finally {
      input.value = '';
    }
  });

  dropZone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    setDropActive(root, true);
  });

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    setDropActive(root, true);
  });

  dropZone.addEventListener('dragleave', (event) => {
    if (!dropZone.contains(event.relatedTarget as Node | null)) {
      setDropActive(root, false);
    }
  });

  dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    setDropActive(root, false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      setMessage(root, '未检测到可上传文件，请重试。', 'warn');
      return;
    }

    await handleFile(root, file);
  });
}

function wireDownloadButtons(root: HTMLElement): void {
  getById<HTMLButtonElement>(root, 'download-raw').addEventListener('click', () => {
    downloadRaw();
  });

  getById<HTMLButtonElement>(root, 'download-legacy').addEventListener('click', () => {
    downloadLegacy();
  });

  getById<HTMLButtonElement>(root, 'download-both').addEventListener('click', () => {
    downloadRaw();
    downloadLegacy();
  });
}

function wireCopyButtons(root: HTMLElement): void {
  getById<HTMLButtonElement>(root, 'copy-raw').addEventListener('click', async () => {
    await copyRaw(root);
  });

  getById<HTMLButtonElement>(root, 'copy-legacy').addEventListener('click', async () => {
    await copyLegacy(root);
  });
}

export function createApp(root: HTMLElement): void {
  root.innerHTML = `
    <main class="page-shell">
      <section class="panel hero">
        <p class="eyebrow">Card2Lore</p>
        <h1>酒馆角色卡世界书导出器</h1>
        <p class="lead">上传角色卡（JSON/PNG），提取 <code>character_book</code>，生成并下载 raw + legacy world_info 两份 JSON。</p>
      </section>

      <section class="panel upload-panel">
        <label class="upload-button" for="card-input">上传角色卡</label>
        <input id="card-input" type="file" accept=".json,.png,application/json,image/png" />
        <div id="drop-zone" class="drop-zone" aria-label="拖拽上传区域">
          <p class="drop-title">或将角色卡拖拽到这里</p>
          <p class="drop-hint">支持 .json 与 .png 文件</p>
        </div>
        <p id="status-message" data-tone="idle" class="status">请选择一个角色卡文件（.json 或 .png）。</p>

        <dl class="stats">
          <div>
            <dt>源文件</dt>
            <dd id="stat-source">-</dd>
          </div>
          <div>
            <dt>世界书名称</dt>
            <dd id="stat-book">-</dd>
          </div>
          <div>
            <dt>条目数</dt>
            <dd id="stat-count">0</dd>
          </div>
        </dl>

        <div class="actions">
          <button id="download-raw" disabled>下载 Raw JSON</button>
          <button id="download-legacy" disabled>下载 Legacy JSON</button>
          <button id="download-both" disabled>下载两份</button>
        </div>

        <div class="actions">
          <button id="copy-raw" disabled>复制 Raw JSON</button>
          <button id="copy-legacy" disabled>复制 Legacy JSON</button>
        </div>
      </section>

      <section class="preview-grid">
        <article class="panel preview-panel">
          <header>
            <h2>Raw Worldbook</h2>
          </header>
          <pre id="preview-raw">{}</pre>
        </article>

        <article class="panel preview-panel">
          <header>
            <h2>Legacy world_info</h2>
          </header>
          <pre id="preview-legacy">{}</pre>
        </article>
      </section>
    </main>
  `;

  wireUpload(root);
  wireDownloadButtons(root);
  wireCopyButtons(root);
  clearResult(root, '请选择一个角色卡文件（.json 或 .png）。');
}
