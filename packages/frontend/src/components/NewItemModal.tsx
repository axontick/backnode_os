import React, { useState, useEffect, useMemo } from 'react';
import { TaskItem, TaskStatus, PriorityLevel, TeamMember, CrmDeal } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { mapPriorityStringToLevel } from '../utils/taskSpaceSettingsUtils';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onAddTask: (newTask: TaskItem) => void;
  onAddDeal?: (newDeal: CrmDeal) => void;
  defaultStatus?: TaskStatus;
  initialType?: 'task' | 'deal';
  defaultDealStage?: CrmDeal['stage'];
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddTask,
  onAddDeal,
  defaultStatus = 'Backlog',
  initialType = 'task',
  defaultDealStage = 'Proposal Submitted',
}) => {
  const { user } = useAuth();
  const { listSettings } = useWorkspace();

  const defaultPriorityLevel = useMemo(() => {
    return mapPriorityStringToLevel(listSettings?.defaultPriority);
  }, [listSettings?.defaultPriority]);

  const currentUserName = user?.name || 'Operator';
  const currentUserInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';

  const [itemType, setItemType] = useState<'task' | 'deal'>(initialType);

  // Task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>(defaultPriorityLevel);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || 'mem-1');
  const [tag, setTag] = useState('Core Infra');
  const [estimateValue, setEstimateValue] = useState(
    listSettings?.estimationUnit === 'Story Points' ? 3 : 6
  );

  useEffect(() => {
    if (isOpen) {
      setPriority(defaultPriorityLevel);
      setEstimateValue(listSettings?.estimationUnit === 'Story Points' ? 3 : 6);
    }
  }, [isOpen, defaultPriorityLevel, listSettings?.estimationUnit]);

  // Deal form state
  const [dealTitle, setDealTitle] = useState('');
  const [dealCompany, setDealCompany] = useState('');
  const [dealValue, setDealValue] = useState(65000);
  const [dealStage, setDealStage] = useState<CrmDeal['stage']>(defaultDealStage);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Decision Maker');

  if (!isOpen) return null;

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedAssignee = members.find((m) => m.id === assigneeId) || members[0];
    const newId = `ENG-${Math.floor(100 + Math.random() * 900)}`;

    const newTask: TaskItem = {
      id: newId,
      title: title.trim(),
      description: description.trim() || 'New task requirement queued for sprint triage.',
      specMarkdown: `# ${title.trim()}\n\nInitialized by operator AW.\n\n### Deliverable Scope\n${description.trim()}`,
      status,
      priority,
      assignee: selectedAssignee,
      tags: [tag],
      subtasks: [
        { id: `st-${Date.now()}-1`, text: 'Initial scoping and technical spec review', done: false, author: selectedAssignee.initials, time: 'New' }
      ],
      estimation: {
        hours: listSettings?.estimationUnit === 'Story Points' ? estimateValue * 2 : estimateValue,
        points: listSettings?.estimationUnit === 'Story Points' ? estimateValue : Math.max(1, Math.round(estimateValue / 2)),
      },
      targetCycle: 'Sprint 14 - Q4 Infra',
      dueDate: 'Nov 04, 2024',
      gitBranch: `feat/${newId.toLowerCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16)}`,
      replicationHash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 5)}`,
      timeInStage: 'Active for 0 days',
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'status',
          author: currentUserName,
          initials: currentUserInitials,
          time: 'Just now',
          text: `dispatched new task ${newId}`
        }
      ]
    };

    onAddTask(newTask);
    onClose();
  };

  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim()) return;

    const newDealId = `DEAL-${Math.floor(412 + Math.random() * 80)}`;
    const newDeal: CrmDeal = {
      id: newDealId,
      title: dealTitle.trim(),
      company: dealCompany.trim() || 'Enterprise Client',
      value: dealValue,
      formattedValue: `$${dealValue.toLocaleString()}`,
      stage: dealStage,
      probability: dealStage === 'Closed Won' ? 100 : dealStage === 'Contract & Legal' ? 85 : 60,
      targetCloseDate: 'Nov 18, 2026',
      contact: {
        name: contactName.trim() || 'Executive Champion',
        title: 'VP of Technology',
        email: 'contact@enterprise.com',
        phone: '+1 (555) 000-1122',
        location: 'North America HQ',
        role: contactRole,
        initials: (contactName.trim() || 'EC').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      },
      owner: currentUserName,
      ownerInitials: currentUserInitials,
      tags: ['Custom SLA'],
      linkedTasks: [
        { id: `dt-${Date.now()}`, title: 'Initial contract scoping and security SLA draft', done: false, priority: 'High', dueDate: 'Nov 12, 2026', tag: 'Legal', assignee: currentUserInitials }
      ],
      history: [
        { id: `dh-${Date.now()}`, type: 'note', title: 'Deal created in pipeline queue', date: 'Just now' }
      ]
    };

    if (onAddDeal) {
      onAddDeal(newDeal);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-w-full bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent Line */}
        <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500"></div>
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-orange-600 text-white flex items-center justify-center text-xs font-bold font-mono">
              +
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 font-headline">New Pipeline Item</h2>
              <p className="text-[11px] text-zinc-400">Dispatches into active workspace queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="flex border-b border-[#27272a] px-4 pt-2 gap-4 text-xs font-semibold bg-[#121214]">
          <button
            type="button"
            onClick={() => setItemType('task')}
            className={`pb-2 transition-colors flex items-center gap-1.5 ${
              itemType === 'task'
                ? 'border-b-2 border-orange-500 text-orange-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">task_alt</span>
            <span>Engineering Task</span>
          </button>
          <button
            type="button"
            onClick={() => setItemType('deal')}
            className={`pb-2 transition-colors flex items-center gap-1.5 ${
              itemType === 'deal'
                ? 'border-b-2 border-orange-500 text-orange-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">monetization_on</span>
            <span>CRM Commercial Deal</span>
          </button>
        </div>

        {/* Task Form */}
        {itemType === 'task' ? (
          <form onSubmit={handleTaskSubmit} className="p-4 flex flex-col gap-3.5 text-xs bg-[#121214]">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Deliverable Title <span className="text-orange-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Asynchronous latch starvation mitigation layer"
                className="w-full h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Description / Specifications
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe technical context, memory benchmarks, and dependencies..."
                className="w-full p-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-8 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Stage / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full h-8 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full h-8 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Tag / Domain
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full h-8 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Core Infra">Core Infra</option>
                  <option value="Design System">Design System</option>
                  <option value="SQLite">SQLite</option>
                  <option value="Networking">Networking</option>
                  <option value="API">API</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  {listSettings?.estimationUnit === 'Story Points' ? 'Story Points' : 'Est. Hours'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={listSettings?.estimationUnit === 'Story Points' ? 40 : 160}
                    value={estimateValue}
                    onChange={(e) => setEstimateValue(Number(e.target.value))}
                    className="w-full h-8 px-2 pr-8 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
                    {listSettings?.estimationUnit === 'Story Points' ? 'pts' : 'hrs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                Dispatch Task
              </button>
            </div>
          </form>
        ) : (
          /* Deal Form */
          <form onSubmit={handleDealSubmit} className="p-4 flex flex-col gap-3.5 text-xs bg-[#121214]">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Deal Title <span className="text-orange-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="e.g. Zenith Tech — Global Enterprise Rollout"
                className="w-full h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={dealCompany}
                  onChange={(e) => setDealCompany(e.target.value)}
                  placeholder="e.g. Zenith Tech Corp"
                  className="w-full h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Contract Value (USD)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] font-mono text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value as CrmDeal['stage'])}
                  className="w-full h-8 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Qualified Lead">Qualified Lead</option>
                  <option value="Discovery & Demo">Discovery & Demo</option>
                  <option value="Proposal Submitted">Proposal Submitted</option>
                  <option value="Contract & Legal">Contract & Legal</option>
                  <option value="Closed Won">Closed Won</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Michael Vance (VP)"
                  className="w-full h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                Dispatch Deal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
