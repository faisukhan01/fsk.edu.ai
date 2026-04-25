import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, getSessionCookieOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // User denied access
  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/?error=google_denied`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${appUrl}/?error=google_token_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${appUrl}/?error=google_userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();
    const { id: googleId, email, name, picture: avatar } = googleUser;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/?error=google_no_email`);
    }

    // Find or create user
    let user = await db.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Update Google info if signing in with Google for the first time on existing account
      if (!user.googleId) {
        user = await db.user.update({
          where: { id: user.id },
          data: { googleId, avatar: avatar || user.avatar },
        });
      }
    } else {
      // Create new user via Google
      user = await db.user.create({
        data: {
          googleId,
          email: email.toLowerCase().trim(),
          name: name || email.split('@')[0],
          avatar: avatar || null,
          password: '', // No password for Google users
        },
      });
    }

    // Create JWT session (same as email/password flow)
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name || '',
    });

    const response = NextResponse.redirect(`${appUrl}/`);
    response.cookies.set(getSessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/?error=google_auth_failed`);
  }
}
