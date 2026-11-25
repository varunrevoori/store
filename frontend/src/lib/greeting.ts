export function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function displayName(meta?: { full_name?: string }, email?: string | null): string {
  const name = meta?.full_name?.trim();
  if (name) return name.split(' ')[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}