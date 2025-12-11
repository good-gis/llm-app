import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, finalize } from 'rxjs';
import { Model } from '../../enums/model';
import { ChatService } from '../../services/chat.service';
import { CredentialsService } from '../../services/credentials.service';
import { ChatMessage } from '../../interfaces/chat-message.interface';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
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
      this.credentialsService.setCredentials(this.model());
    });
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;
    const content = this.userInput.trim();
    this.userInput = '';
    this.addMessage({ role: 'user', content });
    this.sendToModel();
  }

  sendSystemPromptMessage(): void {
    if (!this.userInput.trim()) return;
    const content = this.userInput.trim();
    this.userInput = '';
    this.addMessage({ role: 'system', content });
    console.log('System messages:', this.messages().filter(m => m.role === 'system'));
  }

  sendBookFirstMessage(): void {
    this.clearChat();
    this.addMessage({ role: 'user', content: 'Хочу подобрать книгу. Задавай мне вопросы и порекомендуй книгу' });
    this.sendToModel();
  }

  clearChat(): void {
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

  private addMessage(message: Omit<ChatMessage, 'usage' | 'timeOfResponse'>): void {
    const fullMessage: ChatMessage = { ...message, usage: undefined, timeOfResponse: undefined };
    this.messages.update(msgs => [...msgs, fullMessage]);
  }

  private sendToModel(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const timestampStart = Date.now();

    this.chatService.sendMessage(this.messages(), this.mode(), this.temperature())
      .pipe(
        catchError(err => {
          console.error('API Error:', err);
          let message = 'Ошибка при обращении к модели.';

          if (err?.error?.message?.includes('context length') || err?.error?.message?.includes('Input too long')) {
            message = 'Слишком длинный диалог! Превышен лимит модели (128K токенов). Очистите чат.';
          } else if (err?.status === 401) {
            message = 'Неверный API-ключ или доступ запрещён.';
          }

          this.error.set(message);
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Извините, не могу обработать запрос.' } }], usage: undefined });
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        const aiContent = response.choices[0].message.content;
        const timeOfResponse = Date.now() - timestampStart;
        this.addMessage({
          role: 'assistant',
          content: aiContent,
        });
        // Обновляем последнее сообщение с метаданными
        this.messages.update(msgs => {
          const last = msgs[msgs.length - 1];
          return [
            ...msgs.slice(0, -1),
            { ...last, usage: response.usage, timeOfResponse }
          ];
        });
      });
  }

  summarizeChat(): void {
    if (this.messages().length === 0) return;

    this.isLoading.set(true);
    this.error.set(null);

    const dialogue = this.messages()
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `Кратко резюмируй следующий диалог между Пользователем и Ассистентом.
Сосредоточься на ключевых темах, решениях и выводах. Не добавляй ничего от себя.
Резюме должно быть на русском языке и занимать не более 6 предложений."

Диалог:
${dialogue}`;
    this.chatService.sendMessage(
      [{ role: 'user', content: summaryPrompt, usage: undefined, timeOfResponse: undefined }],
      null,
      0
    )
      .pipe(
        catchError(err => {
          console.error('Ошибка при создании резюме:', err);
          this.error.set('Не удалось создать резюме диалога.');
          this.isLoading.set(false);
          return of({ choices: [{ message: { role: 'assistant', content: 'Резюме недоступно.' } }], usage: undefined });
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        const summary = response.choices[0].message.content;

        this.messages.set([{
          role: 'system',
          content: `[РЕЗЮМЕ ПРЕДЫДУЩЕГО ДИАЛОГА]: ${summary}`,
          usage: undefined,
          timeOfResponse: undefined
        }]);

        console.log('Диалог сжат до резюме:', summary);
      });
  }

  // Для шаблона
  protected readonly Model = Model;
  protected readonly JSON = JSON;
}
