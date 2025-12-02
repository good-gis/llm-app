// src/app/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = environment.apiUrl;
  private readonly apiKey = environment.apiKey;

  constructor(private http: HttpClient) {}

  sendMessage(messages: ChatMessage[], jsonAnswer: boolean = false): Observable<ChatResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    if (jsonAnswer) {
      messages.push({
        role: "system",
        content: 'Ты — строгий JSON-ассистент. На любой запрос пользователя ты отвечаешь ТОЛЬКО валидным JSON. Никаких пояснений, комментариев, markdown, ```json или дополнительного текста. Только чистый JSON. Формат ответа: {"response": "строка с ответом на вопрос пользователя","type": "text", // или "error", "clarification" и т.д., если нужно" timestamp": "ISO 8601 строка" } Убедись, что JSON валиден и может быть распарсен без ошибок.',
      });
    }

    const body = {
      model: 'DeepSeek V3.2-Exp',
      messages: messages,
    };

    return this.http.post<ChatResponse>(this.apiUrl, body, { headers });
  }
}
