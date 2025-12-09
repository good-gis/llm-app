import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CredentialsService } from './credentials.service';
import {ChatResponse} from '../interfaces/chat-response.interface';
import {ChatMessage} from '../interfaces/chat-message.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly credentialsService = inject(CredentialsService);
  private readonly http = inject(HttpClient);

  sendMessage(messages: ChatMessage[], mode: 'book' | 'json' | null, temperature: number): Observable<ChatResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.credentialsService.getCredentials().apiKey}`,
      'Content-Type': 'application/json'
    });

    const systemPrompts: Record<string, string> = {
      book: 'Ты — эксперт по подбору книг. Задай пользователю ровно три вопроса по одному: 1) Какие жанры или темы тебя интересуют? 2) Какое у тебя сейчас настроение или цель чтения? 3) Назови одну любимую книгу или автора (если есть). После получения всех трёх ответов немедленно порекомендуй ровно одну книгу: укажи название, автора и кратко (2–3 предложения) объясни, почему она идеально подходит именно этому человеку. Не задавай вопросы одновременно, не рекомендуй более одной книги и не предлагай альтернативы.',
      json: 'Ты — строгий JSON-ассистент. На любой запрос пользователя ты отвечаешь ТОЛЬКО валидным JSON. Никаких пояснений, комментариев, markdown, ```json или дополнительного текста. Только чистый JSON. Формат ответа: {"response": "строка с ответом на вопрос пользователя","type": "text", // или "error", "clarification" и т.д., если нужно" timestamp": "ISO 8601 строка" } Убедись, что JSON валиден и может быть распарсен без ошибок.',
    };

    const systemPrompt = mode === null ? null : systemPrompts[mode];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
        usage: undefined,
        timeOfResponse: undefined
      })
    }

    const body = {
      messages: messages,
      temperature: temperature
    };

    return this.http.post<ChatResponse>(this.credentialsService.getCredentials().apiUrl, body, { headers });
  }
}
