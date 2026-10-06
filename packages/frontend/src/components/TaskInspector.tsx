import React, { useState } from 'react';
import { TaskItem, TeamMember, TaskStatus } from '../types';
import { AssigneePopover } from './AssigneePopover';
import { StatusTransitionPopover } from './StatusTransitionPopover';

interface TaskInspectorProps {
  task: TaskItem;
  members: TeamMember[];
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskItem) => void;
  onRequestDelete?: (task: TaskItem) => void;
}

export const TaskInspector: React.FC<TaskInspectorProps> = ({
  task,
  members,
  onClose,
  onUpdateTask,
  onRequestDelete,
}) => {
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [titleText, setTitleText] = useState(task.title);
  const [activeTab, setActiveTab] = useState<'spec' | 'preview'>('spec');
  const [commentText, setCommentText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Sync title on task prop change
  React.useEffect(() => {
    setTitleText(task.title);
    setIsAssigneePopoverOpen(false);
    setIsStatusPopoverOpen(false);
  }, [task.id]);

  const handleTitleBlur = () => {
    if (titleText.trim() && titleText !== task.title) {
      onUpdateTask({ ...task, title: titleText.trim() });
    }
  };

  const handleAssigneeChange = (member: TeamMember) => {
    const updated = {
      ...task,
      assignee: member,
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'assignee' as const,
          author: 'Alex Wong',
          initials: 'AW',
          time: 'Just now',
          text: `reassigned task to ${member.name}`,
        },
        ...task.activity,
      ],
    };
    onUpdateTask(updated);
  };

  const handleStatusChange = (status: TaskStatus) => {
    const updated = {
      ...task,
      status,
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'status' as const,
          author: 'Alex Wong',
          initials: 'AW',
          time: 'Just now',
          text: `transitioned status to ${status}`,
        },
        ...task.activity,
      ],
    };
    onUpdateTask(updated);
  };

  const handleToggleSubtask = (subId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subId ? { ...st, done: !st.done } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSt = {
      id: `sub-${Date.now()}`,
      text: newSubtaskText.trim(),
      done: false,
      author: 'AW',
      time: 'Just now',
    };
    onUpdateTask({ ...task, subtasks: [...task.subtasks, newSt] });
    setNewSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `act-${Date.now()}`,
      type: 'comment' as const,
      author: 'Alex Wong',
      initials: 'AW',
      role: 'Lead Designer',
      time: 'Just now',
      text: commentText.trim(),
    };
    onUpdateTask({
      ...task,
      activity: [newComment, ...task.activity],
    });
    setCommentText('');
  };

  const doneSubtasksCount = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((doneSubtasksCount / totalSubtasks) * 100) : 0;

  return (
    <section className="absolute top-0 right-0 bottom-0 w-[580px] max-w-[95vw] bg-white border-l border-[#d4c0d5]/40 shadow-2xl z-40 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Slide-Over Header */}
      <div className="border-b border-[#d4c0d5]/30 px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono text-[#837284]">
          <span className="hover:text-[#9900c2] cursor-pointer">Task Spaces</span>
          <span>/</span>
          <span className="hover:text-[#9900c2] cursor-pointer">Engineering</span>
          <span>/</span>
          <span className="hover:text-[#9900c2] cursor-pointer">{task.targetCycle.split(' - ')[0]}</span>
          <span>/</span>
          <span className="bg-[#9900c2]/10 text-[#9900c2] font-bold px-2 py-0.5 rounded border border-[#9900c2]/20">
            {task.id}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#837284]">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert(`Permalink for ${task.id} copied to clipboard!`);
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#eeedf7] hover:text-[#1a1b22] transition-colors"
            title="Copy task link"
          >
            <span className="material-symbols-outlined text-[17px]">link</span>
          </button>
          <button
            onClick={() => alert(`Expanded fullscreen view for ${task.id}`)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#eeedf7] hover:text-[#1a1b22] transition-colors"
            title="Expand Fullscreen"
          >
            <span className="material-symbols-outlined text-[17px]">open_in_full</span>
          </button>
          {onRequestDelete && (
            <button
              onClick={() => onRequestDelete(task)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete Deliverable Permanently..."
            >
              <span className="material-symbols-outlined text-[17px]">delete</span>
            </button>
          )}
          <div className="h-4 w-px bg-[#d4c0d5]/40 mx-1"></div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#eeedf7] hover:text-[#1a1b22] transition-colors"
            title="Close Panel (Esc)"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Slide-Over Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5 relative">
        {/* Title & Badges Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            {/* Priority Badge */}
            <span className="bg-[#9900c2] text-white font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[12px]">priority_high</span>
              <span>{task.priority} Priority</span>
            </span>

            {/* Due Date */}
            <span className="bg-[#f4f2fd] text-[#1a1b22] border border-[#d4c0d5]/40 font-mono text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#835000]">calendar_today</span>
              <span>Due {task.dueDate}</span>
            </span>

            {/* Git Branch */}
            <span className="bg-[#f4f2fd] text-[#504252] border border-[#d4c0d5]/30 font-mono text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">commit</span>
              <span>{task.gitBranch}</span>
            </span>
          </div>

          {/* Editable Title Field */}
          <div className="group relative">
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full font-bold text-lg text-[#1a1b22] bg-transparent border-0 border-b border-transparent hover:border-[#d4c0d5] focus:border-[#9900c2] focus:ring-0 p-0 pb-1 transition-colors leading-snug cursor-text"
            />
          </div>
        </div>

        {/* Properties Matrix Grid */}
        <div className="bg-[#f4f2fd]/60 rounded-xl p-3.5 border border-[#d4c0d5]/30 grid grid-cols-2 gap-y-3.5 gap-x-4 relative">
          {/* Assignee Field (ACTIVE ANCHOR ELEMENT) */}
          <div className="flex flex-col gap-1 relative">
            <span className="font-mono text-[10px] text-[#837284] font-medium">ASSIGNEE</span>
            <div
              onClick={() => {
                setIsAssigneePopoverOpen(!isAssigneePopoverOpen);
                setIsStatusPopoverOpen(false);
              }}
              className="flex items-center justify-between p-2 rounded bg-white border border-[#9900c2]/50 shadow-sm cursor-pointer hover:border-[#9900c2] hover:ring-2 hover:ring-[#9900c2]/10 transition-all"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
                  style={{
                    backgroundColor: task.assignee.avatarBg || '#9900c2',
                    color: task.assignee.avatarColor || '#ffffff',
                  }}
                >
                  {task.assignee.initials}
                </div>
                <span className="text-xs font-semibold text-[#1a1b22]">
                  {task.assignee.name}
                </span>
              </div>
              <span className="material-symbols-outlined text-[#9900c2] text-[16px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Status Field (ACTIVE ANCHOR ELEMENT) */}
          <div className="flex flex-col gap-1 relative">
            <span className="font-mono text-[10px] text-[#837284] font-medium">STATUS</span>
            <div
              onClick={() => {
                setIsStatusPopoverOpen(!isStatusPopoverOpen);
                setIsAssigneePopoverOpen(false);
              }}
              className="flex items-center justify-between p-2 rounded bg-white border border-[#9900c2]/50 shadow-sm cursor-pointer hover:border-[#9900c2] hover:ring-2 hover:ring-[#9900c2]/10 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9900c2] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#9900c2]">
                  {task.status}
                </span>
              </div>
              <span className="material-symbols-outlined text-[#9900c2] text-[16px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Estimation Row */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#837284] font-medium">ESTIMATION</span>
            <div className="flex items-center gap-2">
              <span className="bg-white border border-[#d4c0d5]/40 px-2 py-0.5 rounded font-mono text-[11px] font-semibold text-[#1a1b22]">
                {task.estimation.hours} hrs
              </span>
              <span className="font-mono text-[11px] text-[#504252] bg-[#eeedf7] px-2 py-0.5 rounded font-medium">
                {task.estimation.points} pts
              </span>
            </div>
          </div>

          {/* Target Cycle / Sprint */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#837284] font-medium">TARGET CYCLE</span>
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#d4c0d5]/40 rounded text-xs text-[#1a1b22]">
              <span className="material-symbols-outlined text-[#9900c2] text-[14px]">sprint</span>
              <span className="truncate">{task.targetCycle}</span>
            </div>
          </div>

          {/* Linked CRM Deal */}
          {task.linkedCrmDeal && (
            <div className="col-span-2 flex items-center justify-between pt-2 border-t border-[#d4c0d5]/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#837284] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">handshake</span>
                  Linked CRM Deal:
                </span>
                <span className="bg-white hover:bg-[#eeedf7] border border-[#d4c0d5]/40 px-2.5 py-0.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#835000]"></span>
                  <span className="font-semibold text-[#9900c2] group-hover:underline">
                    {task.linkedCrmDeal.name}
                  </span>
                  <span className="material-symbols-outlined text-[12px] text-[#837284]">
                    open_in_new
                  </span>
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#837284] bg-[#eeedf7] px-2 py-0.5 rounded font-semibold">
                High Value
              </span>
            </div>
          )}
        </div>

        {/* Popover Placements */}
        {isAssigneePopoverOpen && (
          <AssigneePopover
            currentAssigneeId={task.assignee.id}
            members={members}
            onSelectMember={handleAssigneeChange}
            onClose={() => setIsAssigneePopoverOpen(false)}
          />
        )}

        {isStatusPopoverOpen && (
          <StatusTransitionPopover
            currentStatus={task.status}
            timeInStage={task.timeInStage}
            onSelectStatus={handleStatusChange}
            onClose={() => setIsStatusPopoverOpen(false)}
          />
        )}

        {/* Specifications & Context Description Tabbed Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('spec')}
                className={`text-xs font-semibold pb-1.5 -mb-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'spec'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2]'
                    : 'text-[#837284] hover:text-[#1a1b22]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>Specification</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`text-xs font-medium pb-1.5 -mb-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2]'
                    : 'text-[#837284] hover:text-[#1a1b22]'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Rich text mini toolbar */}
            <div className="flex items-center gap-1 text-[#837284]">
              <button className="p-1 hover:bg-[#eeedf7] rounded" title="Bold">
                <span className="material-symbols-outlined text-[15px]">format_bold</span>
              </button>
              <button className="p-1 hover:bg-[#eeedf7] rounded" title="Italic">
                <span className="material-symbols-outlined text-[15px]">format_italic</span>
              </button>
              <button className="p-1 hover:bg-[#eeedf7] rounded" title="Code">
                <span className="material-symbols-outlined text-[15px]">code</span>
              </button>
              <span className="font-mono text-[10px] text-[#9900c2] bg-[#fbd7ff]/40 px-1 rounded">
                Markdown
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#d4c0d5]/30 rounded-lg p-3 text-xs leading-relaxed text-[#1a1b22] space-y-2">
            <p className="text-[#1a1b22]">{task.description}</p>
            <div className="p-2.5 rounded bg-[#f4f2fd] border-l-2 border-[#9900c2] text-[11px] text-[#504252] space-y-1 font-mono">
              <div className="font-semibold text-[#9900c2]">ARCHITECTURAL REQUIREMENTS</div>
              <div>Maintain zero box-shadow design language. Separation driven by structural planar cards.</div>
            </div>
          </div>
        </div>

        {/* Subtask Checklist with Progress Indicator */}
        <div className="flex flex-col gap-2.5 bg-[#f4f2fd]/50 rounded-xl p-3.5 border border-[#d4c0d5]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#1a1b22]">Subtasks</span>
              <span className="bg-[#9900c2]/10 text-[#9900c2] font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                {doneSubtasksCount} / {totalSubtasks} done
              </span>
            </div>
            <span className="font-mono text-xs text-[#9900c2] font-bold">
              {progressPercent}% completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#eeedf7] h-2 rounded overflow-hidden">
            <div
              className="bg-[#9900c2] h-full rounded transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Checklist Items */}
          <div className="flex flex-col gap-1 pt-1">
            {task.subtasks.map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-white transition-colors cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={() => handleToggleSubtask(st.id)}
                  className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
                />
                <span
                  className={`text-xs transition-colors ${
                    st.done
                      ? 'text-[#837284] line-through group-hover:text-[#1a1b22]'
                      : 'text-[#1a1b22] font-medium group-hover:text-[#9900c2]'
                  }`}
                >
                  {st.text}
                </span>
                <span className="ml-auto font-mono text-[10px] text-[#837284]">
                  {st.author} • {st.time}
                </span>
              </label>
            ))}

            {isAddingSubtask ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Enter subtask title..."
                  className="flex-1 bg-white border border-[#9900c2]/40 rounded px-2.5 py-1 text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-2.5 py-1 bg-[#9900c2] text-white text-xs font-semibold rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingSubtask(false)}
                  className="px-2 py-1 text-xs text-[#837284] hover:text-[#1a1b22]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="text-left text-xs text-[#9900c2] hover:underline font-medium pt-1 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add subtask</span>
              </button>
            )}
          </div>
        </div>

        {/* Activity & Audit Log Section */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-2">
            <span className="font-semibold text-xs text-[#1a1b22] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#9900c2]">history</span>
              Activity &amp; Audit Log
            </span>
            <span className="font-mono text-[10px] text-[#837284]">
              {task.activity.length} events logged
            </span>
          </div>

          <div className="flex flex-col gap-3 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-[#d4c0d5]/50">
            {task.activity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-[#f4f2fd] border border-[#d4c0d5] flex items-center justify-center z-10 text-[#9900c2] font-mono text-[10px] font-bold">
                  {act.initials}
                </div>
                <div className="flex flex-col flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#1a1b22]">
                      <strong className="font-semibold">{act.author}</strong>{' '}
                      {act.text}
                    </span>
                    <span className="font-mono text-[10px] text-[#837284]">
                      {act.time}
                    </span>
                  </div>
                  {act.detail && (
                    <p className="text-[11px] text-[#837284] italic mt-0.5">
                      {act.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-Over Footer Action Dock */}
      <div className="border-t border-[#d4c0d5]/30 p-3 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1 mr-3">
          <div className="w-7 h-7 rounded-full bg-[#9900c2] text-white font-mono text-[11px] flex items-center justify-center font-bold">
            AW
          </div>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Write a comment or type @ to mention..."
            className="w-full bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded px-3 py-1.5 text-xs text-[#1a1b22] placeholder:text-[#837284] focus:outline-none focus:border-[#9900c2]"
          />
        </div>
        <button
          onClick={handleAddComment}
          className="bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold px-3.5 py-1.5 rounded shadow-sm flex items-center gap-1 active:scale-[0.98] transition-all"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-[13px]">send</span>
        </button>
      </div>
    </section>
  );
};
