import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ConversationList } from '../components/conversation/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { NewConversationModal } from '../components/conversation/NewConversationModal';
import { useAuthContext } from '../app/providers/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { useChatStore } from '../app/store';
import { MessageSquare } from 'lucide-react';

export function ChatPage() {
  const { user } = useAuthContext();
  const uid = user?.uid ?? null;
  const displayName = user?.displayName ?? 'Anonymous';
  const photoURL = user?.photoURL ?? null;

  const { conversations, loading, error } = useConversations(uid);
  const { selectedConversationId, setSelectedConversation } = useChatStore();
  const [showNewConv, setShowNewConv] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Mobile: show sidebar when no conversation selected
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  const selectedConversation = conversations.find(
    (c) => c.conversationId === selectedConversationId
  );

  return (
    <div className="h-screen flex overflow-hidden bg-app-bg">
      {/* Sidebar — hidden on mobile when viewing a conversation */}
      <div
        className={clsx(
          'w-full md:w-80 lg:w-96 shrink-0 flex flex-col',
          'md:flex', // always visible on md+
          mobileView === 'chat' ? 'hidden' : 'flex' // mobile conditional
        )}
      >
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          selectedId={selectedConversationId}
          currentUserName={displayName}
          currentUserPhoto={photoURL}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setShowNewConv(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* Main panel */}
      <div
        className={clsx(
          'flex-1 flex flex-col overflow-hidden',
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        )}
      >
        {selectedConversation && uid ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUid={uid}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-app-bg text-center p-8">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5 shadow-sm">
              <MessageSquare className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Welcome to CloudTalk
            </h2>
            <p className="text-sm text-text-muted max-w-xs">
              Select a conversation from the sidebar or start a new one to begin chatting.
            </p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConv && uid && (
        <NewConversationModal
          currentUid={uid}
          onSelectConversation={handleSelectConversation}
          onClose={() => setShowNewConv(false)}
        />
      )}

      {/* Profile panel (basic for now) */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Profile"
        >
          <div className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-1">{displayName}</h2>
            <p className="text-sm text-text-muted mb-4">{user?.email}</p>
            <p className="text-xs text-text-muted mb-6">
              Profile editing is available on the{' '}
              <a href="/profile" className="text-primary-600 underline">Profile page</a>.
            </p>
            <button
              onClick={() => setShowProfile(false)}
              className="w-full py-2 rounded-xl border border-border text-sm text-text-primary hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
