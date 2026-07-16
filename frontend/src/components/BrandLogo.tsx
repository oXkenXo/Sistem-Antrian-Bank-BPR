import React from 'react';

export default function BrandLogo({ className = "", lightText = false }: { className?: string; lightText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        alt="BPR Kerta Raharja Logo" 
        className="h-8 w-auto object-contain shrink-0" 
        src="https://bankkertaraharja.co.id/assets/img/logo.png"
      />
      <img 
        alt="BPR Logo" 
        className="h-8 w-auto object-contain shrink-0 border-l pl-3 border-gray-300" 
        src="https://bankkertaraharja.co.id/assets/img/Logo_BPR.png"
      />
    </div>
  );
}
