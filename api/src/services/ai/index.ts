import { ClaudeDriver } from './claude.js';
import { OllamaDriver } from './ollama.js';
import type { AiDriver } from './types.js';

export type { AiDriver, AiMessage, Classification } from './types.js';

let _driver: AiDriver | null = null;

export function getAiDriver(): AiDriver {
  if (!_driver) {
    const chosen = process.env.AI_DRIVER ?? 'claude';
    _driver = chosen === 'ollama' ? new OllamaDriver() : new ClaudeDriver();
  }
  return _driver;
}
