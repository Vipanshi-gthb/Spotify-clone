import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onClear, placeholder = 'What do you want to listen to?' }) {
  return (
    <div className="spotify-search-bar-wrap">
      <Search size={20} className="search-input-icon" />
      <input
        type="text"
        className="spotify-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={onClear}
          title="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
