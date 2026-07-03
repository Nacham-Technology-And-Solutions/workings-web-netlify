import React from 'react';
import { getUserInitials } from '@/utils/userHelpers';

type UserAvatarSize = 'sm' | 'md';

const sizeStyles: Record<UserAvatarSize, { container: string; text: string }> = {
  sm: {
    container: 'w-10 h-10',
    text: 'text-sm',
  },
  md: {
    container: 'w-20 h-20 sm:w-24 sm:h-24',
    text: 'text-2xl sm:text-3xl',
  },
};

interface UserAvatarProps {
  name?: string;
  email?: string;
  photoUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  photoUrl,
  size = 'sm',
  className = '',
}) => {
  const initials = getUserInitials(name);
  const styles = sizeStyles[size];

  return (
    <div
      className={`${styles.container} bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-300 ${className}`}
      aria-label={photoUrl ? 'Profile photo' : `Profile initials: ${initials}`}
      title={name || email || 'User'}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={`text-gray-700 font-semibold ${styles.text}`}>{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;
