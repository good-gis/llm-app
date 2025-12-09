export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  usage: {
    "completion_tokens": number,
    "prompt_tokens": number,
    "total_tokens": number
  } | undefined;
  timeOfResponse: number | undefined;
}
