export type set = "robot" | "monster" | "head" | "cat";
export type GroupInfo = { id: string; name: string; iconURL: string };
export interface Identity {
  avatar: string;
  name: string;
  userId: string;
}
export type UserToken = string;

const DEFAULT_IDENTITY_KEY = "guestIdentity";
const DEFAULT_TOKEN_KEY = "userToken";

function isIdentity(obj: any): obj is Identity {
  return obj && typeof obj === 'object'
    && 'avatar' in obj && 'name' in obj && 'userId' in obj;
}

function isUserToken(obj: any): obj is UserToken {
  return typeof obj === 'string';
}

export function loadIdentity(key = DEFAULT_IDENTITY_KEY): Identity | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isIdentity(parsed)) return parsed as Identity;

    console.error('Invalid identity format, returning null');
    // If it's neither Identity nor UserToken, return null
    return null;
  } catch (e) {
    console.error('Error parsing identity from storage:', key, e);
    return null;
  }
}

export function loadToken(key = DEFAULT_TOKEN_KEY): UserToken | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (isUserToken(raw)) return raw as UserToken;

    console.error('Invalid token format, returning null');
    // If it's neither Identity nor UserToken, return null
    return null;
  } catch (e) {
    console.error('Error parsing token from storage:', key, e);
    return null;
  }
}

export function saveIdentity(identity: Identity, key = DEFAULT_IDENTITY_KEY): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(identity));
}

export function saveToken(token: string, key = DEFAULT_TOKEN_KEY): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, token);
}

export function clearStorage(key = DEFAULT_IDENTITY_KEY): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key);
}
