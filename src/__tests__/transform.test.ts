import { describe, expect, it } from 'vitest';
import { convertCharacterBookToLegacy } from '../lib/transform';
import type { CharacterBook } from '../types';

describe('convertCharacterBookToLegacy', () => {
  it('uses index as uid when id is missing', () => {
    const book: CharacterBook = {
      entries: [
        {
          keys: ['k1'],
          content: 'v1',
        },
      ],
    };

    const result = convertCharacterBookToLegacy(book);
    expect(result.entries['0'].uid).toBe(0);
    expect(result.entries['0'].key).toEqual(['k1']);
  });

  it('maps before_char and enabled=false', () => {
    const book: CharacterBook = {
      entries: [
        {
          id: 7,
          keys: ['hero'],
          secondary_keys: ['king'],
          comment: 'memo',
          content: 'entry text',
          enabled: false,
          position: 'before_char',
          extensions: {
            probability: 42,
            role: 2,
          },
        },
      ],
    };

    const result = convertCharacterBookToLegacy(book);
    const entry = result.entries['7'];

    expect(entry.position).toBe(0);
    expect(entry.disable).toBe(true);
    expect(entry.probability).toBe(42);
    expect(entry.role).toBe(2);
    expect(entry.keysecondary).toEqual(['king']);
  });

  it('fills defaults when fields are absent', () => {
    const book: CharacterBook = {
      entries: [
        {
          keys: [],
          content: '',
        },
      ],
    };

    const result = convertCharacterBookToLegacy(book);
    const entry = result.entries['0'];

    expect(entry.order).toBe(100);
    expect(entry.position).toBe(1);
    expect(entry.selectiveLogic).toBe(0);
    expect(entry.depth).toBe(4);
    expect(entry.groupWeight).toBe(100);
    expect(entry.caseSensitive).toBeNull();
    expect(entry.scanDepth).toBeNull();
    expect(entry.triggers).toEqual([]);
  });
});
