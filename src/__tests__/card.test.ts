import { describe, expect, it } from 'vitest';
import { extractCharacterBook, parseInputFile } from '../lib/card';
import { ParseError } from '../lib/png';
import type { CharacterBook } from '../types';

function makeBook(): CharacterBook {
  return {
    name: 'Book',
    entries: [{ keys: ['k'], content: 'v' }],
  };
}

describe('extractCharacterBook', () => {
  it('extracts from data.character_book', () => {
    const book = makeBook();
    const result = extractCharacterBook({ data: { character_book: book } });
    expect(result).toEqual(book);
  });

  it('extracts from root character_book', () => {
    const book = makeBook();
    const result = extractCharacterBook({ character_book: book });
    expect(result).toEqual(book);
  });

  it('accepts object itself as worldbook', () => {
    const book = makeBook();
    const result = extractCharacterBook(book);
    expect(result).toEqual(book);
  });

  it('throws NO_CHARACTER_BOOK when missing', () => {
    expect(() => extractCharacterBook({ data: {} })).toThrowError(ParseError);

    try {
      extractCharacterBook({ data: {} });
    } catch (error) {
      expect((error as ParseError).code).toBe('NO_CHARACTER_BOOK');
    }
  });
});

describe('parseInputFile', () => {
  it('parses JSON files', async () => {
    const book = makeBook();
    const card = { data: { character_book: book } };
    const file = new File([JSON.stringify(card)], 'demo.json', { type: 'application/json' });

    const result = await parseInputFile(file);

    expect(result.sourceName).toBe('demo.json');
    expect(result.characterBook).toEqual(book);
  });

  it('keeps utf-8 content when parsing JSON files', async () => {
    const book: CharacterBook = {
      name: '\u4e16\u754c\u89d2\u8272',
      entries: [{ keys: ['\u57ce\u5e02'], content: '\u4f60\u597d\uff0c\u4e16\u754c\ud83d\ude80' }],
    };
    const card = { data: { character_book: book } };
    const file = new File([JSON.stringify(card)], 'utf8.json', { type: 'application/json' });

    const result = await parseInputFile(file);
    expect(result.characterBook).toEqual(book);
  });

  it('rejects unsupported extension', async () => {
    const file = new File(['{}'], 'demo.txt', { type: 'text/plain' });

    await expect(parseInputFile(file)).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });
});
