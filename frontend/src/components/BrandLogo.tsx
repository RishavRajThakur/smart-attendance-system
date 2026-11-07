import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  theme?: 'light' | 'dark';
  layout?: 'vertical' | 'horizontal';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  subtitle = 'Smart Student Face Attendance System',
  theme = 'light',
  layout = 'horizontal'
}) => {
  const isDark = theme === 'dark';

  if (layout === 'horizontal') {
    return (
      <div className="flex items-center justify-center gap-3.5 select-none text-left">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center transition-transform hover:scale-105">
          <img
            src="/assets/grad_cap_book.jpg"
            alt="KIIT Logo"
            className="w-full h-full object-contain rounded-xl drop-shadow-sm"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center font-heading font-black tracking-tight text-xl leading-none">
            <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>Smart</span>
            <span className="text-[#1d72fe]">Attend</span>
          </div>
          {subtitle && (
            <p className={`text-[11px] font-semibold mt-1 tracking-tight leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* Logo Container */}
      <div className={`relative flex items-center justify-center transition-transform hover:scale-105 ${
        size === 'lg' ? 'w-14 h-14 mb-1.5' : size === 'sm' ? 'w-9 h-9 mb-1' : 'w-12 h-12 mb-1.5'
      }`}>
        <img
          src="/assets/grad_cap_book.jpg"
          alt="SmartAttend Logo"
          className="w-full h-full object-contain rounded-xl drop-shadow-sm"
        />
      </div>

      {/* Brand Title */}
      <div className={`flex items-center justify-center font-heading font-extrabold tracking-tight ${
        size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'
      }`}>
        <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>Smart</span>
        <span className="text-[#1d72fe]">Attend</span>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={`font-medium ${
          size === 'lg' ? 'text-[11px] mt-0.5' : size === 'sm' ? 'text-[10px]' : 'text-[11px] mt-0.5'
        } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
