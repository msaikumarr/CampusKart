import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API, { API_BASE_URL } from '../utils/api';
import { io } from 'socket.io-client';

const socket = io(API_BASE_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatFileSize(size) {
  if (size === null || size === undefined) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(message) {
  const attachmentType = message?.attachment?.type || '';
  return Boolean(message?.attachment?.isImage || attachmentType.startsWith('image/') || message?.image);
}

function getAttachmentUrl(message) {
  return message?.attachment?.url || message?.image || '';
}

function getAttachmentName(message) {
  return message?.attachment?.name || 'Attachment';
}

function getMessagePreview(message) {
  if (!message) return '';
  if (message.message?.trim()) return message.message;
  if (message.attachment?.name) return `Attachment: ${message.attachment.name}`;
  if (message.image) return 'Attachment';
  return '';
}

function hasReceiptForUser(entries, userId) {
  if (!Array.isArray(entries) || !userId) return false;
  return entries.some((entry) => String(entry?.user?._id || entry?.user) === String(userId));
}

function Avatar({ name, size = 'md' }) {
  const letter = (name || '?')[0].toUpperCase();
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  return (
    <span className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}>
      {letter}
    </span>
  );
}

function FileGlyph() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
    </svg>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats]             = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [newMessage, setNewMessage]   = useState('');
  const [sending, setSending]         = useState(false);
  const [connected, setConnected]     = useState(socket.connected);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch]           = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [presence, setPresence]       = useState({ online: false, lastSeen: null });
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupTime, setMeetupTime]   = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [safety, setSafety] = useState({ reportCount: 0, scamWarning: false, blockedByYou: false, blockedYou: false });
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const attachmentRef  = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef    = useRef(false);

  // Socket connection status
  useEffect(() => {
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => { socket.off('connect'); socket.off('disconnect'); };
  }, []);

  // Load chats
  useEffect(() => {
    if (user) {
      console.log('📨 Loading chats for user:', user._id, user.username);
      // Join user-specific room for notifications
      socket.emit('joinUserRoom', user._id);
      API.get('/api/chat')
        .then(res => {
          console.log('✅ Chats loaded:', res.data);
          setChats(res.data);
        })
        .catch(err => console.error('❌ Error loading chats:', err));
    }
  }, [user]);

  // Load messages when chat selected
  useEffect(() => {
    if (!selectedChat) return;
    console.log('📩 Joining chat room:', selectedChat._id);
    socket.emit('joinChat', selectedChat._id);
    API.get(`/api/chat/${selectedChat._id}/messages`)
      .then(res => {
        console.log('✅ Messages loaded:', res.data);
        setMessages(res.data);
        API.post(`/api/chat/${selectedChat._id}/read`).catch(() => {});
      })
      .catch(err => console.error('❌ Error loading messages:', err));
    const otherUserId = user?._id === selectedChat.buyer?._id ? selectedChat.seller?._id : selectedChat.buyer?._id;
    if (otherUserId) {
      socket.emit('requestPresence', { userId: otherUserId });
      setSafetyLoading(true);
      API.get(`/api/safety/status/${otherUserId}`)
        .then(res => setSafety(res.data))
        .catch(() => setSafety({ reportCount: 0, scamWarning: false, blockedByYou: false, blockedYou: false }))
        .finally(() => setSafetyLoading(false));
    }
    // On mobile, hide sidebar when chat selected
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [selectedChat, user?._id]);

  // Incoming messages
  useEffect(() => {
    socket.on('newMessage', (data) => {
      console.log('💬 New message received:', data);
      if (selectedChat && selectedChat._id === data.chatId) {
        setMessages(prev => [...prev, data]);
        API.post(`/api/chat/${selectedChat._id}/read`).catch(() => {});
      }
      // Update last message preview in sidebar
      setChats(prev => prev.map(c =>
        c._id === data.chatId
          ? {
              ...c,
              lastMessage: data,
              unreadCount: selectedChat && selectedChat._id === data.chatId
                ? 0
                : (c.unreadCount || 0) + (String(data?.sender?._id || data?.sender) === String(user?._id) ? 0 : 1),
            }
          : c
      ));
    });

    socket.on('messageReceived', (data) => {
      console.log('📥 Message received notification:', data);
      // Refresh chat list when a new message arrives for any chat
      if (user) {
        API.get('/api/chat').then(res => {
          console.log('✅ Chats refreshed after message received:', res.data);
          setChats(res.data);
        });
      }
    });

    socket.on('messagesUpdated', (data) => {
      if (!selectedChat || selectedChat._id !== data.chatId) return;
      API.get(`/api/chat/${selectedChat._id}/messages`)
        .then(res => setMessages(res.data))
        .catch(() => {});
      API.get('/api/chat').then(res => setChats(res.data)).catch(() => {});
    });

    socket.on('typing', (data) => {
      if (!selectedChat || data.chatId !== selectedChat._id) return;
      const otherUserId = user?._id === selectedChat.buyer?._id ? selectedChat.seller?._id : selectedChat.buyer?._id;
      if (String(data.userId) !== String(otherUserId)) return;
      setIsOtherTyping(Boolean(data.typing));
    });

    socket.on('presenceUpdate', (data) => {
      if (!selectedChat) return;
      const otherUserId = user?._id === selectedChat.buyer?._id ? selectedChat.seller?._id : selectedChat.buyer?._id;
      if (String(data.userId) !== String(otherUserId)) return;
      setPresence({ online: Boolean(data.online), lastSeen: data.lastSeen || null });
    });

    // Listen for new chat notifications
    socket.on('chatCreated', (data) => {
      console.log('🆕 New chat created:', data);
      if (user) {
        API.get('/api/chat').then(res => {
          console.log('✅ Chats refreshed after new chat:', res.data);
          setChats(res.data);
        });
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageReceived');
      socket.off('chatCreated');
      socket.off('messagesUpdated');
      socket.off('typing');
      socket.off('presenceUpdate');
    };
  }, [user, selectedChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setIsOtherTyping(false);
    setPresence({ online: false, lastSeen: null });
    setModerationMessage('');
    setAttachmentFile(null);
    setAttachmentPreview('');
  }, [selectedChat?._id]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current && selectedChat && user) {
      socket.emit('typingStop', { chatId: selectedChat._id, userId: user._id });
    }
  }, [selectedChat, user]);

  useEffect(() => () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
  }, [attachmentPreview]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachmentFile) || sending || !selectedChat) return;
    setSending(true);
    try {
      console.log('📤 Sending message:', newMessage);
      const formData = new FormData();
      formData.append('chatId', selectedChat._id);
      formData.append('itemId', selectedChat.item?._id || '');
      formData.append('message', newMessage);
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }
      await API.post('/api/chat/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewMessage('');
      setAttachmentFile(null);
      setAttachmentPreview('');
      if (isTypingRef.current) {
        socket.emit('typingStop', { chatId: selectedChat._id, userId: user._id });
        isTypingRef.current = false;
      }
      inputRef.current?.focus();
    } catch (err) {
      console.error('❌ Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTypingChange = (value) => {
    setNewMessage(value);
    if (!selectedChat || !user) return;

    if (!isTypingRef.current && value.trim()) {
      socket.emit('typingStart', { chatId: selectedChat._id, userId: user._id });
      isTypingRef.current = true;
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('typingStop', { chatId: selectedChat._id, userId: user._id });
        isTypingRef.current = false;
      }
    }, 1200);

    if (!value.trim() && isTypingRef.current) {
      socket.emit('typingStop', { chatId: selectedChat._id, userId: user._id });
      isTypingRef.current = false;
    }
  };

  const sendOffer = async () => {
    if (!selectedChat || !offerAmount || Number(offerAmount) <= 0) return;
    try {
      await API.post('/api/chat/offer', { chatId: selectedChat._id, amount: Number(offerAmount) });
      setOfferAmount('');
      setShowOfferInput(false);
    } catch (error) {
      console.error('❌ Error sending offer:', error);
    }
  };

  const respondOffer = async (messageId, status) => {
    try {
      let payload = { chatId: selectedChat._id, messageId, status };
      if (status === 'countered') {
        const value = window.prompt('Enter your counter offer amount');
        if (!value || Number(value) <= 0) return;
        payload = { ...payload, counterAmount: Number(value) };
      }
      await API.post('/api/chat/offer/respond', payload);
      const refreshed = await API.get(`/api/chat/${selectedChat._id}/messages`);
      setMessages(refreshed.data);
      const chatsRes = await API.get('/api/chat');
      setChats(chatsRes.data);
    } catch (error) {
      console.error('❌ Error responding to offer:', error);
    }
  };

  const proposeMeetup = async () => {
    if (!selectedChat || !meetupLocation.trim() || !meetupTime) return;
    try {
      await API.post('/api/chat/meetup', {
        chatId: selectedChat._id,
        location: meetupLocation.trim(),
        scheduledFor: meetupTime,
      });
      setMeetupLocation('');
      setMeetupTime('');
      setShowMeetupForm(false);
    } catch (error) {
      console.error('❌ Error proposing meetup:', error);
    }
  };

  const respondMeetup = async (messageId, status) => {
    try {
      await API.post('/api/chat/meetup/respond', {
        chatId: selectedChat._id,
        messageId,
        status,
      });
      const refreshed = await API.get(`/api/chat/${selectedChat._id}/messages`);
      setMessages(refreshed.data);
      const chatsRes = await API.get('/api/chat');
      setChats(chatsRes.data);
    } catch (error) {
      console.error('❌ Error responding to meetup:', error);
    }
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentFile(file);
    setAttachmentPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    setModerationMessage(file.type.startsWith('image/') ? '' : 'File attachment ready to send.');
  };

  const toggleBlockedUser = async (shouldBlock) => {
    if (!selectedChat || !otherParty) return;
    setModerationSaving(true);
    try {
      if (shouldBlock) {
        await API.post('/api/safety/block', { targetUserId: otherParty._id });
        setSafety((prev) => ({ ...prev, blockedByYou: true }));
        setModerationMessage('User blocked.');
      } else {
        await API.post('/api/safety/unblock', { targetUserId: otherParty._id });
        setSafety((prev) => ({ ...prev, blockedByYou: false }));
        setModerationMessage('User unblocked.');
      }
    } catch {
      setModerationMessage('Unable to update block settings.');
    } finally {
      setModerationSaving(false);
    }
  };

  const reportUser = async () => {
    if (!selectedChat || !otherParty) return;
    const reason = window.prompt('Why are you reporting this user?');
    if (!reason) return;
    setModerationSaving(true);
    try {
      await API.post('/api/safety/report', {
        entityType: 'user',
        targetUserId: otherParty._id,
        chatId: selectedChat._id,
        reason,
      });
      setModerationMessage('Thanks. The report was submitted.');
    } catch {
      setModerationMessage('Unable to submit the report.');
    } finally {
      setModerationSaving(false);
    }
  };

  const filteredChats = chats.filter(c =>
    c.item?.title?.toLowerCase().includes(search.toLowerCase()) ||
    (c.buyer?._id === user?._id ? c.seller : c.buyer)?.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
        <svg className="w-8 h-8" style={{ color: '#1d4ed8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="font-bold text-lg" style={{ color: '#1e293b' }}>Sign in to view chats</p>
      <Link to="/login" className="px-6 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}>
        Login
      </Link>
    </div>
  );

  const otherParty = selectedChat
    ? (user._id === selectedChat.buyer?._id ? selectedChat.seller : selectedChat.buyer)
    : null;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100dvh-64px)] overflow-hidden" style={{ backgroundColor: '#faf8f4' }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`flex flex-col border-r transition-all duration-300 shrink-0
          ${selectedChat ? 'hidden md:flex md:w-80 lg:w-96' : sidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-0 md:w-80 lg:w-96 overflow-hidden'}`}
        style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
      >
        {/* Sidebar header */}
        <div className="px-3 sm:px-4 pt-4 sm:pt-5 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold" style={{ color: '#1e293b' }}>Messages</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-slate-300'}`} />
              <span className="text-xs font-medium" style={{ color: connected ? '#16a34a' : '#94a3b8' }}>
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center rounded-xl border gap-2 px-3"
            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm py-2.5 outline-none"
              style={{ color: '#1e293b' }} />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                <svg className="w-6 h-6" style={{ color: '#1d4ed8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#475569' }}>
                {search ? 'No chats found' : 'No conversations yet'}
              </p>
              {!search && (
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  Message a seller from any listing to start a chat.
                </p>
              )}
            </div>
          ) : (
            filteredChats.map(chat => {
              const isBuyer  = user._id === chat.buyer?._id;
              const other    = isBuyer ? chat.seller : chat.buyer;
              const isActive = selectedChat?._id === chat._id;
              const lastMsg  = getMessagePreview(chat.lastMessage);

              return (
                <button key={chat._id} onClick={() => {
                  setSelectedChat(chat);
                  setChats((prev) => prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)));
                }}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3.5 text-left transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #1d4ed8' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Avatar name={other?.username || other?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>
                        {other?.username || other?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isBuyer ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isBuyer ? 'Buying' : 'Selling'}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500 text-white">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] shrink-0" style={{ color: '#94a3b8' }}>
                          {timeAgo(chat.lastMessage?.createdAt || chat.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#64748b' }}>
                      {chat.item?.title}
                    </p>
                    {lastMsg && (
                      <p className="text-xs truncate mt-0.5" style={{ color: '#94a3b8' }}>{lastMsg}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ══════════════ CHAT AREA ══════════════ */}
      <main className={`flex-1 flex flex-col min-w-0 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 shrink-0"
              style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              {/* Mobile back */}
              <button className="md:hidden p-1.5 rounded-lg mr-1"
                onClick={() => setSidebarOpen(true)}
                style={{ color: '#64748b' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <Avatar name={otherParty?.username || otherParty?.name} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: '#1e293b' }}>
                  {otherParty?.username || otherParty?.name || 'Unknown'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user._id === selectedChat.buyer?._id ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user._id === selectedChat.buyer?._id ? 'Buying' : 'Selling'}
                  </span>
                  <Link to={`/item/${selectedChat.item?._id}`}
                    className="text-xs truncate max-w-40 sm:max-w-xs hover:underline" style={{ color: '#1d4ed8' }}>
                    {selectedChat.item?.title}
                  </Link>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: presence.online ? '#16a34a' : '#94a3b8' }}>
                    {presence.online ? 'Online' : (presence.lastSeen ? `Last seen ${timeAgo(presence.lastSeen)}` : 'Offline')}
                  </span>
                </div>
                {isOtherTyping && (
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: '#1d4ed8' }}>
                    typing...
                  </p>
                )}
                {safetyLoading ? (
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: '#94a3b8' }}>Checking safety status…</p>
                ) : safety.scamWarning ? (
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: '#b91c1c' }}>
                    Scam warning: this user has multiple reports.
                  </p>
                ) : null}
              </div>

              {/* Item price chip */}
              {selectedChat.item?.price && (
                <span className="hidden sm:block text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  ₹{selectedChat.item.price}
                </span>
              )}

              {/* View item link */}
              <Link to={`/item/${selectedChat.item?._id}`}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 shrink-0"
                style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Item
              </Link>

              <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={reportUser}
                  disabled={moderationSaving}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-rose-50"
                  style={{ borderColor: '#fecaca', color: '#dc2626', backgroundColor: '#fff5f5' }}
                >
                  Report
                </button>
                <button
                  onClick={() => toggleBlockedUser(!safety.blockedByYou)}
                  disabled={moderationSaving}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-50"
                  style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#f8fafc' }}
                >
                  {safety.blockedByYou ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 flex flex-col gap-2 sm:gap-2.5"
              style={{ backgroundColor: '#faf8f4' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-3 py-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                    <svg className="w-7 h-7" style={{ color: '#1d4ed8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#475569' }}>No messages yet</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Say hello to start the conversation!</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMine    = msg.sender?._id === user._id;
                const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);
                const isLast     = idx === messages.length - 1 || messages[idx + 1]?.sender?._id !== msg.sender?._id;
                const recipientId = user._id === selectedChat?.buyer?._id ? selectedChat?.seller?._id : selectedChat?.buyer?._id;
                const isSeen = hasReceiptForUser(msg.readBy, recipientId);
                const isDelivered = hasReceiptForUser(msg.deliveredTo, recipientId);
                const statusText = isSeen ? 'Seen' : (isDelivered ? 'Delivered' : 'Sent');

                return (
                  <div key={idx} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar placeholder for alignment */}
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {showAvatar && <Avatar name={msg.sender?.username || 'User'} size="sm" />}
                      </div>
                    )}

                    <div className={`flex flex-col gap-0.5 max-w-[84%] sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {/* Sender name (first message in group) */}
                      {!isMine && showAvatar && (
                        <p className="text-[10px] font-bold px-1 mb-0.5" style={{ color: '#64748b' }}>
                          {msg.sender?.username || 'Unknown'}
                        </p>
                      )}

                      {/* Bubble */}
                      {msg.type === 'offer' && msg.offer ? (
                        <div
                          className="px-3.5 sm:px-4 py-3 text-sm leading-relaxed rounded-2xl border"
                          style={{
                            backgroundColor: isMine ? '#dbeafe' : '#ffffff',
                            color: '#1e293b',
                            borderColor: '#bfdbfe',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <p className="font-bold">Offer: ₹{msg.offer.amount}</p>
                          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                            Status: {msg.offer.status}
                            {msg.offer.counterAmount ? ` (₹${msg.offer.counterAmount})` : ''}
                          </p>
                          {!isMine && msg.offer.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => respondOffer(msg._id, 'accepted')} className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-800">Accept</button>
                              <button onClick={() => respondOffer(msg._id, 'declined')} className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-800">Decline</button>
                              <button onClick={() => respondOffer(msg._id, 'countered')} className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-800">Counter</button>
                            </div>
                          )}
                        </div>
                      ) : msg.type === 'meetup' && msg.meetup ? (
                        <div
                          className="px-3.5 sm:px-4 py-3 text-sm leading-relaxed rounded-2xl border"
                          style={{
                            backgroundColor: isMine ? '#ecfccb' : '#ffffff',
                            color: '#1e293b',
                            borderColor: '#bbf7d0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <p className="font-bold">Meetup Proposal</p>
                          <p className="text-xs mt-1" style={{ color: '#64748b' }}>{msg.meetup.location}</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>{formatDateTime(msg.meetup.scheduledFor)}</p>
                          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Status: {msg.meetup.status}</p>
                          {!isMine && msg.meetup.status === 'proposed' && (
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => respondMeetup(msg._id, 'accepted')} className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-800">Accept</button>
                              <button onClick={() => respondMeetup(msg._id, 'declined')} className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-800">Decline</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="px-3.5 sm:px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            backgroundColor: isMine ? '#1d4ed8' : '#ffffff',
                            color: isMine ? '#faf8f4' : '#1e293b',
                            borderRadius: isMine
                              ? '20px 20px 4px 20px'
                              : '20px 20px 20px 4px',
                            border: isMine ? 'none' : '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          {msg.message || '(empty message)'}
                          {getAttachmentUrl(msg) && isImageAttachment(msg) && (
                            <a href={getAttachmentUrl(msg)} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl border border-white/20">
                              <img src={getAttachmentUrl(msg)} alt="Attachment" className="max-w-40 sm:max-w-56 rounded-xl object-cover" />
                            </a>
                          )}
                          {getAttachmentUrl(msg) && !isImageAttachment(msg) && (
                            <a
                              href={getAttachmentUrl(msg)}
                              target="_blank"
                              rel="noreferrer"
                              download={getAttachmentName(msg)}
                              className="mt-2 flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-opacity hover:opacity-90"
                              style={{ borderColor: isMine ? 'rgba(255,255,255,0.25)' : '#e2e8f0', backgroundColor: isMine ? 'rgba(255,255,255,0.08)' : '#f8fafc' }}
                            >
                              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isMine ? 'rgba(255,255,255,0.14)' : '#e2e8f0', color: isMine ? '#faf8f4' : '#475569' }}>
                                <FileGlyph />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-bold truncate">{getAttachmentName(msg)}</span>
                                <span className="block text-[11px] truncate" style={{ color: isMine ? 'rgba(250,248,244,0.75)' : '#64748b' }}>
                                  {msg.attachment?.type || 'File attachment'}{msg.attachment?.size ? ` • ${formatFileSize(msg.attachment.size)}` : ''}
                                </span>
                              </span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      {isLast && (
                        <div className={`flex items-center gap-1 text-[10px] px-1 ${isMine ? 'justify-end' : 'justify-start'}`} style={{ color: '#94a3b8' }}>
                          <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                          {isMine && <span>{statusText}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-3 sm:px-5 py-3.5 sm:py-4 shrink-0"
              style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowOfferInput((prev) => !prev)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 font-semibold"
                >
                  Offer
                </button>
                <button
                  onClick={() => setShowMeetupForm((prev) => !prev)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-800 font-semibold"
                >
                  Schedule Meetup
                </button>
                <button
                  onClick={() => attachmentRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Add File
                </button>
              </div>

              <input
                ref={attachmentRef}
                type="file"
                className="hidden"
                onChange={handleAttachmentChange}
              />

              {attachmentFile && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border p-2" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="Attachment preview" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                      <FileGlyph />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold" style={{ color: '#1e293b' }}>Attachment ready to send</p>
                    <p className="text-[11px] truncate" style={{ color: '#64748b' }}>{attachmentFile?.name}</p>
                    {!attachmentPreview && attachmentFile?.type && (
                      <p className="text-[11px] truncate" style={{ color: '#94a3b8' }}>
                        {attachmentFile.type}{attachmentFile.size ? ` • ${formatFileSize(attachmentFile.size)}` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (attachmentPreview) {
                        URL.revokeObjectURL(attachmentPreview);
                      }
                      setAttachmentFile(null);
                      setAttachmentPreview('');
                      setModerationMessage('');
                    }}
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                    style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {moderationMessage && (
                <p className="mb-3 text-xs font-semibold" style={{ color: moderationMessage.includes('Unable') ? '#dc2626' : '#16a34a' }}>
                  {moderationMessage}
                </p>
              )}

              {showOfferInput && (
                <div className="mb-3 flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="number"
                    min="1"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 rounded-xl border px-3 py-2.5 text-sm"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                  <button
                    onClick={sendOffer}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: '#1d4ed8', color: '#faf8f4' }}
                  >
                    Send Offer
                  </button>
                </div>
              )}

              {showMeetupForm && (
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                    placeholder="Meetup location"
                    className="rounded-xl border px-3 py-2.5 text-sm"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                  <input
                    type="datetime-local"
                    value={meetupTime}
                    onChange={(e) => setMeetupTime(e.target.value)}
                    className="rounded-xl border px-3 py-2.5 text-sm"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                  <button
                    onClick={proposeMeetup}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: '#16a34a', color: '#faf8f4' }}
                  >
                    Propose Meetup
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-2xl border px-3.5 sm:px-4 py-2.5 transition-all duration-200"
                style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                onFocus={() => {}}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => handleTypingChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none py-1"
                  style={{ color: '#1e293b' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !attachmentFile) || sending}
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 disabled:opacity-40 shrink-0"
                  style={{
                    background: (newMessage.trim() || attachmentFile) ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : '#e2e8f0',
                    color: (newMessage.trim() || attachmentFile) ? '#faf8f4' : '#94a3b8',
                  }}
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-center text-[10px] mt-2" style={{ color: '#cbd5e1' }}>
                Press Enter to send
              </p>
            </div>
          </>
        ) : (
          /* No chat selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 py-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
              <svg className="w-10 h-10" style={{ color: '#faf8f4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-extrabold mb-1" style={{ color: '#1e293b' }}>Your Messages</p>
              <p className="text-sm max-w-xs" style={{ color: '#64748b' }}>
                Select a conversation from the left, or contact a seller from any listing page.
              </p>
            </div>
            <Link to="/products"
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}>
              Browse Listings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
} 