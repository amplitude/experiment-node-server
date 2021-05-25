import { AmplitudeCookie } from 'src/amplitude';

test('AmplitudeCookie.cookieName', () => {
  expect(() => {
    AmplitudeCookie.cookieName('');
  }).toThrowError();
  expect(AmplitudeCookie.cookieName('1234567')).toEqual('amp_123456');
});

test('AmplitudeCookie.parse', () => {
  expect(
    AmplitudeCookie.parse('deviceId...1f1gkeib1.1f1gkeib1.dv.1ir.20q'),
  ).toEqual({
    device_id: 'deviceId',
  });

  expect(
    AmplitudeCookie.parse(
      'deviceId.dGVzdEBhbXBsaXR1ZGUuY29t..1f1gkeib1.1f1gkeib1.dv.1ir.20q',
    ),
  ).toEqual({
    device_id: 'deviceId',
    user_id: 'test@amplitude.com',
  });

  expect(
    AmplitudeCookie.parse('deviceId.Y8O3Pg==..1f1gkeib1.1f1gkeib1.dv.1ir.20q'),
  ).toEqual({
    device_id: 'deviceId',
    user_id: 'c÷>',
  });
});

test('AmplitudeCookie.generate', () => {
  expect(AmplitudeCookie.generate('deviceId')).toEqual('deviceId..........');
});
