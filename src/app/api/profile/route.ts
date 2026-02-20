import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';

const ALLOWED_FIELDS = ['bio', 'leetcode_url', 'codeforces_url', 'github_url', 'username', 'avatar_url'] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

const URL_DOMAIN_PREFIXES: Partial<Record<AllowedField, string>> = {
  github_url: 'https://github.com/',
  leetcode_url: 'https://leetcode.com/',
  codeforces_url: 'https://codeforces.com/',
};

const URL_LABELS: Partial<Record<AllowedField, string>> = {
  github_url: 'GitHub',
  leetcode_url: 'LeetCode',
  codeforces_url: 'Codeforces',
};

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identity = getEffectiveIdentityFromToken(token);
  if (!identity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Partial<Record<AllowedField, string>> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const val = body[field];
      if (typeof val === 'string' || val === null) {
        updates[field] = val as string;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Username validation
  if (updates.username !== undefined) {
    const username = updates.username;
    if (!username) {
      return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (username.length > 32) {
      return NextResponse.json({ error: 'Username must be 32 characters or fewer' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9]/.test(username)) {
      return NextResponse.json({ error: 'Username must start with a letter or number' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, _ and -' }, { status: 400 });
    }
    if (/[_-]{2}/.test(username)) {
      return NextResponse.json({ error: 'Username cannot have consecutive special characters' }, { status: 400 });
    }
    if (/[_-]$/.test(username)) {
      return NextResponse.json({ error: 'Username cannot end with _ or -' }, { status: 400 });
    }

    // Normalize to lowercase for case-insensitive uniqueness
    updates.username = username.toLowerCase();

    const { data: existing } = await supabase
      .from('Users')
      .select('email')
      .ilike('username', updates.username)
      .neq('email', identity.email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
  }

  // Bio validation
  if (updates.bio && updates.bio.length > 300) {
    return NextResponse.json({ error: 'Bio must be 300 characters or fewer' }, { status: 400 });
  }

  // URL domain validation
  for (const [field, prefix] of Object.entries(URL_DOMAIN_PREFIXES) as [AllowedField, string][]) {
    const url = updates[field];
    if (url && !url.startsWith(prefix)) {
      return NextResponse.json(
        { error: `${URL_LABELS[field]} URL must start with ${prefix}` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from('Users')
    .update(updates)
    .eq('email', identity.email)
    .select('username, bio, avatar_url, leetcode_url, codeforces_url, github_url')
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
