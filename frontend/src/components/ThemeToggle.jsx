import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, Check } from 'lucide-react';

export default function ThemeToggle({ className = '', initialOpen = false }) {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (!initialOpen) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [initialOpen]);

  const activeThemeObj = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className={`theme-toggle-simple ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn-theme-trigger"
        aria-expanded={isOpen}
        aria-label="Change theme"
      >
        <span
          className="theme-dot-simple"
          style={{ backgroundColor: activeThemeObj.accentColor }}
        />
        <span>{activeThemeObj.label}</span>
        <ChevronDown size={14} className={isOpen ? 'rot-180' : ''} />
      </button>

      {isOpen && (
        <div className="theme-menu-simple" role="menu">
          {themes.map((item) => {
            const isActive = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(item.id);
                  setIsOpen(false);
                }}
                className={`theme-option-btn ${isActive ? 'active' : ''}`}
              >
                <span
                  className="theme-dot-simple"
                  style={{ backgroundColor: item.accentColor }}
                />
                <span>{item.label}</span>
                {isActive && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


