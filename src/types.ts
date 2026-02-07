export type JsonRecord = Record<string, unknown>;

export type ErrorCode =
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INVALID_PNG_OR_NO_CHARA_CHUNK'
  | 'INVALID_JSON'
  | 'NO_CHARACTER_BOOK';

export type CharacterBook = {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions?: Record<string, unknown>;
  entries: CharacterBookEntry[];
};

export type CharacterBookEntry = {
  id?: number;
  keys: string[];
  secondary_keys?: string[];
  comment?: string;
  content: string;
  constant?: boolean;
  selective?: boolean;
  insertion_order?: number;
  enabled?: boolean;
  position?: 'before_char' | 'after_char' | string;
  extensions?: Record<string, unknown>;
};

export type LegacyWorldInfo = {
  entries: Record<string, LegacyWorldInfoEntry>;
};

export type RikkaHubInjectionPosition =
  | 'before_system_prompt'
  | 'after_system_prompt'
  | 'top_of_chat'
  | 'bottom_of_chat'
  | 'at_depth';

export type RikkaHubRegexInjection = {
  name: string;
  enabled: boolean;
  priority: number;
  position: RikkaHubInjectionPosition;
  content: string;
  injectDepth: number;
  keywords: string[];
  useRegex: boolean;
  caseSensitive: boolean;
  scanDepth: number;
  constantActive: boolean;
};

export type RikkaHubLorebook = {
  name: string;
  description: string;
  enabled: boolean;
  entries: RikkaHubRegexInjection[];
};

export type RikkaHubLorebookExport = {
  version: 1;
  type: 'lorebook';
  data: RikkaHubLorebook;
};

export type LegacyWorldInfoEntry = {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  selective: boolean;
  order: number;
  position: number;
  disable: boolean;
  addMemo: boolean;
  selectiveLogic: number;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean;
  displayIndex: number;
  probability: number;
  useProbability: boolean;
  depth: number;
  outletName: string;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  scanDepth: number | null;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  useGroupScoring: boolean | null;
  automationId: string;
  role: number;
  vectorized: boolean;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  triggers: string[];
  ignoreBudget: boolean;
};

export type ParseInputResult = {
  sourceName: string;
  cardJson: unknown;
  characterBook: CharacterBook;
};
