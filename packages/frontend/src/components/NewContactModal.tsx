import React, { useState, useEffect } from 'react';
import { DirectoryContact } from '../types';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateContact: (contact: DirectoryContact) => void;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  onCreateContact,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [tag, setTag] = useState<'Champion' | 'Key Buyer' | 'Evaluator' | 'Influencer'>('Champion');
  const [arr, setArr] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCompany('');
      setRole('');
      setTag('Champion');
      setArr('');
      setEmail('');
      setPhone('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newContact: DirectoryContact = {
      id: `cnt_${Date.now()}`,
      name: name.trim(),
      initials: initials || 'NN',
      role: role.trim() || 'Account Stakeholder',
      tag: tag,
      tagColor:
        tag === 'Champion'
          ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
          : tag === 'Key Buyer'
          ? 'bg-blue-950/40 text-blue-400 border border-blue-500/30'
          : tag === 'Evaluator'
          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
          : 'bg-amber-950/40 text-amber-400 border border-amber-500/30',
      company: company.trim() || 'Enterprise Client Inc',
      companyColor: 'bg-orange-600',
      arr: arr.trim() ? (arr.startsWith('$') ? arr.trim() : `$${arr.trim()}`) : '$50,000 ARR',
      email:
        email.trim() ||
        `${name.toLowerCase().replace(/\s+/g, '.')}@${(company || 'client').toLowerCase().replace(/\s+/g, '')}.com`,
      phone: phone.trim() || '+1 (555) 000-0000',
      dealName: 'Enterprise Platform Deployment',
      deliverablesCount: 1,
      lastActivity: 'Account onboarded',
      lastActivityTime: 'Just now',
      healthScore: 95,
      healthCategory: 'Active',
      accountDescription: 'Enterprise client directory contact.',
      renewalDate: 'Nov 01, 2026',
      storageKey: `crm:contacts:${Date.now()}`,
      replicationHash: '55f2b...99a1',
    };

    onCreateContact(newContact);
    onClose();
    setName('');
    setCompany('');
    setEmail('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">Add New Contact</h3>
              <p className="text-[11px] text-zinc-400">Add a decision maker or account stakeholder</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[4px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs font-sans bg-[#121214]">
            {/* Contact Full Name */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-200 flex items-center gap-1">
                <span>Full Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova, Marcus Chen"
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Organization & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-200">Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-200">Job Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. VP Engineering, CTO"
                  className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Stakeholder Tag & ARR */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-200">Stakeholder Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Champion">Champion</option>
                  <option value="Key Buyer">Key Buyer</option>
                  <option value="Evaluator">Evaluator</option>
                  <option value="Influencer">Influencer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-200">Contract ARR</label>
                <input
                  type="text"
                  value={arr}
                  onChange={(e) => setArr(e.target.value)}
                  placeholder="e.g. $80,000"
                  className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-200">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@company.com"
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-200">Direct Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 123-4567"
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 p-4 border-t border-[#27272a] bg-[#121214] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-[#27272a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Add Contact</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
