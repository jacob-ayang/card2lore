import { describe, expect, it } from 'vitest';
import { convertCharacterBookToLegacy, convertCharacterBookToRikkaHubNative } from '../lib/transform';
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

describe('convertCharacterBookToRikkaHubNative', () => {
  it('creates native lorebook export wrapper', () => {
    const book: CharacterBook = {
      name: 'My Book',
      description: 'desc',
      entries: [
        {
          keys: ['hero'],
          content: 'bio',
          comment: 'Character Memo',
          insertion_order: 9,
          enabled: true,
          extensions: {
            depth: 6,
            scan_depth: 8,
            case_sensitive: true,
            position: 0,
          },
        },
      ],
    };

    const result = convertCharacterBookToRikkaHubNative(book, 'fallback-name');

    expect(result.version).toBe(1);
    expect(result.type).toBe('lorebook');
    expect(result.data.name).toBe('My Book');
    expect(result.data.description).toBe('desc');
    expect(result.data.entries).toHaveLength(1);
    expect(result.data.entries[0]).toMatchObject({
      name: 'Character Memo',
      enabled: true,
      priority: 9,
      position: 'before_system_prompt',
      content: 'bio',
      injectDepth: 6,
      keywords: ['hero'],
      useRegex: false,
      caseSensitive: true,
      scanDepth: 8,
      constantActive: false,
    });
  });

  it('uses defaults and fallback name', () => {
    const book: CharacterBook = {
      entries: [
        {
          keys: [],
          content: '',
          position: 'after_char',
        },
      ],
    };

    const result = convertCharacterBookToRikkaHubNative(book, 'fallback-name');
    expect(result.data.name).toBe('fallback-name');
    expect(result.data.entries[0]).toMatchObject({
      name: '',
      enabled: true,
      priority: 100,
      position: 'after_system_prompt',
      injectDepth: 4,
      scanDepth: 4,
      caseSensitive: false,
      constantActive: false,
    });
  });
});
