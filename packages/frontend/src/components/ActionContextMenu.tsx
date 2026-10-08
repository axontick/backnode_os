import React, { useEffect, useRef } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  dividerAfter?: boolean;
  iconColor?: string;
}

interface ActionContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  align?: 'left' | 'right';
  onAddChild?: () => void;
  addChildLabel?: string;
  addChildIcon?: string;
  onAddSubFolder?: () => void;
  addSubFolderLabel?: string;
  addSubFolderIcon?: string;
  items?: ActionMenuItem[];
}

export const ActionContextMenu: React.FC<ActionContextMenuProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  align = 'right',
  onAddChild,
  addChildLabel = 'Add Item',
  addChildIcon = 'add',
  onAddSubFolder,
  addSubFolderLabel = 'Add Sub-folder',
  addSubFolderIcon = 'create_new_folder',
  items,
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
      } min-w-[155px] bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-1 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none`}
    >
      {items ? (
        items.map((it, idx) => (
          <React.Fragment key={idx}>
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                it.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] transition-colors text-left font-medium cursor-pointer ${
                it.danger
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950/30'
                  : 'text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/60'
              }`}
            >
              {it.icon && (
                <span
                  className={`material-symbols-outlined text-[15px] shrink-0 ${
                    it.iconColor || (it.danger ? 'text-red-400' : 'text-zinc-400')
                  }`}
                  aria-hidden="true"
                >
                  {it.icon}
                </span>
              )}
              <span className="truncate">{it.label}</span>
            </button>
            {it.dividerAfter && <div className="h-px bg-[#27272a] my-0.5" role="separator" />}
          </React.Fragment>
        ))
      ) : (
        <>
          {onAddChild && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/60 transition-colors text-left font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-orange-400" aria-hidden="true">
                {addChildIcon}
              </span>
              <span>{addChildLabel}</span>
            </button>
          )}

          {onAddSubFolder && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onAddSubFolder();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/60 transition-colors text-left font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-orange-400" aria-hidden="true">
                {addSubFolderIcon}
              </span>
              <span>{addSubFolderLabel}</span>
            </button>
          )}

          {(onAddChild || onAddSubFolder) && (onEdit || onDelete) && (
            <div className="h-px bg-[#27272a] my-0.5" role="separator" />
          )}

          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/60 transition-colors text-left font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-zinc-400" aria-hidden="true">
                edit
              </span>
              <span>{editLabel}</span>
            </button>
          )}

          {onEdit && onDelete && (
            <div className="h-px bg-[#27272a] my-0.5" role="separator" />
          )}

          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-red-400" aria-hidden="true">
                delete
              </span>
              <span>{deleteLabel}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
