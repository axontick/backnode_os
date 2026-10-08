import React, { useEffect } from 'react';
import { TaskItem, SpaceFolder, CrmPipeline } from '../types';

export type DeletionTarget =
  | { type: 'task'; item: TaskItem }
  | { type: 'folder'; item: SpaceFolder }
  | { type: 'pipeline'; item: CrmPipeline };

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  task?: TaskItem | null;
  target?: DeletionTarget | null;
  onClose: () => void;
  onConfirmDelete?: (taskId: string) => void;
  onConfirmDeleteTarget?: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  task,
  target,
  onClose,
  onConfirmDelete,
  onConfirmDeleteTarget,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeTarget: DeletionTarget | null =
    target || (task ? { type: 'task', item: task } : null);

  if (!isOpen || !activeTarget) return null;

  const handleConfirm = () => {
    if (onConfirmDeleteTarget) {
      onConfirmDeleteTarget();
    } else if (activeTarget.type === 'task' && onConfirmDelete) {
      onConfirmDelete(activeTarget.item.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181b]/40 backdrop-blur-[4px] p-4 transition-all duration-200 select-none animate-in fade-in">
      {/* 480px Centered Destructive Alert Dialog Container */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-[480px] max-w-full bg-[#ffffff] rounded-2xl border border-zinc-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Top Alert Header with Warning Icon Badge and Close Button */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {/* 44px Warning Icon Badge */}
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">delete_forever</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                Destructive Action
              </span>
              <h2 id="delete-dialog-title" className="text-[17px] font-bold text-zinc-900 leading-tight">
                {activeTarget.type === 'folder' && 'Delete Folder Permanently?'}
                {activeTarget.type === 'pipeline' && 'Delete Pipeline Permanently?'}
                {activeTarget.type === 'task' && 'Delete Deliverable Permanently?'}
              </h2>
            </div>
          </div>

          {/* Close Button [X] with Esc Hint */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-100 transition-colors"
            title="Close modal"
          >
            <kbd className="font-mono text-[9px] bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded text-zinc-500 font-medium">
              Esc
            </kbd>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="px-6 space-y-4">
          {activeTarget.type === 'folder' && (
            <>
              {/* Impact Description & Folder Identifier */}
              <div className="text-zinc-600 text-[13px] leading-relaxed">
                Are you sure you want to delete folder{' '}
                <span className="font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ? This will permanently remove the folder and its{' '}
                <span className="font-semibold text-zinc-900">{activeTarget.item.items?.length || 0} sub-lists</span>.
              </div>

              {/* Alert chip */}
              <div className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">folder_off</span>
                <div className="text-[12px] leading-tight">
                  Contains {activeTarget.item.items?.length || 0} deliverable lists. Active workspace views will reset to the next available folder.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'pipeline' && (
            <>
              {/* Impact Description & Pipeline Identifier */}
              <div className="text-zinc-600 text-[13px] leading-relaxed">
                Are you sure you want to delete sales pipeline{' '}
                <span className="font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ? Its{' '}
                <span className="font-semibold text-zinc-900">{activeTarget.item.dealCount || 0} active deals</span> will have their pipeline assignment unlinked.
              </div>

              {/* Alert chip */}
              <div className="bg-violet-50/80 border border-violet-200 text-violet-900 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#9900c2] shrink-0">link_off</span>
                <div className="text-[12px] leading-tight">
                  Existing deals will be preserved and unassigned. Your active pipeline view will automatically switch to the remaining pipelines.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'task' && (
            <>
              {/* Impact Description & Deliverable Identifier */}
              <div className="text-zinc-600 text-[13px] leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[12px]">
                  {activeTarget.item.id}
                </span>{' '}
                <strong className="text-zinc-900 font-medium">{activeTarget.item.title}</strong>? This will permanently
                erase the deliverable, all activity logs, and its{' '}
                <span className="font-semibold text-zinc-900">
                  {activeTarget.item.subtasks?.length || 4} linked subtasks
                </span>.
              </div>

              {/* Linked CRM Deal Alert Chip */}
              <div className="bg-violet-50/80 border border-violet-200 text-violet-900 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#9900c2] shrink-0">
                  link_off
                </span>
                <div className="text-[12px] leading-tight">
                  <span className="font-semibold text-[#9900c2]">Linked CRM Deal:</span>{' '}
                  {activeTarget.item.linkedCrmDeal?.name
                    ? `${activeTarget.item.linkedCrmDeal.name} (${activeTarget.item.linkedCrmDeal.value} ARR)`
                    : 'Acme Corp ($180k ARR)'}{' '}
                  — deal link will be severed immediately.
                </div>
              </div>
            </>
          )}

          {/* Local-First Storage Notice Box */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">
              warning
            </span>
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                Local Permanent Deletion
              </div>
              <p className="text-[11.5px] leading-relaxed text-amber-900/90">
                Item will be purged immediately from local-first storage (
                <span className="font-mono font-semibold">transaction commit 0.2ms</span>). This
                change will propagate across peer replication clusters. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <div className="mt-6 px-6 py-4 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-between">
          {/* Left Side: Status / Engine Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-zinc-500 font-medium">
            <span className="text-amber-600 font-bold">⚡</span>
            <span>Immediate purge commit</span>
          </div>

          {/* Right Side: Secondary Cancel + Destructive Primary Action */}
          <div className="flex items-center gap-2.5">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-200 bg-white hover:bg-zinc-100 rounded-full px-4 py-1.5 text-zinc-700 text-sm font-medium transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Cancel</span>
              <kbd className="font-mono text-[9px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-1 rounded">
                Esc
              </kbd>
            </button>

            {/* Primary Destructive Action */}
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-5 py-1.5 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

