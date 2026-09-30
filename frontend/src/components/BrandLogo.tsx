import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  subtitle = 'Smart Student Face Attendance System',
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* 3D Cap & Glowing Book Icon Container */}
      <div className={`relative flex items-center justify-center transition-transform hover:scale-105 ${
        size === 'lg' ? 'w-24 h-24 mb-3' : size === 'sm' ? 'w-10 h-10 mb-1' : 'w-16 h-16 mb-2'
      }`}>
        <img
          src="/assets/grad_cap_book.jpg"
          alt="SmartAttend Logo"
          className="w-full h-full object-contain rounded-2xl drop-shadow-md"
        />
      </div>

      {/* Brand Title */}
      <div className={`flex items-center justify-center font-heading font-extrabold tracking-tight ${
        size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
      }`}>
        <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>Smart</span>
        <span className="text-[#1d72fe]">Attend</span>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={`font-medium ${
          size === 'lg' ? 'text-xs mt-1' : size === 'sm' ? 'text-[10px]' : 'text-xs mt-0.5'
        } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
