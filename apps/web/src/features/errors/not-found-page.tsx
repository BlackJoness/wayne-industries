import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/primitives';

export function NotFoundPage() {
  return (
    <Panel className="p-8">
      <p className="font-mono text-xs tracking-widest text-brass">404</p>
      <h1 className="mt-2 text-lg font-semibold">Este corredor não existe na torre</h1>
      <p className="mt-2 max-w-prose text-sm text-dim">
        O endereço digitado não corresponde a nenhuma tela do sistema. Sua sessão continua ativa.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center rounded border border-line px-4 text-sm font-medium text-ink hover:border-brass hover:text-brass"
      >
        Voltar para a visão geral
      </Link>
    </Panel>
  );
}
