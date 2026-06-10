import { ArrowLeft, MessageCircle, Search, SendHorizonal, UsersRound } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const scroller = useRef(null);
  const activeContact = useMemo(() => contacts.find((contact) => contact._id === activeId), [contacts, activeId]);
  const filteredContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) => [contact.fullName, contact.username, contact.role, contact.department]
      .some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [contacts, query]);

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
    <div className="space-y-3 lg:space-y-4">
      <div>
        <h2 className="page-title">Team Chat</h2>
        <p className="page-subtitle">Message Boss/Admin, managers, and members connected to your events.</p>
      </div>

      <div className="grid h-[calc(100dvh-13.5rem)] min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:h-[72vh] lg:min-h-[560px] lg:grid-cols-[320px_1fr]">
        <aside className={`${mobileConversationOpen ? 'hidden' : 'flex'} min-h-0 flex-col bg-slate-50 lg:flex lg:border-r`}>
          <div className="border-b border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center gap-2">
              <UsersRound size={18} className="text-brand" />
              <p className="text-sm font-bold text-slate-800">Contacts</p>
              {contacts.some((contact) => contact.unreadCount > 0) && (
                <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                  {contacts.reduce((sum, contact) => sum + Number(contact.unreadCount || 0), 0)}
                </span>
              )}
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" className="min-h-10 rounded-lg bg-slate-50 pl-9 text-sm" />
            </label>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {loading && <p className="p-3 text-sm text-slate-500">Loading contacts...</p>}
            {!loading && contacts.length === 0 && <p className="p-3 text-sm text-slate-500">No chat contacts available.</p>}
            {!loading && contacts.length > 0 && filteredContacts.length === 0 && <p className="p-3 text-sm text-slate-500">No people found.</p>}
            {filteredContacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => {
                  setActiveId(contact._id);
                  setMobileConversationOpen(true);
                }}
                className={`w-full rounded-lg border p-3 text-left ${activeId === contact._id ? 'border-brand bg-green-50 ring-2 ring-green-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={contact.fullName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{contact.fullName}</p>
                      <p className="truncate text-xs text-slate-500">@{contact.username} {contact.department ? `- ${contact.department}` : ''}</p>
                    </div>
                  </div>
                  {contact.unreadCount > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{contact.unreadCount}</span>}
                </div>
                <div className="mt-2 pl-11"><RoleBadge role={contact.role} /></div>
              </button>
            ))}
          </div>
        </aside>

        <section className={`${mobileConversationOpen ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex`}>
          <div className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-3 backdrop-blur">
            {activeContact ? (
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={() => setMobileConversationOpen(false)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Back to contacts">
                  <ArrowLeft size={20} />
                </button>
                <Avatar name={activeContact.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{activeContact.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{activeContact.role}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><MessageCircle size={18} /> Select a contact</div>
            )}
          </div>

          <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
            {activeContact && messages.length === 0 && <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}
            {!activeContact && <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500">Choose a person to chat with.</p>}
            {messages.map((message) => {
              const mine = String(message.sender?._id || message.sender) === String(user._id);
              return (
                <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[84%] rounded-2xl px-4 py-2 shadow-sm sm:max-w-[72%] ${mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white text-slate-800'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? 'text-green-50' : 'text-slate-400'}`}>{timeLabel(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-200 bg-white p-3">
            <input value={body} onChange={(e) => setBody(e.target.value)} disabled={!activeContact} placeholder={activeContact ? 'Type a message...' : 'Select a contact first'} />
            <button disabled={!activeContact || !body.trim()} className="inline-flex min-h-11 min-w-12 items-center justify-center rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-24">
              <SendHorizonal size={18} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initials = String(name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-black text-brand">
      {initials || 'U'}
    </span>
  );
}
