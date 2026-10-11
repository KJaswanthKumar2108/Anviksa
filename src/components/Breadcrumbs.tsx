import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; tab?: string }[];
  onTabChange?: (tab: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onTabChange }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#6B6255] py-2 mb-4 overflow-x-auto whitespace-nowrap">
      <button
        onClick={() => onTabChange?.('home')}
        className="hover:text-[#8B5E34] flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </button>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-[#DCD5BC] shrink-0" />
          {item.tab ? (
            <button
              onClick={() => onTabChange?.(item.tab!)}
              className="hover:text-[#8B5E34] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-[#342F27] truncate max-w-xs">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
