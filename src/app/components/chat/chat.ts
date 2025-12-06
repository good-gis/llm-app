import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChatMessage, ChatService} from '../../services/chat.service';
import {catchError, of} from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  private chatService = inject(ChatService);

  messages = signal<ChatMessage[]>([]);
  userInput = '';
  isLoading = signal(false);
  mode = signal<null | 'book' | 'json'>(null);
  error = signal<string | null>(null);

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: this.userInput.trim() };
    this.messages.update(msgs => [...msgs, userMessage]);
    this.userInput = '';
    this.isLoading.set(true);
    this.error.set(null);

    this.chatService.sendMessage(this.messages(), this.mode())
      .pipe(
        catchError(err => {
          console.error('API Error:', err);
          this.error.set('Ошибка при обращении к модели. Проверьте API-ключ.');
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Извините, не могу ответить.' } }] });
        })
      )
      .subscribe(response => {
        const aiContent = response.choices[0].message.content;
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: aiContent }]);
        this.isLoading.set(false);
      });
  }

  sendSystemPromptMessage() {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = { role: 'system', content: this.userInput.trim() };
    this.messages.update(msgs => [...msgs, userMessage]);
    this.userInput = '';
    this.isLoading.set(false);
    this.error.set(null);

    alert(JSON.stringify(this.messages().filter(msg => msg.role === 'system')));
  }

  sendBookFirstMessage() {
    this.clearChat();
    this.messages.set([{ role: 'user', content: 'Хочу подобрать книгу. Задавай мне вопросы и порекомендуй книгу' }])


    this.chatService.sendMessage(this.messages(), this.mode())
      .pipe(
        catchError(err => {
          console.error('API Error:', err);
          this.error.set('Ошибка при обращении к модели. Проверьте API-ключ.');
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Извините, не могу ответить.' } }] });
        })
      )
      .subscribe(response => {
        const aiContent = response.choices[0].message.content;
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: aiContent }]);
        this.isLoading.set(false);
      });
  }

  clearChat() {
    this.messages.set([]);
    this.error.set(null);
  }

  formatJson(text: string): string | null {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return null;
    }
  }
}
