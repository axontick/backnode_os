import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ContactsDirectoryView } from '../components/ContactsDirectoryView';

export const ContactsPage: React.FC = () => {
  const { directoryContacts, setIsNewContactModalOpen } = useWorkspace();

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <ContactsDirectoryView
        contacts={directoryContacts}
        onOpenAddContact={() => setIsNewContactModalOpen(true)}
      />
    </div>
  );
};
