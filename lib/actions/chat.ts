// ============================================================
// Engz Chat Actions — Server Actions for chat operations
// ============================================================
'use server';

import { getCurrentUser } from '@/lib/services/auth';
import {
  sendMessage,
  getMessages,
  adminSaveMessage,
  adminSaveConversation,
  getOrdersWithChats,
} from '@/lib/services/chat';

export async function sendChatMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'غير مسجل الدخول' };
  }

  const orderId = formData.get('orderId') as string;
  const messageText = formData.get('messageText') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!orderId) {
    return { success: false, error: 'معرف الطلب مطلوب' };
  }

  return sendMessage({
    orderId,
    senderId: user.id,
    messageText: messageText || undefined,
    imageUrl: imageUrl || undefined,
  });
}

export async function getChatMessagesAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  return getMessages(orderId);
}

export async function saveChatMessageAction(messageId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return { success: false, error: 'غير مصرح' };
  }

  return adminSaveMessage(messageId, user.id);
}

export async function saveConversationAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return { success: false, error: 'غير مصرح' };
  }

  return adminSaveConversation(orderId, user.id);
}

export async function getOrdersWithChatsAction(page?: number) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return { orders: [], page: 1, totalPages: 0 };
  }

  return getOrdersWithChats({ page });
}
