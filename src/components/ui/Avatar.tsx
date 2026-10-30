import React from 'react';
import { clsx } from 'clsx';
import { getInitials, stringToColor } from '../../utils';

interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const onlineDotSize = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-4 h-4 border-2',
};

export function Avatar({ name, photoURL, size = 'md', online, className }: AvatarProps) {
  const initials = getInitials(name || '?');
  const bgColor = stringToColor(name || '?');

  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={`${name}'s avatar`}
          className={clsx('rounded-full object-cover', sizeMap[size])}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-semibold text-white select-none',
            sizeMap[size]
          )}
          style={{ backgroundColor: bgColor }}
          aria-label={name}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-white',
            onlineDotSize[size],
            online ? 'bg-success' : 'bg-gray-400'
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
