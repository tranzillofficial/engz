// ============================================================
// Avatar Component — Engz Design System
// ============================================================

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  role?: 'customer' | 'driver' | 'agent' | 'admin';
}

function getInitials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] ?? '؟';
  return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '');
}

export function Avatar({ name, src, size = 'md', role }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'صورة المستخدم'}
        className={['avatar', `avatar-${size}`, role ? `avatar-${role}` : ''].filter(Boolean).join(' ')}
      />
    );
  }

  return (
    <div
      className={['avatar', `avatar-${size}`, role ? `avatar-${role}` : 'avatar-default'].filter(Boolean).join(' ')}
      aria-label={name ?? 'مستخدم'}
    >
      <span className="avatar-initials">{getInitials(name)}</span>
    </div>
  );
}
