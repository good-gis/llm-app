import {Component, effect, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChatService} from '../../services/chat.service';
import {catchError, of} from 'rxjs';
import {Model} from '../../enums/model';
import {CredentialsService} from '../../services/credentials.service';
import {ChatMessage} from '../../interfaces/chat-message.interface';

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
  private credentialsService = inject(CredentialsService);

  messages = signal<ChatMessage[]>([]);
  userInput = '';
  isLoading = signal(false);
  mode = signal<null | 'book' | 'json'>(null);
  error = signal<string | null>(null);
  temperature = signal<number>(0.7);
  model = signal<Model>(Model.Gemini_2_0_Flash);

  constructor() {
    effect(() => {
      const currentModel = this.model();
      this.credentialsService.setCredentials(currentModel);
    });
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: this.userInput.trim(), usage: undefined, timeOfResponse: undefined };
    this.messages.update(msgs => [...msgs, userMessage]);
    this.userInput = '';
    this.isLoading.set(true);
    this.error.set(null);

    const timestampStart = Date.now();
    this.chatService.sendMessage(this.messages(), this.mode(), this.temperature())
      .pipe(
        catchError(err => {
          console.error('API Error:', err);
          this.error.set('Ошибка при обращении к модели. Проверьте API-ключ.');
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Извините, не могу ответить.' } }], usage: undefined });
        })
      )
      .subscribe(response => {
        const aiContent = response.choices[0].message.content;
        const timestamp = Date.now() - timestampStart;
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: aiContent, usage: response.usage, timeOfResponse: timestamp }]);
        this.isLoading.set(false);
      });
  }

  sendSystemPromptMessage() {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = { role: 'system', content: this.userInput.trim(), usage: undefined, timeOfResponse: undefined };
    this.messages.update(msgs => [...msgs, userMessage]);
    this.userInput = '';
    this.isLoading.set(false);
    this.error.set(null);

    alert(JSON.stringify(this.messages().filter(msg => msg.role === 'system')));
  }

  sendBookFirstMessage() {
    this.clearChat();
    this.messages.set([{ role: 'user', content: 'Хочу подобрать книгу. Задавай мне вопросы и порекомендуй книгу', usage: undefined, timeOfResponse: undefined }]);

    const timestampStart = Date.now();
    this.chatService.sendMessage(this.messages(), this.mode(), this.temperature())
      .pipe(
        catchError(err => {
          console.error('API Error:', err);
          this.error.set('Ошибка при обращении к модели. Проверьте API-ключ.');
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Извините, не могу ответить.' } }], usage: undefined });
        })
      )
      .subscribe(response => {
        const aiContent = response.choices[0].message.content;
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: aiContent,
          usage: response.usage,
          timeOfResponse: Date.now() - timestampStart,
        };
        this.messages.update(msgs => [...msgs, assistantMessage]);

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

  protected readonly Model = Model;
  protected readonly JSON = JSON;
}
