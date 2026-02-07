import { describe, expect, it } from 'vitest';
import { ParseError, extractCharaJsonFromPngBytes } from '../lib/png';

function bytesFromAscii(input: string): Uint8Array {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    out[i] = input.charCodeAt(i);
  }
  return out;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, data.length, false);
  chunk.set(bytesFromAscii(type), 4);
  chunk.set(data, 8);
  // CRC omitted by parser, keep zero bytes.

  return chunk;
}

function buildPngWithChara(payload: unknown): Uint8Array {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = makeChunk('IHDR', new Uint8Array(13));
  const charaText = `chara\0${btoa(JSON.stringify(payload))}`;
  const text = makeChunk('tEXt', bytesFromAscii(charaText));
  const iend = makeChunk('IEND', new Uint8Array());

  const output = new Uint8Array(signature.length + ihdr.length + text.length + iend.length);
  let offset = 0;
  output.set(signature, offset);
  offset += signature.length;
  output.set(ihdr, offset);
  offset += ihdr.length;
  output.set(text, offset);
  offset += text.length;
  output.set(iend, offset);

  return output;
}

describe('extractCharaJsonFromPngBytes', () => {
  it('parses valid tEXt/chara payload', () => {
    const payload = { data: { character_book: { entries: [] } }, name: 'demo' };
    const png = buildPngWithChara(payload);

    const result = extractCharaJsonFromPngBytes(png);
    expect(result).toEqual(payload);
  });

  it('throws when no chara chunk exists', () => {
    const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = makeChunk('IHDR', new Uint8Array(13));
    const iend = makeChunk('IEND', new Uint8Array());
    const png = new Uint8Array(signature.length + ihdr.length + iend.length);
    png.set(signature, 0);
    png.set(ihdr, signature.length);
    png.set(iend, signature.length + ihdr.length);

    expect(() => extractCharaJsonFromPngBytes(png)).toThrowError(ParseError);
    try {
      extractCharaJsonFromPngBytes(png);
    } catch (error) {
      expect((error as ParseError).code).toBe('INVALID_PNG_OR_NO_CHARA_CHUNK');
    }
  });

  it('throws when PNG signature is invalid', () => {
    const bad = Uint8Array.from([1, 2, 3, 4]);

    expect(() => extractCharaJsonFromPngBytes(bad)).toThrowError(ParseError);
    try {
      extractCharaJsonFromPngBytes(bad);
    } catch (error) {
      expect((error as ParseError).code).toBe('INVALID_PNG_OR_NO_CHARA_CHUNK');
    }
  });
});
