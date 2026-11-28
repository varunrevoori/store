import { Search, X } from 'lucide-react';
import type { InputHTMLAttributes, Ref } from 'react';

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className' | 'value' | 'onChange' | 'size'
> & {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  size?: 'md' | 'sm';
  showShortcutHint?: boolean;
  inputRef?: Ref<HTMLInputElement>;
};

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  inputClassName = '',
  size = 'md',
  showShortcutHint = false,
  inputRef,
  id,
  'aria-label': ariaLabel,
  ...rest
}: Props) {
  const hasValue = value.length > 0;

  return (
    <div
      className={`search-field ${size === 'sm' ? 'search-field-sm' : ''} ${className}`.trim()}
      role="search"
    >
      <Search size={size === 'sm' ? 15 : 16} className="search-field-icon" aria-hidden />
      <input
        ref={inputRef}
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        className={`inp search-field-input ${inputClassName}`.trim()}
        placeholder={placeholder}
        value={value}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {hasValue ? (
        <button
          type="button"
          className="search-field-clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <X size={14} />
        </button>
      ) : showShortcutHint ? (
        <span className="kbd search-field-kbd">
          {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'} K
        </span>
      ) : null}
    </div>
  );
}