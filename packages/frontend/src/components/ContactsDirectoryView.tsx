import React, { useState } from 'react';
import { DirectoryContact } from '../types';

interface ContactsDirectoryViewProps {
  contacts: DirectoryContact[];
  onSelectContact?: (contact: DirectoryContact) => void;
  onOpenAddContact?: () => void;
}

export const ContactsDirectoryView: React.FC<ContactsDirectoryViewProps> = ({
  contacts,
  onOpenAddContact,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'accounts' | 'decision_makers' | 'recent' | 'archived'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedContactId, setSelectedContactId] = useState<string>('cnt_901928_acme');
  const [selectedIds, setSelectedIds] = useState<string[]>(['cnt_901928_acme']);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      searchFilter === '' ||
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.role.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      c.tag === statusFilter ||
      c.healthCategory === statusFilter;

    if (!matchesStatus) return false;

    if (activeTab === 'accounts') return matchesSearch && c.arr.includes('$');
    if (activeTab === 'decision_makers')
      return (
        matchesSearch &&
        (c.tag === 'Champion' || c.tag === 'Key Buyer' || c.role.includes('VP') || c.role.includes('Chief'))
      );
    return matchesSearch;
  });

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white select-none text-xs">
      {/* SUBHEADER VIEW SWITCHER / TABS */}
      <div className="px-6 bg-white border-b border-[#d4c0d5]/30 flex items-center justify-between shrink-0 h-11">
        <div className="flex items-center gap-6 h-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span>All Contacts</span>
            <span className="font-mono text-[10px] bg-[#fbd7ff]/50 text-[#9900c2] px-1.5 py-0.2 rounded font-bold">
              142
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors ${
              activeTab === 'accounts'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span>Enterprise Accounts</span>
            <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-1.5 py-0.2 rounded">
              34
            </span>
          </button>

          <button
            onClick={() => setActiveTab('decision_makers')}
            className={`py-2.5 flex items-center gap-1.5 h-full transition-colors ${
              activeTab === 'decision_makers'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span>Key Decision Makers</span>
            <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-1.5 py-0.2 rounded">
              58
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2.5 h-full transition-colors ${
              activeTab === 'recent'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            Recently Interacted
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`py-2.5 h-full transition-colors ${
              activeTab === 'archived'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            Archived
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#837284]">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Sync: Active
          </span>
        </div>
      </div>

      {/* MAIN SCROLLABLE CANVAS */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-[#fafafc]">
        {/* TOP SUMMARY KPI ROW (4 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/30 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#837284]">
              <span className="font-mono text-[10px] uppercase font-semibold">Total Contacts</span>
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1a1b22]">142</span>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                +12 this month
              </span>
            </div>
            <div className="w-full bg-[#eeedf7] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#9900c2] h-full rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/30 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#837284]">
              <span className="font-mono text-[10px] uppercase font-semibold">Verified Decision Makers</span>
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1a1b22]">58</span>
              <span className="font-mono text-[10px] bg-[#eeedf7] px-1.5 py-0.5 rounded text-[#504252]">
                VP / C-Level
              </span>
            </div>
            <div className="w-full bg-[#eeedf7] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#b731e0] h-full rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/30 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#837284]">
              <span className="font-mono text-[10px] uppercase font-semibold">Linked Active Deals ARR</span>
              <span className="material-symbols-outlined text-[18px]">monetization_on</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1a1b22]">$540,000</span>
              <span className="font-mono text-[10px] text-[#9900c2] bg-[#fbd7ff]/40 px-1.5 py-0.5 rounded font-semibold">
                18 deals
              </span>
            </div>
            <div className="w-full bg-[#eeedf7] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#9900c2] h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/30 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#837284]">
              <span className="font-mono text-[10px] uppercase font-semibold">Avg Relationship Health</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">vital_signs</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-600">94%</span>
              <span className="font-mono text-[10px] text-[#837284] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Real-time Sync
              </span>
            </div>
            <div className="w-full bg-[#eeedf7] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>

        {/* MAIN TABLE SECTION */}
        <div className="bg-white rounded-xl border border-[#d4c0d5]/30 shadow-xs flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-3 border-b border-[#d4c0d5]/20 flex items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-52">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[15px] text-[#837284]">
                  filter_alt
                </span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter current view..."
                  className="w-full h-7 pl-7 pr-3 text-xs bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-lg focus:outline-none focus:border-[#9900c2]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-7 px-2 text-xs bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded text-[#1a1b22] focus:outline-none focus:border-[#9900c2] cursor-pointer"
              >
                <option value="All">Tag / Status: All</option>
                <option value="Champion">Tag: Champion</option>
                <option value="Key Buyer">Tag: Key Buyer</option>
                <option value="Evaluator">Tag: Evaluator</option>
                <option value="Active">Health: Active</option>
              </select>

              <button
                onClick={() => {
                  setSearchFilter('');
                  setStatusFilter('All');
                }}
                className="h-7 px-2 text-xs text-[#837284] hover:text-[#1a1b22] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">clear_all</span>
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="h-7 px-2.5 text-xs font-semibold bg-[#f4f2fd] hover:bg-[#eeedf7] text-[#1a1b22] rounded-lg border border-[#d4c0d5]/40 flex items-center gap-1.5 transition-colors"
                title="Download full contacts list as CSV"
              >
                <span className="material-symbols-outlined text-[14px] text-[#837284]">file_download</span>
                <span>Export CSV</span>
              </button>

              <button
                onClick={onOpenAddContact}
                className="h-7 px-3 bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all"
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
                <tr className="bg-[#f4f2fd] border-b border-[#d4c0d5]/30 text-[#837284] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === contacts.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(contacts.map((c) => c.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-[#837284] text-[#9900c2] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Contact &amp; Role</th>
                  <th className="py-2.5 px-3 font-semibold">Organization / ARR</th>
                  <th className="py-2.5 px-3 font-semibold">Email &amp; Direct Phone</th>
                  <th className="py-2.5 px-3 font-semibold">Linked Deals &amp; Deliverables</th>
                  <th className="py-2.5 px-3 font-semibold">Last Activity</th>
                  <th className="py-2.5 px-3 font-semibold">Health Score</th>
                  <th className="py-2.5 pr-4 pl-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4c0d5]/20">
                {filteredContacts.map((contact) => {
                  const isSelected = contact.id === selectedContactId;
                  const isChecked = selectedIds.includes(contact.id);

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#fbd7ff]/20 border-l-2 border-[#9900c2]'
                          : 'hover:bg-[#f4f2fd]/50'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectId(contact.id)}
                          className="rounded border-[#837284] text-[#9900c2] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-[#f4f2fd] text-[#9900c2] font-mono font-bold flex items-center justify-center text-xs border border-[#9900c2]/20">
                              {contact.initials}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1a1b22] text-xs">
                                {contact.name}
                              </span>
                              <span className="font-mono text-[9px] text-[#9900c2] bg-[#fbd7ff] px-1 rounded font-bold">
                                {contact.tag}
                              </span>
                            </div>
                            <span className="text-[#837284] text-[11px]">{contact.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#1a1b22] flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-sm ${contact.companyColor}`}></span>
                            {contact.company}
                          </span>
                          <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                            {contact.arr}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-[#1a1b22] hover:text-[#9900c2] cursor-pointer">
                            {contact.email}
                          </span>
                          <span className="text-[#837284]">{contact.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-[#eeedf7] text-[#1a1b22] px-1.5 py-0.5 rounded border border-[#d4c0d5]/30 hover:border-[#9900c2] cursor-pointer w-fit">
                            <span className="material-symbols-outlined text-[12px] text-[#9900c2]">
                              description
                            </span>
                            {contact.dealName}
                          </span>
                          <span className="font-mono text-[10px] text-[#9900c2] font-semibold hover:underline cursor-pointer">
                            {contact.deliverablesCount} Deliverables Linked →
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#504252] text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-[#1a1b22] font-medium">{contact.lastActivity}</span>
                          <span className="text-[#837284] font-mono text-[10px]">
                            {contact.lastActivityTime}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 w-24">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-emerald-700 font-bold">{contact.healthScore}%</span>
                            <span className="text-[#837284]">{contact.healthCategory}</span>
                          </div>
                          <div className="h-1.5 bg-[#eeedf7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${contact.healthScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${contact.email}`;
                            }}
                            className="h-7 w-7 rounded hover:bg-[#eeedf7] flex items-center justify-center text-[#837284] hover:text-[#9900c2]"
                            title="Quick Email"
                          >
                            <span className="material-symbols-outlined text-[15px]">mail</span>
                          </button>
                          <button
                            onClick={() => setSelectedContactId(contact.id)}
                            className="h-7 px-2 rounded bg-[#f4f2fd] hover:bg-[#eeedf7] text-[#9900c2] font-mono text-[10px] font-bold flex items-center gap-1 border border-[#9900c2]/20"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="p-3 bg-[#f4f2fd]/40 border-t border-[#d4c0d5]/30 flex items-center justify-between text-xs text-[#504252]">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>{selectedIds.length} rows selected</span>
              <span className="text-[#d4c0d5]">|</span>
              <span className="text-[#837284]">Showing {filteredContacts.length} of 142 records</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#837284]">Rows per page: 25</span>
              <div className="flex items-center gap-1 ml-2">
                <button className="w-6 h-6 rounded flex items-center justify-center text-[#837284] bg-white border border-[#d4c0d5]/40 disabled:opacity-40">
                  <span className="material-symbols-outlined text-xs">chevron_left</span>
                </button>
                <span className="px-2 text-[#1a1b22] font-semibold">1 / 6</span>
                <button className="w-6 h-6 rounded flex items-center justify-center text-[#837284] bg-white border border-[#d4c0d5]/40">
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ZERO-LATENCY SQLITE PREVIEW / INSPECTOR DRAWER (Inline) */}
        {selectedContact && (
          <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-4 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#d4c0d5]/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#9900c2] text-white flex items-center justify-center font-mono text-[10px]">
                  <span className="material-symbols-outlined text-xs">flash_on</span>
                </span>
                <span className="font-semibold text-xs text-[#1a1b22]">
                  Contact Inspector: {selectedContact.name}
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active Record
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#837284]">
                  Row ID: <code className="text-[#9900c2] font-bold">{selectedContact.id}</code>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Col 1 */}
              <div className="p-3 bg-[#f4f2fd]/60 rounded-lg border border-[#d4c0d5]/30 flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#837284] font-semibold">
                  Account Relationship
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#1a1b22] font-bold">{selectedContact.company}</span>
                  <span className="font-mono text-emerald-700 font-bold">{selectedContact.arr}</span>
                </div>
                <p className="text-[11px] text-[#504252] leading-relaxed">
                  {selectedContact.accountDescription}
                </p>
                <div className="pt-2 border-t border-[#d4c0d5]/20 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#837284]">Contract Renewal:</span>
                  <span className="text-[#1a1b22] font-semibold">{selectedContact.renewalDate}</span>
                </div>
              </div>

              {/* Col 2 */}
              <div className="p-3 bg-[#f4f2fd]/60 rounded-lg border border-[#d4c0d5]/30 flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#837284] font-semibold">
                  Linked Deliverables ({selectedContact.deliverablesCount} Active)
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between p-1.5 bg-white rounded border border-[#d4c0d5]/30">
                    <span className="font-mono text-[11px] text-[#1a1b22] font-medium truncate">
                      {selectedContact.dealName}
                    </span>
                    <span className="font-mono text-[9px] text-amber-800 bg-amber-50 px-1 rounded">
                      In Review
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-white rounded border border-[#d4c0d5]/30">
                    <span className="font-mono text-[11px] text-[#1a1b22] font-medium truncate">
                      Zero-Latency Node Pilot
                    </span>
                    <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded">
                      Deploys Today
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3 */}
              <div className="p-3 bg-[#f4f2fd]/60 rounded-lg border border-[#d4c0d5]/30 flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#837284] font-semibold">
                  Node Metadata
                </span>
                <div className="flex flex-col gap-1 text-[11px] font-mono text-[#504252]">
                  <div className="flex justify-between">
                    <span className="text-[#837284]">Local Storage Key:</span>
                    <span className="text-[#1a1b22] font-semibold">{selectedContact.storageKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#837284]">IndexedDB Block:</span>
                    <span className="text-[#1a1b22]">Chunk 14 / Cluster B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#837284]">Replication Hash:</span>
                    <span className="text-[#9900c2] font-bold">{selectedContact.replicationHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#837284]">Encryption:</span>
                    <span className="text-emerald-700 font-semibold">AES-256-GCM Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER STATUS BAR */}
      <footer className="h-8 bg-white px-6 flex items-center justify-between border-t border-[#d4c0d5]/30 text-[#837284] font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Showing 6 of 142 contacts
          </span>
          <span className="text-[#d4c0d5]">|</span>
          <span className="text-[#1a1b22]">
            Query Time: <strong className="text-[#9900c2] font-bold">0.08ms</strong>
          </span>
          <span className="text-[#d4c0d5]">|</span>
          <span>IndexedDB Cache: Synchronized</span>
          <span className="text-[#d4c0d5]">|</span>
          <span>AES-256-GCM</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Memory: 18.2 MB</span>
          <span>Worker: thread-03 (Active)</span>
          <button
            onClick={() => alert('Local SQLite indexes verified and re-indexed (0.08ms).')}
            className="text-[#9900c2] hover:underline font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">cached</span>
            Force Re-index
          </button>
        </div>
      </footer>
    </div>
  );
};
