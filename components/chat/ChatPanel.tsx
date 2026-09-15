'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessageAction, getChatMessagesAction } from '@/lib/actions/chat';

interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message_text: string;
  image_url: string;
  is_saved_by_admin: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

interface ChatPanelProps {
  orderId: string;
  currentUserId: string;
  isEnabled: boolean; // Only true for accepted/in_progress orders
}

export function ChatPanel({ orderId, currentUserId, isEnabled }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getChatMessagesAction(orderId);
      setMessages(msgs as unknown as ChatMessage[]);
    } catch {
      console.error('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Poll for new messages every 5 seconds when chat is open
  useEffect(() => {
    if (showChat && isEnabled) {
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 5000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [showChat, isEnabled, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showChat) scrollToBottom();
  }, [messages, showChat, scrollToBottom]);

  const handleSend = async () => {
    if ((!newMessage.trim() && !imagePreview) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      if (newMessage.trim()) formData.append('messageText', newMessage.trim());
      if (imagePreview) formData.append('imageUrl', imagePreview);

      const result = await sendChatMessageAction(formData);
      if (result.success) {
        setNewMessage('');
        setImagePreview(null);
        await fetchMessages();
      }
    } catch {
      console.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, create a data URL preview — in production, upload to Supabase Storage
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const handleRequestLocation = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('messageText', '[LOCATION_REQUEST]: يرجى إرسال موقعك الحالي عبر GPS لتسهيل الوصول إليك 📍');
      await sendChatMessageAction(formData);
      await fetchMessages();
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم مشاركة الموقع');
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const formData = new FormData();
          formData.append('orderId', orderId);
          formData.append(
            'messageText',
            `[LOCATION_SHARE]:{"lat":${lat},"lng":${lng},"address":"الموقع الحالي المباشر عبر GPS"}`
          );
          await sendChatMessageAction(formData);
          await fetchMessages();
        } catch (e) {
          console.error(e);
        } finally {
          setIsLocationLoading(false);
        }
      },
      (err) => {
        console.error(err);
        alert('تعذر تحديد الموقع الجغرافي. يرجى تفعيل الـ GPS وصلاحية الموقع.');
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isEnabled) return null;

  return (
    <div className="chat-panel" dir="rtl">
      {/* Toggle Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="chat-toggle-btn"
          aria-label="فتح المحادثة"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>محادثة</span>
          <span className="chat-toggle-en">Chat</span>
          {messages.length > 0 && (
            <span className="chat-badge">{messages.length}</span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {showChat && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <h3>المحادثة</h3>
              <span className="chat-header-en">Chat</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="chat-close-btn"
              aria-label="إغلاق"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {isLoading ? (
              <div className="chat-loading">
                <div className="chat-loading-spinner" />
                <span>جاري تحميل الرسائل...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>لا توجد رسائل بعد</p>
                <span>No messages yet</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`chat-message ${isMine ? 'chat-message-mine' : 'chat-message-other'}`}
                  >
                    {!isMine && (
                      <div className="chat-sender-name">
                        {msg.sender?.full_name || 'مستخدم'}
                      </div>
                    )}

                    {msg.image_url && (
                      <div className="chat-image-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.image_url}
                          alt="صورة مرفقة"
                          className="chat-image"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {msg.message_text && (
                      <div className="chat-bubble">
                        {msg.message_text.startsWith('[LOCATION_SHARE]:') ? (
                          (() => {
                            try {
                              const raw = msg.message_text.replace('[LOCATION_SHARE]:', '').trim();
                              const loc = JSON.parse(raw);
                              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
                              return (
                                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-slate-800 space-y-2 text-right">
                                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs sm:text-sm">
                                    <span className="text-base">📍</span>
                                    <span>موقع العميل المباشر</span>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    إحداثيات: {Number(loc.lat).toFixed(4)}, {Number(loc.lng).toFixed(4)}
                                  </p>
                                  <a
                                    href={gmapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold shadow-xs transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                                    </svg>
                                    <span>فتح في خرائط Google 🗺️</span>
                                  </a>
                                </div>
                              );
                            } catch {
                              return <p>{msg.message_text}</p>;
                            }
                          })()
                        ) : msg.message_text.startsWith('[LOCATION_REQUEST]:') ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 space-y-2 text-right">
                            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                              <span>📍</span>
                              <span>طلب مشاركة الموقع</span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {msg.message_text.replace('[LOCATION_REQUEST]:', '').trim()}
                            </p>
                            {!isMine && (
                              <button
                                type="button"
                                onClick={handleShareLocation}
                                disabled={isLocationLoading}
                                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#FA3802] hover:bg-[#e03102] text-white text-xs font-bold shadow-xs transition-colors"
                              >
                                <span>{isLocationLoading ? 'جاري التقاط الموقع...' : 'إرسال موقعي الحالي الآن 📍'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <p>{msg.message_text}</p>
                        )}
                      </div>
                    )}

                    <div className="chat-time">
                      {formatTime(msg.created_at)}
                      {msg.is_saved_by_admin && (
                        <span className="chat-saved-badge" title="محفوظة">📌</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Location Action Buttons */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isSending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 text-slate-700 hover:text-[#FA3802] border border-gray-200 text-xs font-medium transition-colors shadow-2xs"
            >
              <span>📍 طلب الموقع</span>
            </button>
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={isLocationLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FA3802] border border-orange-200 text-xs font-bold transition-colors shadow-2xs"
            >
              <span>{isLocationLoading ? 'جاري التحديد...' : '📍 إرسال موقعي'}</span>
            </button>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="chat-image-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="معاينة" />
              <button
                onClick={() => {
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="chat-image-remove"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="chat-file-input"
              hidden
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="chat-attach-btn"
              aria-label="إرفاق صورة"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك... | Type a message..."
              className="chat-text-input"
              disabled={isSending}
            />

            <button
              onClick={handleSend}
              disabled={isSending || (!newMessage.trim() && !imagePreview)}
              className="chat-send-btn"
              aria-label="إرسال"
            >
              {isSending ? (
                <div className="chat-send-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chat-panel {
          position: fixed;
          bottom: 80px;
          left: 16px;
          right: 16px;
          z-index: 1000;
          max-width: 420px;
          margin: 0 auto;
        }

        .chat-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--color-primary, #6C5CE7);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
          transition: all 0.3s ease;
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }
        .chat-toggle-btn:hover {
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 6px 25px rgba(108, 92, 231, 0.5);
        }
        .chat-toggle-en {
          font-size: 12px;
          opacity: 0.7;
        }
        .chat-badge {
          background: #FF6B6B;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 50px;
          min-width: 20px;
          text-align: center;
        }

        .chat-window {
          background: var(--surface-primary, #1a1a2e);
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 65vh;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
          animation: chatSlideUp 0.3s ease;
        }

        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--color-primary, #6C5CE7);
          color: white;
        }
        .chat-header-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        .chat-header-en {
          font-size: 12px;
          opacity: 0.7;
        }
        .chat-close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .chat-close-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 200px;
          max-height: 45vh;
          background: var(--surface-secondary, #16213e);
        }

        .chat-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 40px 20px;
          color: var(--text-secondary, #888);
        }
        .chat-loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border-color, rgba(255,255,255,0.1));
          border-top-color: var(--color-primary, #6C5CE7);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 20px;
          color: var(--text-secondary, #888);
          text-align: center;
        }
        .chat-empty span {
          font-size: 12px;
          opacity: 0.5;
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }
        .chat-message-mine {
          align-self: flex-start;
        }
        .chat-message-other {
          align-self: flex-end;
        }

        .chat-sender-name {
          font-size: 11px;
          color: var(--color-accent, #00cec9);
          margin-bottom: 2px;
          font-weight: 600;
        }

        .chat-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        .chat-message-mine .chat-bubble {
          background: var(--color-primary, #6C5CE7);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .chat-message-other .chat-bubble {
          background: var(--surface-tertiary, rgba(255,255,255,0.08));
          color: var(--text-primary, white);
          border-bottom-left-radius: 4px;
        }

        .chat-image-wrapper {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        .chat-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: cover;
          border-radius: 12px;
          cursor: pointer;
        }

        .chat-time {
          font-size: 10px;
          color: var(--text-secondary, #888);
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .chat-message-mine .chat-time {
          text-align: left;
        }
        .chat-message-other .chat-time {
          text-align: right;
          align-self: flex-end;
        }
        .chat-saved-badge {
          font-size: 12px;
        }

        .chat-image-preview {
          position: relative;
          padding: 8px 16px;
          background: var(--surface-secondary, #16213e);
          border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }
        .chat-image-preview img {
          max-height: 80px;
          border-radius: 8px;
          object-fit: cover;
        }
        .chat-image-remove {
          position: absolute;
          top: 4px;
          left: 20px;
          background: rgba(255,0,0,0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-input-area {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--surface-primary, #1a1a2e);
          border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }

        .chat-attach-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .chat-attach-btn:hover {
          color: var(--color-primary, #6C5CE7);
          background: rgba(108, 92, 231, 0.1);
        }

        .chat-text-input {
          flex: 1;
          padding: 10px 14px;
          background: var(--surface-secondary, #16213e);
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          border-radius: 20px;
          color: var(--text-primary, white);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-text-input::placeholder {
          color: var(--text-secondary, #888);
          font-size: 13px;
        }
        .chat-text-input:focus {
          border-color: var(--color-primary, #6C5CE7);
        }

        .chat-send-btn {
          background: var(--color-primary, #6C5CE7);
          border: none;
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .chat-send-btn:hover:not(:disabled) {
          background: var(--color-primary-dark, #5a4bd1);
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .chat-send-btn svg {
          transform: scaleX(-1);
        }

        .chat-send-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
    </div>
  );
}
