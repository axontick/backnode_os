import React, { useEffect, useRef } from 'react';

interface ActionContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  align?: 'left' | 'right';
}

export const ActionContextMenu: React.FC<ActionContextMenuProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  align = 'right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Actions"
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-1 ${
        align === 'right' ? 'right-0' : 'left-0'
      } w-36 bg-white border border-[#d4c0d5]/60 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none`}
    >
      <button
        type="button"
        role="menuitem"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#504252] hover:text-[#9900c2] hover:bg-[#f4f2fd] transition-colors text-left font-medium"
      >
        <span className="material-symbols-outlined text-[15px] text-[#837284]" aria-hidden="true">edit</span>
        <span>{editLabel}</span>
      </button>

      <div className="h-px bg-[#d4c0d5]/30 my-0.5" role="separator" />

      <button
        type="button"
        role="menuitem"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left font-medium"
      >
        <span className="material-symbols-outlined text-[15px] text-rose-500" aria-hidden="true">delete</span>
        <span>{deleteLabel}</span>
      </button>
    </div>
  );
};
