import { ArrowRight, BookOpen, CalendarDays, GraduationCap, LoaderCircle, LockKeyhole, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { can } from '../config/env';
import { isSupabaseConfigured, supabase } from '../supabase';
import { PasswordField } from './PasswordField';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthPage({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/?password-recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setMessage(error
        ? 'Não foi possível enviar o e-mail agora. Aguarde um momento e tente novamente.'
        : 'Se houver uma conta associada a esse e-mail, enviaremos um link para redefinir a senha.');
      setBusy(false);
      return;
    }

    const password = String(form.get('password') ?? '');
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(form.get('name')), role: 'teacher' } } });
      setMessage(error ? error.message : 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setBusy(false);
  };

  const eyebrow = mode === 'login' ? 'BEM-VINDO DE VOLTA' : mode === 'register' ? 'COMECE AGORA' : 'RECUPERAR ACESSO';
  const title = mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? 'Crie sua conta de professor' : 'Esqueceu sua senha?';
  const description = mode === 'login' ? 'Acesse seu espaço de trabalho.' : mode === 'register' ? 'Depois, você poderá convidar seus alunos.' : 'Informe seu e-mail para receber um link de redefinição.';

  return <main className="auth-page"><section className="auth-intro"><div className="auth-brand"><GraduationCap size={28} /><strong>LangSpot</strong></div><div><span>TEACHER WORKSPACE</span><h1>Ensine melhor.<br />Acompanhe de perto.</h1><p>Alunos, aulas, materiais e progresso organizados em um único espaço.</p></div><ul><li><CalendarDays size={18} />Agenda e aulas online</li><li><BookOpen size={18} />Biblioteca de materiais</li><li><GraduationCap size={18} />Portal individual do aluno</li></ul></section><section className="auth-form-wrap"><div className="auth-form-card"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p>{isSupabaseConfigured ? <form onSubmit={submit}>{mode === 'register' && <label>Nome completo<input name="name" required /></label>}<label>E-mail<input name="email" type="email" autoComplete="email" required autoFocus /></label>{mode !== 'forgot' && <PasswordField label="Senha" name="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />}{mode === 'login' && <button type="button" className="forgot-password-link" onClick={() => changeMode('forgot')}>Esqueci minha senha</button>}{message && <div className="auth-message">{message}</div>}<button disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'login' ? <LockKeyhole size={17} /> : mode === 'register' ? <UserPlus size={17} /> : <ArrowRight size={17} />}{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link'}{!busy && mode !== 'forgot' && <ArrowRight size={16} />}</button></form> : <div className="auth-message">Configure as variáveis do Supabase para habilitar login e cadastro.</div>}{mode === 'forgot' ? <button className="auth-switch" onClick={() => changeMode('login')}>Voltar para o login</button> : <button className="auth-switch" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</button>}{can.useDemoMode() && mode !== 'forgot' && <button className="demo-button" onClick={onDemo}>Continuar no modo demonstração</button>}</div></section></main>;
}
