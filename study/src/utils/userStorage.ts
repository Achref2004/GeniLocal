import { jwtDecode } from 'jwt-decode';

/**
 * Get a user prefix from the JWT token to separate local storage per user.
 */
export function getUserPrefix(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'guest_';
    const decoded: any = jwtDecode(token);
    return decoded.sub ? `${decoded.sub}_` : 'guest_';
  } catch {
    return 'guest_';
  }
}

/**
 * Return a key prefixed by the current user id (email)
 */
export function getPrefixedKey(baseKey: string): string {
  return `${getUserPrefix()}${baseKey}`;
}
