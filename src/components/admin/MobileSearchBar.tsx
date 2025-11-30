import React, { useState, useEffect, useRef } from 'react';

interface MobileSearchBarProps {
  value?: string;  // ⭐ THÊM
  onChange: (query: string) => void;  // ⭐ ĐỔI từ onSearch
  placeholder?: string;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value: externalValue = '',  // ⭐ THÊM
  onChange,  // ⭐ ĐỔI
  placeholder = 'Tìm kiếm email, UID...'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [query, setQuery] = useState(externalValue);  // ⭐ SỬ DỤNG external value
  const inputRef = useRef<HTMLInputElement>(null);

  // ⭐ SYNC external value với internal state
  useEffect(() => {
    setQuery(externalValue);
  }, [externalValue]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(query);  // ⭐ ĐỔI từ onSearch
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onChange]);

  const handleClear = () => {
    setQuery('');
    onChange('');  // ⭐ ĐỔI
  };

  return (
    <>
      {/* Search Bar */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => !query && setIsActive(false)}
          placeholder={placeholder}
          className="w-full bg-white/10 text-white placeholder-white/50 rounded-full px-12 py-3 border border-white/20 focus:border-yellow-400 focus:outline-none transition-all"
        />
        
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
          🔍
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white active:scale-90 transition-all"
          >
            ✕
          </button>
        )}
      </div>

      {/* Full Screen Overlay when active */}
      {isActive && !query && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30" onClick={() => setIsActive(false)} />
      )}
    </>
  );
};