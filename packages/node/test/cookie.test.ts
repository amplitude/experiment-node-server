import { AmplitudeCookie } from 'src/cookie';

const userAndDeviceNewCookie =
  'JTdCJTIydXNlcklkJTIyJTNBJTIydGVzdCU0MGFtcGxpdHVkZS5jb20lMjIlMkMlMjJkZXZpY2VJZCUyMiUzQSUyMmRldmljZUlkJTIyJTdE';
const deviceNewCookie = 'JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJkZXZpY2VJZCUyMiU3RA==';

test('AmplitudeCookie.cookieName', () => {
  expect(() => {
    AmplitudeCookie.cookieName('');
  }).toThrowError();
  expect(AmplitudeCookie.cookieName('1234567')).toEqual('amp_123456');
  expect(AmplitudeCookie.cookieName('1234567890', true)).toEqual(
    'AMP_1234567890',
  );
});

test('AmplitudeCookie.parse', () => {
  expect(
    AmplitudeCookie.parse('deviceId...1f1gkeib1.1f1gkeib1.dv.1ir.20q'),
  ).toEqual({
    device_id: 'deviceId',
  });
  expect(AmplitudeCookie.parse(deviceNewCookie, true)).toEqual({
    device_id: 'deviceId',
  });
  expect(AmplitudeCookie.parse('invalidcookie', true)).toEqual({});
  expect(
    AmplitudeCookie.parse(
      'deviceId.dGVzdEBhbXBsaXR1ZGUuY29t..1f1gkeib1.1f1gkeib1.dv.1ir.20q',
    ),
  ).toEqual({
    device_id: 'deviceId',
    user_id: 'test@amplitude.com',
  });
  expect(AmplitudeCookie.parse(userAndDeviceNewCookie, true)).toEqual({
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
  expect(AmplitudeCookie.generate('deviceId', true)).toEqual(deviceNewCookie);
});
