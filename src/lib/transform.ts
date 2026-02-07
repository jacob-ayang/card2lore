import type { CharacterBook, CharacterBookEntry, LegacyWorldInfo, LegacyWorldInfoEntry } from '../types';

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  return null;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function getExt(entry: CharacterBookEntry, key: string): unknown {
  return entry.extensions?.[key];
}

function buildLegacyEntry(entry: CharacterBookEntry, index: number): LegacyWorldInfoEntry {
  const uid = asNumber(entry.id, index);

  return {
    uid,
    key: asStringArray(entry.keys),
    keysecondary: asStringArray(entry.secondary_keys),
    comment: asString(entry.comment),
    content: asString(entry.content),
    constant: asBoolean(entry.constant, false),
    selective: asBoolean(entry.selective, false),
    order: asNumber(entry.insertion_order, 100),
    position: asNumber(getExt(entry, 'position'), entry.position === 'before_char' ? 0 : 1),
    disable: !asBoolean(entry.enabled, true),
    addMemo: Boolean(entry.comment && entry.comment.trim()),
    selectiveLogic: asNumber(getExt(entry, 'selectiveLogic'), 0),
    excludeRecursion: asBoolean(getExt(entry, 'exclude_recursion'), false),
    preventRecursion: asBoolean(getExt(entry, 'prevent_recursion'), false),
    delayUntilRecursion: asBoolean(getExt(entry, 'delay_until_recursion'), false),
    displayIndex: asNumber(getExt(entry, 'display_index'), index),
    probability: asNumber(getExt(entry, 'probability'), 100),
    useProbability: asBoolean(getExt(entry, 'useProbability'), true),
    depth: asNumber(getExt(entry, 'depth'), 4),
    outletName: asString(getExt(entry, 'outlet_name')),
    group: asString(getExt(entry, 'group')),
    groupOverride: asBoolean(getExt(entry, 'group_override'), false),
    groupWeight: asNumber(getExt(entry, 'group_weight'), 100),
    scanDepth: asNullableNumber(getExt(entry, 'scan_depth')),
    caseSensitive: asNullableBoolean(getExt(entry, 'case_sensitive')),
    matchWholeWords: asNullableBoolean(getExt(entry, 'match_whole_words')),
    useGroupScoring: asNullableBoolean(getExt(entry, 'use_group_scoring')),
    automationId: asString(getExt(entry, 'automation_id')),
    role: asNumber(getExt(entry, 'role'), 0),
    vectorized: asBoolean(getExt(entry, 'vectorized'), false),
    sticky: asNullableNumber(getExt(entry, 'sticky')),
    cooldown: asNullableNumber(getExt(entry, 'cooldown')),
    delay: asNullableNumber(getExt(entry, 'delay')),
    matchPersonaDescription: asBoolean(getExt(entry, 'match_persona_description'), false),
    matchCharacterDescription: asBoolean(getExt(entry, 'match_character_description'), false),
    matchCharacterPersonality: asBoolean(getExt(entry, 'match_character_personality'), false),
    matchCharacterDepthPrompt: asBoolean(getExt(entry, 'match_character_depth_prompt'), false),
    matchScenario: asBoolean(getExt(entry, 'match_scenario'), false),
    matchCreatorNotes: asBoolean(getExt(entry, 'match_creator_notes'), false),
    triggers: asStringArray(getExt(entry, 'triggers')),
    ignoreBudget: asBoolean(getExt(entry, 'ignore_budget'), false),
  };
}

export function convertCharacterBookToLegacy(book: CharacterBook): LegacyWorldInfo {
  const entries: LegacyWorldInfo['entries'] = {};

  for (let index = 0; index < book.entries.length; index += 1) {
    const entry = book.entries[index];
    const legacyEntry = buildLegacyEntry(entry, index);
    entries[String(legacyEntry.uid)] = legacyEntry;
  }

  return { entries };
}
