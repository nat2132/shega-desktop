import defaultAvatar from '../assets/company.png';

const profileImages = (import.meta as any).glob('../assets/profile/*.png', { eager: true, import: 'default' });

export const AVATAR_OPTIONS = Object.values(profileImages) as string[];

export const DEFAULT_AVATAR = defaultAvatar;

const baseName = (url: string) => {
  const clean = url.split('?')[0];
  return clean.split('/').pop() || clean;
};

const profileId = (v: string) => {
  const m = v.toLowerCase().match(/profile(\d+)/);
  return m ? Number(m[1]) : null;
};

export const avatarFileNameFrom = (src: string): string => {
  const id = profileId(baseName(src));
  return id != null ? `profile${id}.png` : baseName(src);
};

const normalize = (v: string) => v.toLowerCase().replace(/\.[a-z0-9]+$/, '');

export function resolveAvatar(value?: string | null, fallback?: string): string {
  const val = typeof value === 'string' ? value.trim() : '';
  const fb = fallback || DEFAULT_AVATAR;
  if (!val) return fb;
  if (val.startsWith('data:')) return val;
  if (val.startsWith('http://') || val.startsWith('https://') || val.includes('/')) return val;
  const id = profileId(val);
  if (id != null) {
    const found = AVATAR_OPTIONS.find(opt => profileId(baseName(opt)) === id);
    if (found) return found;
  }
  const norm = normalize(val);
  const found = AVATAR_OPTIONS.find(opt => normalize(baseName(opt)).includes(norm));
  return found || fb;
}