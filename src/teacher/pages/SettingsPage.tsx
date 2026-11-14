import { CalendarDays, CircleUserRound, Download, ImagePlus, Moon, Save, Settings, ShieldCheck, Sun, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { confirmAction } from '../../components/dialogs';
import { APP_VERSION, can } from '../../config/env';
import { type AccountAccessInfo, type PlatformSettings } from '../../types';

export function SettingsPage({ settings, authenticatedMode, accountAccess, onSave, counts, onExport, onReset, onInviteTeacher, onManageTeachers }: { settings: PlatformSettings; authenticatedMode: boolean; accountAccess?: AccountAccessInfo; onSave: (settings: PlatformSettings) => void; counts: { students: number; lessons: number; materials: number }; onExport: () => void; onReset: () => void; onInviteTeacher?: () => void; onManageTeachers?: () => void }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateInterface = <K extends 'compactMode' | 'theme'>(key: K, value: PlatformSettings[K]) => { update(key, value); onSave({ ...draft, [key]: value }); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const reset = async () => { if (await confirmAction({ title: 'Restaurar os dados de exemplo?', message: 'Seus dados atuais serão substituídos.', confirmLabel: 'Sim, restaurar', danger: true })) onReset(); };
  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarMessage('Selecione um arquivo de imagem.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarMessage('A imagem deve ter no máximo 5 MB.'); return; }
    try {
      update('avatar', await resizeAvatar(file));
      setAvatarMessage('Nova foto pronta. Salve as alterações para aplicar.');
    } catch {
      setAvatarMessage('Não foi possível processar esta imagem.');
    }
    event.target.value = '';
  };

  return <form className="settings-page" onSubmit={submit}>
    <section className="settings-hero"><div><p className="eyebrow">PERSONALIZAÇÃO</p><h2>Configure seu espaço de trabalho</h2><p>{authenticatedMode ? 'Seu perfil é sincronizado com o Supabase; preferências visuais permanecem neste navegador.' : 'As preferências do modo demonstração ficam salvas neste navegador.'}</p></div><button className="settings-save" type="submit"><Save size={17} />{saved ? 'Salvo!' : 'Salvar alterações'}</button></section>
    <div className="settings-grid">
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CircleUserRound size={21} /></div><div><h3>Perfil do professor</h3><p>Informações usadas na interface e relatórios.</p></div></div><div className="avatar-setting wide-setting"><div className="avatar-preview">{draft.avatar ? <img src={draft.avatar} alt="Pré-visualização do avatar" /> : <CircleUserRound size={40} />}</div><div><strong>Foto de perfil</strong><span>JPG, PNG ou WebP de até 5 MB.</span><div className="avatar-actions"><label><ImagePlus size={15} />Escolher imagem<input type="file" accept="image/*" onChange={selectAvatar} /></label>{draft.avatar && <button type="button" onClick={() => { update('avatar', ''); setAvatarMessage('Foto removida. Salve as alterações para aplicar.'); }}><Trash2 size={14} />Remover</button>}</div>{avatarMessage && <small>{avatarMessage}</small>}</div></div><div className="settings-fields"><label>Nome<input value={draft.teacherName} onChange={(event) => update('teacherName', event.target.value)} required /></label><label>E-mail<input type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} placeholder="professor@email.com" /></label><label>WhatsApp<input value={draft.whatsappPhone} onChange={(event) => update('whatsappPhone', event.target.value)} placeholder="+55 85 99999-9999" /></label><label className="wide-setting">Nome da escola ou marca<input value={draft.schoolName} onChange={(event) => update('schoolName', event.target.value)} /></label></div>{accountAccess && <div className={`account-access-card account-access-${accountAccess.status}`}><ShieldCheck size={19} /><div><span>Status da conta</span><strong>{accountAccess.label}</strong><p>{accountAccess.description}</p></div></div>}</section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CalendarDays size={21} /></div><div><h3>Padrões das aulas</h3><p>Valores preenchidos ao agendar uma nova aula.</p></div></div><div className="settings-fields"><label>Duração padrão<select value={draft.defaultDuration} onChange={(event) => update('defaultDuration', Number(event.target.value))}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label className="wide-setting">Link padrão da aula online<input type="url" value={draft.defaultOnlineUrl} onChange={(event) => update('defaultOnlineUrl', event.target.value)} placeholder="https://meet.google.com/..." /></label><ToggleSetting label="Confirmar cancelamentos" note="Evita cancelamentos acidentais na agenda." checked={draft.confirmCancellations} onChange={(value) => update('confirmCancellations', value)} /></div></section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><Settings size={21} /></div><div><h3>Interface</h3><p>Ajuste o tema e a densidade visual da plataforma.</p></div></div><div className="settings-fields"><div className="theme-setting wide-setting"><strong>Tema</strong><span>A mudança é aplicada imediatamente.</span><div><button type="button" className={draft.theme === 'light' ? 'active' : ''} onClick={() => updateInterface('theme', 'light')}><Sun size={16} />Claro</button><button type="button" className={draft.theme === 'dark' ? 'active' : ''} onClick={() => updateInterface('theme', 'dark')}><Moon size={16} />Escuro</button></div></div><ToggleSetting label="Modo compacto" note="Reduz espaçamentos para mostrar mais conteúdo." checked={draft.compactMode} onChange={(value) => updateInterface('compactMode', value)} /></div></section>
      {onInviteTeacher && onManageTeachers && <section className="panel settings-card administration-card"><div className="settings-card-heading"><div className="settings-card-icon"><UserPlus size={21} /></div><div><h3>Administração</h3><p>Gerencie acessos e permissões da plataforma.</p></div></div><div className="settings-fields"><div className="admin-actions"><button type="button" className="primary-button" onClick={onInviteTeacher}><UserPlus size={16} />Convidar professor</button><button type="button" className="secondary-button" onClick={onManageTeachers}><UsersRound size={16} />Gerenciar professores</button></div><small className="admin-description">Convide professores, consulte contas cadastradas e controle o acesso à plataforma.</small></div></section>}
      <section className="panel settings-card data-settings"><div className="settings-card-heading"><div className="settings-card-icon"><ShieldCheck size={21} /></div><div><h3>Dados e segurança</h3><p>{authenticatedMode ? 'Alunos, aulas e recursos são sincronizados com o Supabase.' : 'Os dados do modo demonstração ficam somente neste navegador.'}</p></div></div><div className="data-summary"><span><strong>{counts.students}</strong> alunos</span><span><strong>{counts.lessons}</strong> aulas</span><span><strong>{counts.materials}</strong> materiais</span></div><div className="data-actions"><button type="button" className="export-button" onClick={onExport}><Download size={16} />Exportar backup</button>{can.resetData() && <button type="button" className="danger-button" onClick={reset}><Trash2 size={16} />Restaurar exemplos</button>}</div><small className="app-version">LangSpot {APP_VERSION}</small></section>
    </div>
  </form>;
}

function ToggleSetting({ label, note, checked, onChange }: { label: string; note: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-setting wide-setting"><div><strong>{label}</strong><span>{note}</span></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(url); reject(); return; }
      context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 320, 320);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(); };
    image.src = url;
  });
}
