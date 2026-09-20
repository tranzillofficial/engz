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
  isEnabled: boolean;
  readOnly?: boolean;
}

export function ChatPanel({
  orderId,
  currentUserId,
  isEnabled,
  readOnly = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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

  // Poll for new messages when chat is open
  useEffect(() => {
    if (showChat && isEnabled) {
      fetchMessages();
      if (!readOnly) {
        pollingRef.current = setInterval(fetchMessages, 4000);
      }
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [showChat, isEnabled, readOnly, fetchMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (showChat) {
      scrollToBottom();
    }
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

  const handleRequestLocation = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append(
        'messageText',
        '[LOCATION_REQUEST]: يرجى إرسال موقعك الحالي عبر GPS لتسهيل الوصول إليك 📍'
      );
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
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating Toggle Button (Positioned cleanly at bottom-left above mobile bar) */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-20 left-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FA3802] text-white font-bold text-xs shadow-lg shadow-orange-500/30 hover:bg-[#e03102] hover:scale-105 transition-all duration-200"
          aria-label="فتح المحادثة"
        >
          <span className="text-base">💬</span>
          <span>محادثة الطلب</span>
          {messages.length > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-[#FA3802] text-[10px] font-black inline-flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Modal Chat Window */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-200/80 dark:border-slate-800"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#FA3802] text-white">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  💬
                </span>
                <div>
                  <h3 className="text-sm font-black">محادثة الطلب</h3>
                  <span className="text-[10px] text-white/80">#{orderId.slice(0, 8)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] bg-slate-50/50 dark:bg-slate-950/40">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <span className="animate-spin text-2xl mb-2">⏳</span>
                  <span>جاري تحميل الرسائل...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs space-y-2">
                  <span className="text-3xl opacity-60">💬</span>
                  <p className="font-bold text-slate-600 dark:text-slate-400">لا توجد رسائل بعد</p>
                  <p className="text-[11px]">يمكنك التواصل مع الطرف الآخر وتحديد مكان التوصيل بسهولة.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        isMine ? 'mr-auto items-start' : 'ml-auto items-end'
                      }`}
                    >
                      {!isMine && (
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {msg.sender?.full_name || 'الطرف الآخر'}
                        </span>
                      )}

                      {msg.image_url && (
                        <div className="rounded-2xl overflow-hidden mb-1.5 border border-slate-200 dark:border-slate-700 max-w-[220px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.image_url}
                            alt="صورة مرفقة"
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {msg.message_text && (
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMine
                              ? 'bg-[#FA3802] text-white rounded-tr-xs shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.message_text.startsWith('[LOCATION_SHARE]:') ? (
                            (() => {
                              try {
                                const raw = msg.message_text
                                  .replace('[LOCATION_SHARE]:', '')
                                  .trim();
                                const loc = JSON.parse(raw);
                                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
                                return (
                                  <div className="space-y-2 text-right">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <span>📍</span>
                                      <span>موقع العميل المباشر</span>
                                    </div>
                                    <p className="text-[11px] opacity-90">
                                      إحداثيات: {Number(loc.lat).toFixed(4)}, {Number(loc.lng).toFixed(4)}
                                    </p>
                                    <a
                                      href={gmapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white text-[#FA3802] text-xs font-black shadow-xs transition-colors hover:bg-orange-50"
                                    >
                                      <span>فتح في خرائط Google 🗺️</span>
                                    </a>
                                  </div>
                                );
                              } catch {
                                return <p>{msg.message_text}</p>;
                              }
                            })()
                          ) : msg.message_text.startsWith('[LOCATION_REQUEST]:') ? (
                            <div className="space-y-2 text-right">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>📍</span>
                                <span>طلب تحديد الموقع</span>
                              </div>
                              <p className="text-[11px]">
                                {msg.message_text.replace('[LOCATION_REQUEST]:', '').trim()}
                              </p>
                              {!isMine && (
                                <button
                                  type="button"
                                  onClick={handleShareLocation}
                                  disabled={isLocationLoading}
                                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white text-[#FA3802] text-xs font-black shadow-xs hover:bg-orange-50 transition-colors"
                                >
                                  <span>
                                    {isLocationLoading
                                      ? 'جاري التقاط GPS...'
                                      : 'إرسال موقعي الحالي الآن 📍'}
                                  </span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>{msg.message_text}</p>
                          )}
                        </div>
                      )}

                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Location Action Bar */}
            {!readOnly && (
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={isSending}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-[#FA3802] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                >
                  <span>📍 طلب الموقع</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isLocationLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-[#FA3802] border border-orange-200 dark:border-orange-900/50 text-xs font-black transition-colors"
                >
                  <span>{isLocationLoading ? 'جاري التحديد...' : '📍 إرسال موقعي'}</span>
                </button>
              </div>
            )}

            {/* Image Preview */}
            {!readOnly && imagePreview && (
              <div className="relative p-2 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 border-t border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="معاينة الصورة"
                  className="w-14 h-14 object-cover rounded-xl border"
                />
                <span className="text-xs text-slate-500">جاهز للإرسال</span>
                <button
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mr-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Footer / Input Area */}
            {readOnly ? (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                🔒 المحادثة مغلقة بعد اكتمال الطلب
              </div>
            ) : (
              <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  hidden
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-[#FA3802] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 text-lg"
                  aria-label="إرفاق صورة"
                  title="إرفاق صورة"
                >
                  📷
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 h-10 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/40"
                  disabled={isSending}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || (!newMessage.trim() && !imagePreview)}
                  className="h-10 px-4 rounded-2xl bg-[#FA3802] text-white text-xs font-black flex items-center justify-center hover:bg-[#e03102] transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                  aria-label="إرسال"
                >
                  {isSending ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <span>إرسال 🚀</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
