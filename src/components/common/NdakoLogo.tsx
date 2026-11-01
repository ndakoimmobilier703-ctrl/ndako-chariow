import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface NdakoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  adminBadge?: boolean;
  clickable?: boolean;
  href?: string;
  onTripleClick?: () => void;
}

export const OFFICIAL_LOGO_URL =
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-ezcyxap9ijgg/app-ezdypxs5wge9/20261010/file_0000000057d082438752714fcf2f37a8.png';

export const NdakoLogo: React.FC<NdakoLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  adminBadge = false,
  clickable = true,
  href = '/',
  onTripleClick,
}) => {
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeStyles = {
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current === 3) {
      // Secret Admin Access triggered by 3 quick clicks on the official logo!
      clickCountRef.current = 0;
      if (onTripleClick) {
        onTripleClick();
      } else {
        navigate('/admin');
      }
      return;
    }

    // Set a timer to reset click count or navigate to home if it was a single click
    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1 && clickable) {
        navigate(href);
      }
      clickCountRef.current = 0;
    }, 400);
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-2 select-none cursor-pointer transition-transform duration-200 active:scale-95 group ${className}`}
      title="Ndako - Immobilier international"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && clickable) navigate(href);
      }}
    >
      <div className="relative flex items-center shrink-0">
        <img
          src={OFFICIAL_LOGO_URL}
          alt="Ndako Logo"
          className={`${sizeStyles} w-auto object-contain drop-shadow-xs transition-opacity group-hover:opacity-95`}
          onError={(e) => {
            // Fallback to local copy if network fails
            (e.target as HTMLImageElement).src = '/ndako-logo.png';
          }}
        />
        {adminBadge && (
          <span className="ml-2 px-2 py-0.5 rounded-md bg-[#0F3E6D] text-white font-bold text-[10px] uppercase tracking-wider border border-white/20 shadow-xs">
            Admin
          </span>
        )}
      </div>

      {showTagline && (
        <span className="text-[11px] font-medium text-muted-foreground tracking-normal hidden sm:inline-block">
          Immobilier international
        </span>
      )}
    </div>
  );
};
