import React from 'react';

interface LogoMarkProps {
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Anviksa logo"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2.5" y="2.5" width="35" height="35" rx="10" fill="#D4A373" />
      <rect x="2.5" y="2.5" width="35" height="35" rx="10" stroke="#C59465" />
      <path
        d="M11 27.5L18.4 11.5C18.95 10.3 21.05 10.3 21.6 11.5L29 27.5"
        stroke="#342F27"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.25 20.75H24.75" stroke="#342F27" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="20.75" r="2.7" fill="#FEFAE0" stroke="#342F27" strokeWidth="1.6" />
    </svg>
  );
};
