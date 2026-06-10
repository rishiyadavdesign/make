import { MessageCircle, SendHorizonal, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { RoleBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function timeLabel(value) {
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const scroller = useRef(null);
  const activeContact = useMemo(() => contacts.find((contact) => contact._id === activeId), [contacts, activeId]);

  async function loadContacts() {
    const { data } = await api.get('/messages/contacts');
    setContacts(data);
    setActiveId((current) => current || data[0]?._id || '');
  }

  async function loadConversation(contactId = activeId) {
    if (!contactId) {
      setMessages([]);
      return;
    }
    const { data } = await api.get(`/messages/${contactId}`);
    setMessages(data);
    loadContacts().catch(() => {});
  }

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    loadConversation(activeId);
    const timer = window.setInterval(() => loadConversation(activeId), 8000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, activeId]);

  async function send(e) {
    e.preventDefault();
    if (!activeId || !body.trim()) return;
    const message = body.trim();
    setBody('');
    await api.post('/messages', { recipient: activeId, body: message });
    await loadConversation(activeId);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Team Chat</h2>
        <p className="page-subtitle">Message Boss/Admin, managers, and members connected to your events.</p>
      </div>

      <div className="grid min-h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-3">
            <UsersRound size={18} className="text-brand" />
            <p className="text-sm font-bold text-slate-800">Contacts</p>
          </div>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto p-3 lg:block lg:max-h-[68vh] lg:space-y-2 lg:overflow-y-auto">
            {loading && <p className="p-3 text-sm text-slate-500">Loading contacts...</p>}
            {!loading && contacts.length === 0 && <p className="p-3 text-sm text-slate-500">No chat contacts available.</p>}
            {contacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => setActiveId(contact._id)}
                className={`min-w-64 rounded-lg border p-3 text-left lg:w-full ${activeId === contact._id ? 'border-brand bg-green-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{contact.fullName}</p>
                    <p className="truncate text-xs text-slate-500">@{contact.username} {contact.department ? `- ${contact.department}` : ''}</p>
                  </div>
                  {contact.unreadCount > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{contact.unreadCount}</span>}
                </div>
                <div className="mt-2"><RoleBadge role={contact.role} /></div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[60vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3">
            {activeContact ? (
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{activeContact.fullName}</p>
                <p className="text-xs text-slate-500">{activeContact.role}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><MessageCircle size={18} /> Select a contact</div>
            )}
          </div>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
            {activeContact && messages.length === 0 && <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}
            {!activeContact && <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500">Choose a person to chat with.</p>}
            {messages.map((message) => {
              const mine = String(message.sender?._id || message.sender) === String(user._id);
              return (
                <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-2 shadow-sm ${mine ? 'bg-brand text-white' : 'bg-white text-slate-800'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? 'text-green-50' : 'text-slate-400'}`}>{timeLabel(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="grid gap-2 border-t border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto]">
            <input value={body} onChange={(e) => setBody(e.target.value)} disabled={!activeContact} placeholder={activeContact ? 'Type a message...' : 'Select a contact first'} />
            <button disabled={!activeContact || !body.trim()} className="primary-btn disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
              <SendHorizonal size={17} /> Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
