export interface ChatResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
  }>
  usage: {
    "completion_tokens": number,
    "prompt_tokens": number,
    "total_tokens": number
  } | undefined;
}
