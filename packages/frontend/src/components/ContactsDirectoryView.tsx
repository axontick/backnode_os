import React, { useState, useMemo } from 'react';
import { DirectoryContact } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { SecurityPolicy } from '../utils/security';

interface ContactsDirectoryViewProps {
  contacts: DirectoryContact[];
  onSelectContact?: (contact: DirectoryContact) => void;
  onOpenAddContact?: () => void;
}

export const ContactsDirectoryView: React.FC<ContactsDirectoryViewProps> = ({
  contacts,
  onOpenAddContact,
}) => {
  const { handleUpdateContact, handleDeleteContact } = useWorkspace();
  const { user, effectiveRole, effectiveDepartment } = useAuth();

  const isReadOnly = SecurityPolicy.isReadOnly({
    id: user?.id || 'usr-operator',
    name: user?.name || 'Operator',
    email: user?.email || '',
    role: effectiveRole,
    department: effectiveDepartment,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'accounts' | 'decision_makers' | 'recent' | 'archived'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedContactId, setSelectedContactId] = useState<string>(() => contacts[0]?.id || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals for Edit & Delete
  const [contactToEdit, setContactToEdit] = useState<DirectoryContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<DirectoryContact | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<DirectoryContact>>({});

  const openEditModal = (contact: DirectoryContact) => {
    if (isReadOnly) return;
    setContactToEdit(contact);
    setEditForm({ ...contact });
  };

  const handleSaveContactEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactToEdit || !editForm.name) return;
    handleUpdateContact({
      ...contactToEdit,
      ...editForm,
      initials: (editForm.name || '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || contactToEdit.initials,
    } as DirectoryContact);
    setContactToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (!contactToDelete) return;
    handleDeleteContact(contactToDelete.id);
    if (selectedContactId === contactToDelete.id) {
      const remaining = contacts.filter((c) => c.id !== contactToDelete.id);
      setSelectedContactId(remaining[0]?.id || '');
    }
    setContactToDelete(null);
  };

  // Metrics
  const totalContactsCount = contacts.length;
  const enterpriseAccountsCount = useMemo(() => {
    return contacts.filter((c) => c.arr && c.arr.includes('$')).length;
  }, [contacts]);

  const decisionMakersCount = useMemo(() => {
    return contacts.filter(
      (c) =>
        c.tag === 'Champion' ||
        c.tag === 'Key Buyer' ||
        c.role.toLowerCase().includes('vp') ||
        c.role.toLowerCase().includes('chief') ||
        c.role.toLowerCase().includes('lead')
    ).length;
  }, [contacts]);

  const totalArrSum = useMemo(() => {
    let sum = 0;
    contacts.forEach((c) => {
      const num = Number(c.arr.replace(/[^0-9]/g, ''));
      if (!isNaN(num) && num > 0) sum += num;
    });
    return sum;
  }, [contacts]);

  const avgHealthScore = useMemo(() => {
    if (contacts.length === 0) return 100;
    const sum = contacts.reduce((acc, c) => acc + (c.healthScore || 0), 0);
    return Math.round(sum / contacts.length);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const query = searchFilter.toLowerCase();
      const matchesSearch =
        query === '' ||
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.role.toLowerCase().includes(query) ||
        c.tag.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        c.tag === statusFilter ||
        c.healthCategory === statusFilter;

      if (!matchesStatus) return false;

      if (activeTab === 'accounts') return matchesSearch && c.arr.includes('$');
      if (activeTab === 'decision_makers') {
        return (
          matchesSearch &&
          (c.tag === 'Champion' ||
            c.tag === 'Key Buyer' ||
            c.role.toLowerCase().includes('vp') ||
            c.role.toLowerCase().includes('chief') ||
            c.role.toLowerCase().includes('lead'))
        );
      }
      return matchesSearch;
    });
  }, [contacts, searchFilter, statusFilter, activeTab]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || filteredContacts[0];

  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Role', 'Company', 'ARR', 'Email', 'Phone', 'Tag', 'Health Score'];
    const rows = filteredContacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.role}"`,
      `"${c.company}"`,
      `"${c.arr}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.tag}"`,
      c.healthScore,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contacts_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] select-none text-xs text-zinc-100 font-sans">
      {/* SUBHEADER VIEW SWITCHER / TABS */}
      <div className="px-6 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0 h-11">
        <div className="flex items-center gap-6 h-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span>All Contacts</span>
            <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-[6px] font-bold">
              {totalContactsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span>Enterprise Accounts</span>
            <span className="font-mono text-[10px] bg-[#18181b] border border-[#27272a] text-zinc-400 px-1.5 py-0.2 rounded-[6px]">
              {enterpriseAccountsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('decision_makers')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
              activeTab === 'decision_makers'
                ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span>Key Decision Makers</span>
            <span className="font-mono text-[10px] bg-[#18181b] border border-[#27272a] text-zinc-400 px-1.5 py-0.2 rounded-[6px]">
              {decisionMakersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2.5 h-full transition-colors cursor-pointer ${
              activeTab === 'recent'
                ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Recently Interacted
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`py-2.5 h-full transition-colors cursor-pointer ${
              activeTab === 'archived'
                ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Archived
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          {isReadOnly ? (
            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-[6px] border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Viewer Read-Only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-[6px] border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Directory
            </span>
          )}
        </div>
      </div>

      {/* MAIN SCROLLABLE CANVAS */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-[#09090b]">
        {/* TOP SUMMARY KPI ROW (4 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase font-semibold">Total Contacts</span>
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-zinc-100">{totalContactsCount}</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded-[6px] border border-emerald-500/30 font-semibold">
                Active Directory
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase font-semibold">Decision Makers</span>
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-zinc-100">{decisionMakersCount}</span>
              <span className="font-mono text-[10px] bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px] text-zinc-400">
                VP / C-Level
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-orange-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((decisionMakersCount / (totalContactsCount || 1)) * 100))}%` }}></div>
            </div>
          </div>

          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase font-semibold">Linked Pipeline ARR</span>
              <span className="material-symbols-outlined text-[18px]">monetization_on</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-zinc-100">
                ${totalArrSum.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.5 rounded-[6px] font-semibold">
                {contacts.length} accounts
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase font-semibold">Avg Relationship Health</span>
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">vital_signs</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-400">{avgHealthScore}%</span>
              <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Score
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${avgHealthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MAIN TABLE SECTION */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-3 border-b border-[#27272a] flex items-center justify-between gap-4 bg-[#121214] flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[15px] text-zinc-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter name, role, email, company..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-200 focus:outline-none focus:border-orange-500 cursor-pointer transition-colors font-mono"
              >
                <option value="All">All Tags &amp; Health</option>
                <option value="Champion">Tag: Champion</option>
                <option value="Key Buyer">Tag: Key Buyer</option>
                <option value="Evaluator">Tag: Evaluator</option>
                <option value="Healthy">Health: Healthy</option>
                <option value="Active">Health: Active</option>
              </select>

              {(searchFilter || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchFilter('');
                    setStatusFilter('All');
                  }}
                  className="h-8 px-2 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">clear_all</span>
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="h-8 px-2.5 text-xs font-semibold bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-[6px] border border-[#27272a] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download full contacts list as CSV"
              >
                <span className="material-symbols-outlined text-[14px] text-zinc-400">file_download</span>
                <span>Export CSV</span>
              </button>

              <button
                disabled={isReadOnly}
                onClick={onOpenAddContact}
                className="h-8 px-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold rounded-[6px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredContacts.map((c) => c.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded-[6px] border-zinc-700 bg-zinc-900 text-orange-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Contact Person</th>
                  <th className="py-2.5 px-3">Company &amp; ARR</th>
                  <th className="py-2.5 px-3">Communication</th>
                  <th className="py-2.5 px-3">Linked Opportunity</th>
                  <th className="py-2.5 px-3">Last Interacted</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 pr-4 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/50">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No contacts found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = contact.id === selectedContactId;
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={`hover:bg-[#18181b]/60 transition-colors cursor-pointer ${
                          isSelected ? 'bg-orange-950/20' : ''
                        }`}
                      >
                        <td className="py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(contact.id)}
                            onChange={() => handleToggleSelectId(contact.id)}
                            className="rounded-[6px] border-zinc-700 bg-zinc-900 text-orange-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 border border-[#27272a] flex items-center justify-center font-bold text-xs font-mono">
                                {contact.initials}
                              </div>
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#121214]"></span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-100 text-xs">
                                  {contact.name}
                                </span>
                                <span className="font-mono text-[9px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1 rounded-[6px] font-bold">
                                  {contact.tag}
                                </span>
                              </div>
                              <span className="text-zinc-400 text-[11px]">{contact.role}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-[2px] ${contact.companyColor || 'bg-orange-500'}`}></span>
                              {contact.company}
                            </span>
                            <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                              {contact.arr}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 hover:text-orange-400 cursor-pointer transition-colors">
                              {contact.email}
                            </span>
                            <span className="text-zinc-500">{contact.phone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-[#18181b] text-zinc-200 px-1.5 py-0.5 rounded-[6px] border border-[#27272a] hover:border-orange-500/50 cursor-pointer w-fit transition-colors">
                              <span className="material-symbols-outlined text-[12px] text-orange-400">
                                description
                              </span>
                              {contact.dealName || 'Primary Contract'}
                            </span>
                            <span className="font-mono text-[10px] text-orange-400 font-semibold hover:underline cursor-pointer">
                              {contact.deliverablesCount || 2} Deliverables Linked →
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-medium">{contact.lastActivity}</span>
                            <span className="text-zinc-500 font-mono text-[10px]">
                              {contact.lastActivityTime}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 w-24">
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="text-emerald-400 font-bold">{contact.healthScore}%</span>
                              <span className="text-zinc-500">{contact.healthCategory}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${contact.healthScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                window.location.href = `mailto:${contact.email}`;
                              }}
                              className="h-7 w-7 rounded-[6px] hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer"
                              title="Quick Email"
                            >
                              <span className="material-symbols-outlined text-[15px]">mail</span>
                            </button>

                            <button
                              disabled={isReadOnly}
                              onClick={() => openEditModal(contact)}
                              className="h-7 w-7 rounded-[6px] hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer"
                              title="Edit Contact"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>

                            <button
                              disabled={isReadOnly}
                              onClick={() => setContactToDelete(contact)}
                              className="h-7 w-7 rounded-[6px] hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Contact"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>

                            <button
                              onClick={() => setSelectedContactId(contact.id)}
                              className="h-7 px-2 rounded-[6px] bg-orange-950/40 hover:bg-orange-900/40 text-orange-400 font-mono text-[10px] font-bold flex items-center gap-1 border border-orange-500/30 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">visibility</span>
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="p-3 bg-[#121214] border-t border-[#27272a] flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>{selectedIds.length} rows selected</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">
                Showing {filteredContacts.length} of {totalContactsCount} records
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-zinc-400">1 of 1 pages</span>
            </div>
          </div>
        </div>

        {/* CONTACT INSPECTOR DRAWER (Inline) */}
        {selectedContact && (
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-4 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[6px] bg-orange-600 text-white flex items-center justify-center font-mono text-[10px]">
                  <span className="material-symbols-outlined text-xs">flash_on</span>
                </span>
                <span className="font-semibold text-xs text-zinc-100 font-headline">
                  Contact Inspector: {selectedContact.name}
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-[6px] border border-emerald-500/30">
                  {selectedContact.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => openEditModal(selectedContact)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px] text-orange-400">edit</span>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setContactToDelete(selectedContact)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Col 1 */}
              <div className="p-3 bg-[#18181b] rounded-[6px] border border-[#27272a] flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">
                  Account Relationship
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-100 font-bold">{selectedContact.company}</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedContact.arr}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {selectedContact.accountDescription || 'Enterprise account partner.'}
                </p>
                <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Contract Renewal:</span>
                  <span className="text-zinc-200 font-semibold">{selectedContact.renewalDate || 'Q4 2026'}</span>
                </div>
              </div>

              {/* Col 2 */}
              <div className="p-3 bg-[#18181b] rounded-[6px] border border-[#27272a] flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">
                  Linked Deliverables ({selectedContact.deliverablesCount || 2} Active)
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between p-2 bg-[#121214] rounded-[6px] border border-[#27272a]">
                    <span className="font-mono text-[11px] text-zinc-200 font-medium truncate">
                      {selectedContact.dealName || 'Primary License Expansion'}
                    </span>
                    <span className="font-mono text-[9px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1 rounded-[6px]">
                      In Review
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#121214] rounded-[6px] border border-[#27272a]">
                    <span className="font-mono text-[11px] text-zinc-200 font-medium truncate">
                      Zero-Latency Node Pilot
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1 rounded-[6px]">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3 */}
              <div className="p-3 bg-[#18181b] rounded-[6px] border border-[#27272a] flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">
                  Contact Coordinates
                </span>
                <div className="flex flex-col gap-1 text-[11px] font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="text-zinc-200 font-semibold">{selectedContact.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Phone:</span>
                    <span className="text-zinc-200">{selectedContact.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Health Category:</span>
                    <span className="text-emerald-400 font-semibold">{selectedContact.healthCategory}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EDIT CONTACT MODAL */}
      {contactToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-100 font-headline">Edit Directory Contact</h2>
              <button
                type="button"
                onClick={() => setContactToEdit(null)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContactEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={editForm.role || ''}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    ARR Value
                  </label>
                  <input
                    type="text"
                    value={editForm.arr || ''}
                    onChange={(e) => setEditForm({ ...editForm, arr: e.target.value })}
                    placeholder="$120,000"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Relationship Tag
                  </label>
                  <select
                    value={editForm.tag || 'Champion'}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  >
                    <option value="Champion">Champion</option>
                    <option value="Key Buyer">Key Buyer</option>
                    <option value="Technical Evaluator">Technical Evaluator</option>
                    <option value="Influencer">Influencer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Health Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.healthScore ?? 95}
                    onChange={(e) => setEditForm({ ...editForm, healthScore: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Account Notes / Relationship Brief
                </label>
                <textarea
                  value={editForm.accountDescription || ''}
                  onChange={(e) => setEditForm({ ...editForm, accountDescription: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setContactToEdit(null)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h2 className="text-sm font-bold text-zinc-100 font-headline">Delete Contact</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-zinc-100">{contactToDelete.name}</strong> from the directory?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-3 py-1.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
