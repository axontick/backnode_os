import React, { useState } from 'react';
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
  const [role, setRole] = useState('VP Technology');
  const [tag, setTag] = useState<'Champion' | 'Key Buyer' | 'Evaluator' | 'Influencer'>('Champion');
  const [arr, setArr] = useState('$65,000 ARR');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) 789-0123');

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
      role: role.trim() || 'VP Technology',
      tag: tag,
      tagColor:
        tag === 'Champion'
          ? 'bg-purple-100 text-purple-700'
          : tag === 'Key Buyer'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-emerald-100 text-emerald-700',
      company: company.trim() || 'Enterprise Client Inc',
      companyColor: 'bg-[#9900c2]',
      arr: arr.trim() || '$50,000 ARR',
      email:
        email.trim() ||
        `${name.toLowerCase().replace(/\s+/g, '.')}@${(company || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
      phone: phone.trim() || '+1 (555) 123-4567',
      dealName: 'Enterprise License Deployment',
      deliverablesCount: 1,
      lastActivity: 'Account onboarded',
      lastActivityTime: 'Just now',
      healthScore: 92,
      healthCategory: 'Active',
      accountDescription: 'Recently added enterprise client contact.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#d4c0d5]/60 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d4c0d5]/30 flex items-center justify-between bg-gradient-to-r from-white to-[#f4f2fd]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9900c2]/10 flex items-center justify-center text-[#9900c2]">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1a1b22]">Add New Contact</h3>
              <p className="text-[11px] text-[#837284]">Add a decision maker or account stakeholder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs font-sans">
          {/* Contact Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#1a1b22] flex items-center gap-1">
              <span>Full Name</span>
              <span className="text-[#9900c2]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elena Rostova, Marcus Chen"
              className="w-full px-3 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2] focus:ring-2 focus:ring-[#9900c2]/20"
            />
          </div>

          {/* Organization & Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1b22]">Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1b22]">Job Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. VP Engineering"
                className="w-full px-3 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
              />
            </div>
          </div>

          {/* Tag & ARR */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1b22]">Tag / Role</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
              >
                <option value="Champion">Champion</option>
                <option value="Key Buyer">Key Buyer</option>
                <option value="Evaluator">Evaluator</option>
                <option value="Influencer">Influencer</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1b22]">Contract ARR</label>
              <input
                type="text"
                value={arr}
                onChange={(e) => setArr(e.target.value)}
                placeholder="e.g. $65,000 ARR"
                className="w-full px-3 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#1a1b22]">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@company.com"
              className="w-full px-3 py-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/60 rounded-xl text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
            />
          </div>

          {/* Footer CTAs */}
          <div className="pt-3 border-t border-[#d4c0d5]/30 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#504252] hover:bg-[#eeedf7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#9900c2] hover:bg-[#b731e0] text-white shadow-sm transition-all"
            >
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
