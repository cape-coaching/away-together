// Instagram API client — OAuth + media fetching

const APP_ID = process.env.INSTAGRAM_APP_ID!;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: "instagram_business_basic",
    response_type: "code",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  userId: string;
}> {
  // Step 1: Exchange code for short-lived token
  const body = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
  });

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram token exchange failed: ${err}`);
  }

  const data = await res.json();
  const shortToken = data.access_token;
  const userId = String(data.user_id);

  // Step 2: Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${shortToken}`
  );

  if (!longRes.ok) {
    // Fall back to short-lived token
    return { accessToken: shortToken, userId };
  }

  const longData = await longRes.json();
  return { accessToken: longData.access_token, userId };
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export async function fetchUserMedia(
  accessToken: string,
  limit = 50
): Promise<InstagramMedia[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram media fetch failed: ${err}`);
  }

  const data = await res.json();
  return data.data ?? [];
}
