const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1';
const TOKEN_KEY = 'wayne.token';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/** Envelope único de chamadas HTTP. Anexa o token e normaliza o erro da API. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const token = tokenStorage.get();

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // Sessão expirada: limpa o token e devolve o usuário ao login.
    if (response.status === 401 && tokenStorage.get()) {
      tokenStorage.clear();
    }
    throw new ApiError(
      payload?.message ?? 'Não foi possível concluir a operação.',
      response.status,
      payload?.code ?? 'UNKNOWN',
      payload?.details,
    );
  }

  return payload as T;
}
