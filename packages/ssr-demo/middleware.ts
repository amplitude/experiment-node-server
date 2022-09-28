import { NextRequest, NextResponse } from 'next/server';

type HttpExperimentResult = {
  [flagKey: string]:
    | {
        key: string;
        payload?: Record<string, unknown>;
      }
    | undefined;
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const res = await fetch(
      `https://api.lab.amplitude.com/v1/vardata?${new URLSearchParams({
        user_id: 'userId',
      }).toString()}`,
      {
        headers: new Headers({
          Authorization: `Api-Key client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR`,
        }),
      },
    );
    const features = (await res.json()) as HttpExperimentResult;

    if (features?.['js-ssr-demo']?.key === 'true') {
      return NextResponse.rewrite(
        new URL('/experiment-outcomes/js-ssr-demo/variant', request.url),
      );
    }

    return NextResponse.rewrite(
      new URL('/experiment-outcomes/js-ssr-demo/control', request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
