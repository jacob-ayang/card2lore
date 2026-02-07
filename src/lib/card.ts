import type { CharacterBook, ErrorCode, JsonRecord, ParseInputResult } from '../types';
import { ParseError, extractCharaJsonFromPngBytes } from './png';

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasEntriesArray(value: unknown): value is CharacterBook {
  return isRecord(value) && Array.isArray(value.entries);
}

function parseJsonString(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    throw new ParseError('INVALID_JSON', 'JSON parse failed.');
  }
}

function extname(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx <= -1) {
    return '';
  }
  return filename.slice(idx).toLowerCase();
}

export function extractCharacterBook(cardJson: unknown): CharacterBook {
  if (hasEntriesArray(cardJson)) {
    return cardJson;
  }

  if (isRecord(cardJson)) {
    const dataNode = cardJson.data;

    if (isRecord(dataNode) && hasEntriesArray(dataNode.character_book)) {
      return dataNode.character_book;
    }

    if (hasEntriesArray(cardJson.character_book)) {
      return cardJson.character_book;
    }
  }

  throw new ParseError('NO_CHARACTER_BOOK', 'Character card does not contain character_book.');
}

export async function parseInputFile(file: File): Promise<ParseInputResult> {
  const extension = extname(file.name);
  let cardJson: unknown;

  if (extension === '.json') {
    cardJson = parseJsonString(await file.text());
  } else if (extension === '.png') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    cardJson = extractCharaJsonFromPngBytes(bytes);
  } else {
    throw new ParseError('UNSUPPORTED_FILE_TYPE', 'Only .json and .png are supported.');
  }

  const characterBook = extractCharacterBook(cardJson);

  return {
    sourceName: file.name,
    cardJson,
    characterBook,
  };
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return (
    value === 'UNSUPPORTED_FILE_TYPE' ||
    value === 'INVALID_PNG_OR_NO_CHARA_CHUNK' ||
    value === 'INVALID_JSON' ||
    value === 'NO_CHARACTER_BOOK'
  );
}
