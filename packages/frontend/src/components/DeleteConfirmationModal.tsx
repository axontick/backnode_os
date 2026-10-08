import React, { useEffect } from 'react';
import { TaskItem, SpaceFolder, CrmPipeline, SpaceSubFolder, CrmPipelineSubFolder } from '../types';

export type DeletionTarget =
  | { type: 'task'; item: TaskItem }
  | { type: 'folder'; item: SpaceFolder }
  | { type: 'pipeline'; item: CrmPipeline }
  | { type: 'subfolder'; item: SpaceSubFolder; folderId: string }
  | { type: 'pipeline-subfolder'; item: CrmPipelineSubFolder; pipelineId: string };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 transition-all duration-200 select-none animate-in fade-in"
      onClick={onClose}
    >
      {/* 580px Centered Destructive Alert Dialog Container */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-[580px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Alert Header with Warning Icon Badge and Close Button - Sticky */}
        <div className="shrink-0 p-6 pb-4 flex items-start justify-between bg-[#121214] border-b border-[#27272a]/50">
          <div className="flex items-center gap-3.5">
            {/* 40px Warning Icon Badge */}
            <div className="w-10 h-10 rounded-[6px] bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">delete_forever</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                Destructive Action
              </span>
              <h2 id="delete-dialog-title" className="text-[17px] font-bold text-zinc-100 leading-tight font-headline">
                {activeTarget.type === 'folder' && 'Delete Folder Permanently?'}
                {activeTarget.type === 'pipeline' && 'Delete Pipeline Permanently?'}
                {activeTarget.type === 'subfolder' && 'Delete Sub-folder Permanently?'}
                {activeTarget.type === 'pipeline-subfolder' && 'Delete Pipeline Sub-folder?'}
                {activeTarget.type === 'task' && 'Delete Deliverable Permanently?'}
              </h2>
            </div>
          </div>

          {/* Close Button [X] with Esc Hint */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 p-1 rounded-[4px] hover:bg-[#18181b] transition-colors cursor-pointer"
            title="Close modal"
          >
            <kbd className="font-mono text-[9px] bg-[#18181b] border border-[#27272a] px-1 py-0.5 rounded-[3px] text-zinc-400 font-medium">
              Esc
            </kbd>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
          {activeTarget.type === 'folder' && (
            <>
              {/* Impact Description & Folder Identifier */}
              <div className="text-zinc-300 text-[13px] leading-relaxed">
                Are you sure you want to delete folder{' '}
                <span className="font-semibold text-zinc-100 bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a] font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ? This will permanently remove the folder and its{' '}
                <span className="font-semibold text-zinc-100">{activeTarget.item.items?.length || 0} sub-lists</span>.
              </div>

              {/* Alert chip */}
              <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-2.5 rounded-[6px] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">folder_off</span>
                <div className="text-[12px] leading-tight">
                  Contains {activeTarget.item.items?.length || 0} deliverable lists. Active workspace views will reset to the next available folder.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'subfolder' && (
            <>
              <div className="text-zinc-300 text-[13px] leading-relaxed">
                Are you sure you want to delete sub-folder{' '}
                <span className="font-semibold text-zinc-100 bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a] font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ? This will permanently remove this sub-folder section and its{' '}
                <span className="font-semibold text-zinc-100">{activeTarget.item.items?.length || 0} lists</span>.
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-2.5 rounded-[6px] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">folder_off</span>
                <div className="text-[12px] leading-tight">
                  Lists inside this sub-folder will be removed. Active view will reset if necessary.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'pipeline-subfolder' && (
            <>
              <div className="text-zinc-300 text-[13px] leading-relaxed">
                Are you sure you want to delete pipeline sub-folder{' '}
                <span className="font-semibold text-zinc-100 bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a] font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ?
              </div>

              <div className="bg-orange-950/20 border border-orange-500/30 text-orange-300 text-xs px-3.5 py-2.5 rounded-[6px] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-orange-400 shrink-0">account_tree</span>
                <div className="text-[12px] leading-tight">
                  Deals tagged to this cohort will remain in the parent pipeline unsegregated.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'pipeline' && (
            <>
              {/* Impact Description & Pipeline Identifier */}
              <div className="text-zinc-300 text-[13px] leading-relaxed">
                Are you sure you want to delete sales pipeline{' '}
                <span className="font-semibold text-zinc-100 bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a] font-mono text-[12px]">
                  {activeTarget.item.name}
                </span>
                ? Its{' '}
                <span className="font-semibold text-zinc-100">{activeTarget.item.dealCount || 0} active deals</span> will have their pipeline assignment unlinked.
              </div>

              {/* Alert chip */}
              <div className="bg-orange-950/20 border border-orange-500/30 text-orange-300 text-xs px-3.5 py-2.5 rounded-[6px] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-orange-400 shrink-0">link_off</span>
                <div className="text-[12px] leading-tight">
                  Existing deals will be preserved and unassigned. Your active pipeline view will automatically switch to the remaining pipelines.
                </div>
              </div>
            </>
          )}

          {activeTarget.type === 'task' && (
            <>
              {/* Impact Description & Deliverable Identifier */}
              <div className="text-zinc-300 text-[13px] leading-relaxed">
                Are you sure you want to delete deliverable{' '}
                <span className="font-semibold text-zinc-100 bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a] font-mono text-[12px]">
                  {activeTarget.item.id} — {activeTarget.item.title}
                </span>
                ?
              </div>

              {/* Deliverable Metadata Summary Card */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500 font-mono text-[11px]">Lifecycle Status:</span>
                  <span className="font-semibold text-zinc-200">{activeTarget.item.status}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500 font-mono text-[11px]">Priority:</span>
                  <span
                    className={`font-semibold font-mono text-[11px] ${
                      activeTarget.item.priority === 'Urgent'
                        ? 'text-red-400'
                        : activeTarget.item.priority === 'High'
                        ? 'text-orange-400'
                        : 'text-zinc-300'
                    }`}
                  >
                    {activeTarget.item.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500 font-mono text-[11px]">Assigned Operator:</span>
                  <span className="text-zinc-200">{activeTarget.item.assignee?.name || 'Unassigned'}</span>
                </div>
                {activeTarget.item.subtasks?.length > 0 && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[11px]">Subtasks Purged:</span>
                    <span className="font-mono text-zinc-300">
                      {activeTarget.item.subtasks.filter((s) => s.done).length} / {activeTarget.item.subtasks.length} done
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Permanent Deletion Advisory Warning Banner */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-[6px] p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">
              warning
            </span>
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                Local Permanent Deletion
              </div>
              <p className="text-[11.5px] leading-relaxed text-amber-200/80">
                Item will be purged immediately from local-first storage (
                <span className="font-mono font-semibold text-amber-100">transaction commit 0.2ms</span>). This
                change will propagate across peer replication clusters. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>

        {/* Dialog Sticky Footer Actions */}
        <div className="shrink-0 px-6 py-4 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between">
          {/* Left Side: Status / Engine Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-zinc-400 font-medium">
            <span className="text-amber-500 font-bold">⚡</span>
            <span>Immediate purge commit</span>
          </div>

          {/* Right Side: Secondary Cancel + Destructive Primary Action */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#27272a] bg-[#121214] hover:bg-zinc-800 rounded-[6px] px-4 py-1.5 text-zinc-300 text-xs font-medium transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Cancel</span>
              <kbd className="font-mono text-[9px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-1 rounded-[3px]">
                Esc
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] px-5 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
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
