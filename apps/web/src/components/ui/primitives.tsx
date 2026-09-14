import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Botão ---------- */

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'border-brass bg-brass text-base hover:bg-brass/90',
        outline: 'border-line bg-transparent text-ink hover:border-brass hover:text-brass',
        ghost: 'border-transparent bg-transparent text-dim hover:text-ink',
        danger: 'border-denied/60 bg-denied/10 text-denied hover:bg-denied/20',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

/* ---------- Painel ---------- */

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn('rounded border border-line bg-panel', className)} {...props} />;
}

export function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-dim">{hint}</p> : null}
      </div>
      {action}
    </header>
  );
}

/* ---------- Campos ---------- */

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-dim">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-denied">{error}</span> : null}
    </label>
  );
}

const controlStyles =
  'h-10 w-full rounded border border-line bg-raised px-3 text-sm text-ink placeholder:text-dim/60 focus:border-brass';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlStyles, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlStyles, className)} {...props}>
      {children}
    </select>
  );
}

/* ---------- Indicadores ---------- */

const badgeStyles = cva('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-raised text-dim',
      brass: 'bg-brass-soft text-brass',
      granted: 'bg-granted-soft text-granted',
      denied: 'bg-denied-soft text-denied',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeStyles>) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />;
}

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-10 text-sm text-dim" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brass" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-dim">{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="m-5 rounded border border-denied/40 bg-denied-soft px-4 py-3 text-sm text-denied" role="alert">
      {message}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-base/80 p-4 pt-16">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded border border-line bg-panel shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            Fechar
          </Button>
        </header>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Paginação ---------- */

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <footer className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-dim">
      <span>
        {total} {total === 1 ? 'registro' : 'registros'}
      </span>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <span>
          {page} de {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </footer>
  );
}
