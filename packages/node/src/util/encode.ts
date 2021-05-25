import { TextEncoder } from 'util';

const encoder = new TextEncoder();

export const getUtf8Bytes = (str: string) => {
  const result = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0 || charCode > 127) {
      return encoder.encode(str);
    }
    result.push(charCode);
  }

  return result;
};

const base64Encode = (unencoded: string) => {
  return Buffer.from(unencoded || '').toString('base64');
};

export const urlSafeBase64Encode = (s: string): string => {
  const encoded = base64Encode(s);

  return encoded.replace('+', '-').replace('/', '_').replace(/[=]+$/, '');
};

export const base64Decode = (encoded: string): string => {
  return Buffer.from(encoded, 'base64').toString('utf-8');
};
