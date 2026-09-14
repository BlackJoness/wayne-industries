import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useAuth } from '@/contexts/auth-context';
import { Button, Field, Input } from '@/components/ui/primitives';

const DEMO_ACCOUNTS = [
  { email: 'bruce@wayne.com', role: 'Administrador de Segurança' },
  { email: 'lucius@wayne.com', role: 'Gerente' },
  { email: 'alfred@wayne.com', role: 'Funcionário' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('bruce@wayne.com');
  const [password, setPassword] = useState('Wayne@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between border-r border-line bg-panel p-12 lg:flex">
        <p className="font-mono text-sm tracking-[0.4em] text-brass">W A Y N E</p>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Controle de acesso e recursos das Indústrias Wayne
          </h1>
          <p className="mt-4 text-dim">
            Cada porta desta torre responde a uma pergunta antes de abrir: quem é você, e este andar é seu?
          </p>
        </div>

        <p className="text-sm text-dim">Gotham City · Wayne Tower · Nível de segurança 3</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Entrar no sistema</h2>
          <p className="mt-1 text-sm text-dim">Use suas credenciais corporativas.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </Field>

            <Field label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? (
              <p className="rounded border border-denied/40 bg-denied-soft px-3 py-2 text-sm text-denied" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Verificando credenciais' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 rounded border border-line bg-panel p-4">
            <p className="text-sm font-medium">Contas de demonstração</p>
            <p className="mt-1 text-xs text-dim">Senha para todas: Wayne@123</p>
            <ul className="mt-3 space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword('Wayne@123');
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm text-dim hover:bg-raised hover:text-ink"
                  >
                    <span className="font-mono text-xs">{account.email}</span>
                    <span className="text-xs">{account.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
