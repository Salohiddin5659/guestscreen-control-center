import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSLine, RiCheckLine, RiSearchLine } from 'react-icons/ri';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  menuClassName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className = '',
  containerClassName = '',
  menuClassName = '',
  icon: LeadingIcon,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUpwards: boolean;
  }>({
    left: 0,
    width: 0,
    openUpwards: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isFullWidth = className.includes('w-full') || containerClassName.includes('w-full');

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;

    const calculatedWidth = isFullWidth ? rect.width : Math.max(rect.width, 220);
    let left = rect.left;
    if (left + calculatedWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - calculatedWidth - 12);
    }

    setCoords({
      top: shouldOpenUpwards ? undefined : rect.bottom + 6,
      bottom: shouldOpenUpwards ? viewportHeight - rect.top + 6 : undefined,
      left: Math.max(12, left),
      width: calculatedWidth,
      openUpwards: shouldOpenUpwards,
    });
  }, [isFullWidth]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`relative text-left ${
        isFullWidth ? 'w-full block' : 'inline-block'
      } ${containerClassName}`}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`glass-input flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium cursor-pointer transition-all duration-150 select-none ${
          isOpen ? 'border-[#2563EB] ring-1 ring-[#2563EB]/40 bg-[#151d2f]' : 'hover:border-slate-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {LeadingIcon && <LeadingIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
          {selectedOption?.icon && <selectedOption.icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          <span className="truncate text-slate-200">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <RiArrowDownSLine
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: coords.openUpwards ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.openUpwards ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.top !== undefined ? `${coords.top}px` : 'auto',
                  bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                  maxHeight: '280px',
                  zIndex: 999999,
                }}
                className={`overflow-hidden flex flex-col bg-[#111928]/95 border border-[#233148] rounded-xl shadow-2xl backdrop-blur-2xl p-1.5 ${menuClassName}`}
              >
                {options.length > 7 && (
                  <div className="p-1 pb-1.5 border-b border-white/10 mb-1">
                    <div className="relative flex items-center">
                      <RiSearchLine className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#182234] border border-[#2a3a54] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="overflow-y-auto space-y-0.5 custom-scrollbar flex-1 max-h-[220px]">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      Ничего не найдено
                    </div>
                  ) : (
                    filteredOptions.map((option) => {
                      const isSelected = option.value === value;
                      const OptionIcon = option.icon;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {OptionIcon && (
                              <OptionIcon
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isSelected ? 'text-white' : 'text-slate-400'
                                }`}
                              />
                            )}
                            <span className="truncate">{option.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {option.badge && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#182030] text-slate-400 border border-[#232b40]'
                                }`}
                              >
                                {option.badge}
                              </span>
                            )}
                            {isSelected && <RiCheckLine className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default CustomDropdown;
