'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { apiGet } from '@/lib/api';

type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type LocationAutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  theme?: 'dark' | 'light';
  disabled?: boolean;
};

export function LocationAutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
  theme = 'dark',
  disabled,
}: LocationAutocompleteInputProps) {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestIdRef = useRef(0);
  const sessionTokenRef = useRef('');

  function createSessionToken() {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
  }

  function ensureSessionToken() {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = createSessionToken();
    }

    return sessionTokenRef.current;
  }

  function clearSessionToken() {
    sessionTokenRef.current = '';
  }

  function selectSuggestion(suggestion: PlaceSuggestion) {
    onChange(suggestion.description);
    setFocused(false);
    setSuggestions([]);
    setActiveIndex(-1);
    clearSessionToken();
  }

  useEffect(() => {
    const query = value.trim().replace(/\s+/g, ' ');
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!focused || query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const sessionToken = ensureSessionToken();
        const results = await apiGet<PlaceSuggestion[]>(
          `/smart-routes/places?input=${encodeURIComponent(
            query,
          )}&sessionToken=${encodeURIComponent(sessionToken)}`,
        );

        if (requestIdRef.current === requestId) {
          setSuggestions(results);
          setActiveIndex(results.length ? 0 : -1);
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setSuggestions([]);
          setActiveIndex(-1);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [focused, value]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) {
      if (event.key === 'Escape') {
        setFocused(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        selectSuggestion(suggestion);
      }
      return;
    }

    if (event.key === 'Escape') {
      setFocused(false);
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  const showPanel = focused && (loading || suggestions.length > 0);
  const panelClass =
    theme === 'light'
      ? 'border-black/10 bg-white/95 text-neutral-950 shadow-[0_22px_70px_rgba(0,0,0,0.16)]'
      : 'border-white/10 bg-[#0c0c0d]/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]';
  const itemClass =
    theme === 'light'
      ? 'hover:bg-neutral-950/[0.06] focus:bg-neutral-950/[0.06]'
      : 'hover:bg-white/[0.07] focus:bg-white/[0.07]';
  const activeItemClass =
    theme === 'light' ? 'bg-neutral-950/[0.06]' : 'bg-white/[0.07]';
  const secondaryTextClass =
    theme === 'light' ? 'text-neutral-500' : 'text-neutral-500';
  const footerClass =
    theme === 'light'
      ? 'border-black/10 text-neutral-500'
      : 'border-white/10 text-neutral-500';

  return (
    <div className="relative">
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          ensureSessionToken();
          setFocused(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setFocused(false);
            setActiveIndex(-1);
            clearSessionToken();
          }, 140);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        className={className}
      />

      {showPanel && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-2xl border p-2 backdrop-blur-2xl ${panelClass}`}
        >
          {loading && suggestions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-neutral-500">
              Finding places...
            </div>
          ) : null}

          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.placeId}-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full rounded-xl px-3 py-3 text-left outline-none transition ${itemClass} ${
                activeIndex === index ? activeItemClass : ''
              }`}
            >
              <span className="block text-sm font-semibold">
                {suggestion.mainText}
              </span>
              {suggestion.secondaryText ? (
                <span
                  className={`mt-1 block text-xs leading-5 ${secondaryTextClass}`}
                >
                  {suggestion.secondaryText}
                </span>
              ) : null}
            </button>
          ))}

          {suggestions.length > 0 ? (
            <div
              className={`mt-1 flex items-center justify-between border-t px-3 pt-2 text-[10px] uppercase tracking-[0.2em] ${footerClass}`}
            >
              <span>Choose a precise place</span>
              <span>Powered by Google</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
