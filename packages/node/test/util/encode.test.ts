import { getUtf8Bytes, urlSafeBase64Encode } from 'src/util/encode';

test('getUtf8Bytes', () => {
  expect(getUtf8Bytes('My 🚀 is full of 🦎')).toEqual(
    new Uint8Array([
      77,
      121,
      32,
      240,
      159,
      154,
      128,
      32,
      105,
      115,
      32,
      102,
      117,
      108,
      108,
      32,
      111,
      102,
      32,
      240,
      159,
      166,
      142,
    ]),
  );
});

test('urlSafeBase64Encode', () => {
  expect(urlSafeBase64Encode('My 🚀 is full of 🦎')).toEqual(
    'TXkg8J-agCBpcyBmdWxsIG9mIPCfpo4',
  );
});
