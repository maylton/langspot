import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { supabase } from '../supabase';
import { PasswordField } from './PasswordField';

export function UpdatePassword({ onComplete }: { onComplete: () => void | Promise<void> }) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    if (password.length < 8) {
      setMessage('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setMessage('As senhas não coincidem.');
      return;
    }

    setBusy(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage('Este link é inválido ou expirou. Solicite uma nova redefinição de senha.');
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
    setMessage('Senha atualizada com sucesso. Agora você já pode entrar com a nova senha.');
  };

  return <main className="first-access-page"><section className="first-access-card"><div className="first-access-icon"><LockKeyhole size={27} /></div><p className="eyebrow">REDEFINIÇÃO DE SENHA</p><h1>Crie uma nova senha</h1><p>{success ? 'Sua senha foi alterada com segurança.' : 'Digite e confirme uma nova senha para continuar usando o LangSpot.'}</p>{success ? <><div className="auth-message auth-message-success">{message}</div><button className="student-primary" onClick={() => void onComplete()}><ArrowRight size={16} />Voltar para o login</button></> : <form onSubmit={submit}><PasswordField label="Nova senha" name="password" minLength={8} autoComplete="new-password" required autoFocus /><PasswordField label="Confirmar nova senha" name="confirmation" minLength={8} autoComplete="new-password" required />{message && <div className="auth-message">{message}</div>}<button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}{busy ? 'Atualizando...' : 'Salvar nova senha'}</button></form>}</section></main>;
}
