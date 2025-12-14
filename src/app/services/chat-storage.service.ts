import { Injectable } from '@angular/core';
import { ChatMessage } from '../interfaces/chat-message.interface';

const CHAT_STORAGE_KEY = 'chat_messages_v1';

@Injectable({
  providedIn: 'root'
})
export class ChatStorageService {
  loadMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load chat from localStorage', e);
      return [];
    }
  }

  saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat to localStorage', e);
    }
  }

  clear(): void {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }
}
