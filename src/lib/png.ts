import type { ErrorCode } from '../types';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export class ParseError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ParseError';
    this.code = code;
  }
}

function asAscii(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += String.fromCharCode(byte);
  }
  return out;
}

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  ) >>> 0;
}

function decodeBase64(base64Text: string): string {
  if (typeof atob === 'function') {
    return atob(base64Text);
  }

  const maybeBuffer = (globalThis as unknown as {
    Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (maybeBuffer) {
    return maybeBuffer.from(base64Text, 'base64').toString('utf-8');
  }

  throw new ParseError('INVALID_JSON', 'Unable to decode base64 payload in this runtime.');
}

export function extractCharaJsonFromPngBytes(data: Uint8Array): unknown {
  if (data.length < PNG_SIGNATURE.length) {
    throw new ParseError('INVALID_PNG_OR_NO_CHARA_CHUNK', 'PNG header invalid.');
  }

  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (data[i] !== PNG_SIGNATURE[i]) {
      throw new ParseError('INVALID_PNG_OR_NO_CHARA_CHUNK', 'PNG header invalid.');
    }
  }

  let offset = PNG_SIGNATURE.length;

  while (offset + 8 <= data.length) {
    const length = readUint32BE(data, offset);
    offset += 4;

    const chunkType = asAscii(data.subarray(offset, offset + 4));
    offset += 4;

    if (offset + length + 4 > data.length) {
      throw new ParseError('INVALID_PNG_OR_NO_CHARA_CHUNK', 'PNG chunk is truncated.');
    }

    const chunkData = data.subarray(offset, offset + length);
    offset += length;

    // Skip CRC field.
    offset += 4;

    if (chunkType === 'tEXt') {
      const separatorIndex = chunkData.indexOf(0);
      if (separatorIndex > 0) {
        const keyword = asAscii(chunkData.subarray(0, separatorIndex));
        if (keyword === 'chara') {
          const textPayload = asAscii(chunkData.subarray(separatorIndex + 1));

          try {
            return JSON.parse(decodeBase64(textPayload));
          } catch {
            throw new ParseError('INVALID_JSON', 'Found chara chunk but failed to parse JSON payload.');
          }
        }
      }
    }

    if (chunkType === 'IEND') {
      break;
    }
  }

  throw new ParseError('INVALID_PNG_OR_NO_CHARA_CHUNK', 'No tEXt/chara chunk found in PNG.');
}
