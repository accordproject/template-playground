const DEFAULT_PROXY_BASE = '/.netlify/functions';

export function isServerAIProxyEnabled(): boolean {
  return true;
}

export function getAIProxyEndpoint(name: 'chat' | 'models'): string {
  const configuredBase = String(import.meta.env.VITE_AI_PROXY_BASE_URL || DEFAULT_PROXY_BASE);
  const base = configuredBase.replace(/\/$/, '');
  return `${base}/ai-${name}`;
}
