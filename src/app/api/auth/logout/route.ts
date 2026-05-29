


import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { revokeToken } from '@/lib/auth';


export const POST = apiHandler({}, async ({ req }) => {
  const token = req.cookies.get('auth-token')?.value;

  if (token) {
    await revokeToken(token);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('user-id', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
});
