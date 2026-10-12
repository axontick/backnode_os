import React from 'react';
import {
  getFieldLinksForModule,
  isFieldLinkActive,
  FieldLinkDefinition,
} from '@backnode/shared';
import { Link2, X, ExternalLink, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface DynamicEntityLinkerProps {
  sourceModule: 'tasks' | 'crm' | 'contacts' | 'docs';
  customLinks?: Record<string, any>;
  onChange: (updatedLinks: Record<string, any>) => void;
  readOnly?: boolean;
  className?: string;
}

export const DynamicEntityLinker: React.FC<DynamicEntityLinkerProps> = ({
  sourceModule,
  customLinks = {},
  onChange,
  readOnly = false,
  className = '',
}) => {
  const {
    directoryContacts = [],
    deals = [],
    docs = [],
    folders = [],
    // @ts-ignore
    enabledPlugins = { tasks: true, crm: true, contacts: true, docs: true },
  } = useWorkspace();

  const fieldLinks = getFieldLinksForModule(sourceModule);

  // Filter links: only show links whose target module is enabled
  const activeLinks = fieldLinks.filter((linkDef) =>
    isFieldLinkActive(linkDef, enabledPlugins)
  );

  const getTargetEntityOptions = (targetModule: string) => {
    switch (targetModule) {
      case 'contacts':
        return directoryContacts.map((c) => ({
          id: c.id,
          name: c.name,
          subtext: c.company || c.email || 'Contact',
        }));
      case 'crm':
        return deals.map((d) => ({
          id: d.id,
          name: d.title,
          subtext: d.company || d.stage || 'Deal',
        }));
      case 'docs':
        return docs.map((doc) => ({
          id: doc.id,
          name: doc.title,
          subtext: doc.classification || 'Doc',
        }));
      case 'tasks': {
        const allLists: { id: string; name: string; subtext: string }[] = [];
        folders.forEach((f) => {
          (f.items || (f as any).lists || []).forEach((l: any) => {
            allLists.push({
              id: l.id,
              name: l.name,
              subtext: `Folder: ${f.name}`,
            });
          });
          f.subFolders?.forEach((sf) => {
            (sf.items || (sf as any).lists || []).forEach((l: any) => {
              allLists.push({
                id: l.id,
                name: l.name,
                subtext: `${f.name} / ${sf.name}`,
              });
            });
          });
        });
        return allLists;
      }
      default:
        return [];
    }
  };

  const handleSelectLink = (linkDef: FieldLinkDefinition, entityId: string) => {
    if (!entityId) {
      const next = { ...customLinks };
      delete next[linkDef.id];
      onChange(next);
      return;
    }
    const options = getTargetEntityOptions(linkDef.targetModule);
    const selected = options.find((o) => o.id === entityId);
    if (!selected) return;

    const next = {
      ...customLinks,
      [linkDef.id]: {
        id: selected.id,
        name: selected.name,
        module: linkDef.targetModule,
        subtext: selected.subtext,
      },
    };
    onChange(next);
  };

  const handleRemoveLink = (linkId: string) => {
    const next = { ...customLinks };
    delete next[linkId];
    onChange(next);
  };

  if (activeLinks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activeLinks.map((linkDef) => {
        const currentVal = customLinks[linkDef.id];
        const options = getTargetEntityOptions(linkDef.targetModule);

        return (
          <div key={linkDef.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Link2 className="w-3.5 h-3.5 text-orange-500" />
                {linkDef.label}
              </label>
              {currentVal && !readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveLink(linkDef.id)}
                  className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Unlink
                </button>
              )}
            </div>

            {readOnly ? (
              <div className="px-2.5 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs text-zinc-200">
                {currentVal ? (
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-orange-400">{currentVal.name}</span>
                    {currentVal.subtext && (
                      <span className="text-zinc-500 text-[11px]">({currentVal.subtext})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">None linked</span>
                )}
              </div>
            ) : (
              <select
                value={currentVal?.id || ''}
                onChange={(e) => handleSelectLink(linkDef, e.target.value)}
                className="w-full h-[34px] px-2.5 py-1.5 rounded-[6px] text-xs bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">{linkDef.placeholder || 'Select item to link...'}</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} {opt.subtext ? `(${opt.subtext})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
};
