import type { User } from '../types';

export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23e2e8f0'/%3E%3Cpath d='M64 68c13.255 0 24-10.745 24-24s-10.745-24-24-24-24 10.745-24 24 10.745 24 24 24zm0 12c-17.673 0-48 8.87-48 26.5V116h96v-9.5c0-17.63-30.327-26.5-48-26.5z' fill='%2394a3b8'/%3E%3C/svg%3E";

export const DEFAULT_AVATARS = {
  admin: DEFAULT_AVATAR,
  faculty: DEFAULT_AVATAR,
  student: DEFAULT_AVATAR
};

export function getUserAvatar(user?: User | null, _fallbackRole: string = 'faculty'): string {
  if (user?.photo_url && user.photo_url.trim().length > 0) return user.photo_url;
  return DEFAULT_AVATAR;
}

export function handleAvatarError(e: React.SyntheticEvent<HTMLImageElement, Event>, _role: string = 'faculty') {
  e.currentTarget.src = DEFAULT_AVATAR;
}

