import { FormEvent, useState, useEffect } from 'react';
import { Copy, Check, LoaderCircle, X } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * Admin panel modal for creating teacher invitations
 * Only accessible to existing teachers (admins)
 * 
 * Features:
 * - Generate invitation links with email
 * - Copy link to clipboard
 * - View pending invitations
 * - Delete expired invitations
 */
type DemoInvitation = { id: string; email: string; full_name: string; token: string; expires_at: string; used: boolean };

export function InviteTeacherModal({ onClose, demoMode = false }: { onClose: () => void; demoMode?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
  });

  // Load existing invitations on mount
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (demoMode) {
      const stored = localStorage.getItem('linguaboard.demoTeacherInvitations');
      setInvitations(stored ? JSON.parse(stored) : []);
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('teacher_invitations')
        .select('*')
        .eq('used', false)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setInvitations(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (demoMode) {
        const invitation: DemoInvitation = {
          id: crypto.randomUUID(),
          email: formData.email,
          full_name: formData.full_name,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          used: false,
        };
        const next = [invitation, ...invitations];
        setInvitations(next);
        localStorage.setItem('linguaboard.demoTeacherInvitations', JSON.stringify(next));
        setSuccess('Convite de demonstração criado! Link válido por 24 horas.');
        setFormData({ email: '', full_name: '' });
        return;
      }

      if (!supabase) throw new Error('Supabase não configurado');

      // Call invite-teacher function
      const { data, error: err } = await supabase.functions.invoke('invite-teacher', {
        body: {
          email: formData.email,
          full_name: formData.full_name,
        },
      });

      if (err) {
        throw new Error((err as any).message || 'Erro ao gerar convite');
      }

      setSuccess(`Convite criado! Link válido por 24 horas.`);
      setFormData({ email: '', full_name: '' });
      await loadInvitations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      setError('Erro ao copiar');
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm('Tem certeza? Este convite não poderá mais ser usado.')) return;
    if (demoMode) {
      const next = invitations.filter((invitation) => invitation.id !== id);
      setInvitations(next);
      localStorage.setItem('linguaboard.demoTeacherInvitations', JSON.stringify(next));
      return;
    }
    if (!supabase) return;

    try {
      const { error: err } = await supabase
        .from('teacher_invitations')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await loadInvitations();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal invite-teacher-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div><h2>Convidar Professor</h2>{demoMode && <small>Modo demonstração — nenhum e-mail real será enviado.</small>}</div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {/* Form to create new invitation */}
          <div className="form-section">
            <h3>Gerar Novo Convite</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Nome Completo *
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Prof. Maria Silva"
                  required
                />
              </label>
              <label>
                E-mail *
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="professor@email.com"
                  required
                />
              </label>

              {error && (
                <div className="auth-message error full-field">
                  <X size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-message success full-field">
                  <Check size={16} />
                  {success}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setFormData({ email: '', full_name: '' })}
                  disabled={submitting}
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="spin" size={16} />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Convite'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* List of pending invitations */}
          <div className="invitations-section">
            <h3>Convites Pendentes</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoaderCircle className="spin" size={24} />
              </div>
            ) : invitations.length === 0 ? (
              <p className="empty-state">Nenhum convite pendente</p>
            ) : (
              <div className="invitations-list">
                {invitations.map((inv) => {
                  const expiresAt = new Date(inv.expires_at);
                  const isExpired = expiresAt < new Date();
                  const invitationLink = `${window.location.origin}/accept-invite?token=${inv.token}&email=${encodeURIComponent(inv.email)}`;

                  return (
                    <div
                      key={inv.id}
                      className={`invitation-item ${isExpired ? 'expired' : ''}`}
                    >
                      <div className="invitation-info">
                        <div className="invitation-name">{inv.full_name}</div>
                        <div className="invitation-email">{inv.email}</div>
                        <div className="invitation-expires">
                          Expira:{' '}
                          {expiresAt.toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="invitation-actions">
                        <button
                          type="button"
                          className="copy-button"
                          onClick={() => copyToClipboard(invitationLink, inv.id)}
                          title="Copiar link"
                        >
                          {copied === inv.id ? (
                            <>
                              <Check size={14} />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copiar Link
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteInvitation(inv.id)}
                          title="Deletar convite"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <style>{`
          .invite-teacher-modal {
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-content {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .form-section {
            border-bottom: 1px solid #eee;
            padding-bottom: 1.5rem;
          }

          .form-section h3 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #333;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-grid label {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            font-weight: 500;
            color: #333;
            font-size: 0.9rem;
          }

          .form-grid input {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
          }

          .form-grid input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .auth-message {
            padding: 1rem;
            border-radius: 6px;
            display: flex;
            gap: 0.5rem;
            align-items: center;
            font-size: 0.9rem;
          }

          .auth-message.error {
            background: #fee;
            border: 1px solid #fcc;
            color: #c33;
          }

          .auth-message.success {
            background: #efe;
            border: 1px solid #cfc;
            color: #393;
          }

          .form-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
          }

          .form-actions button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }

          .cancel-button {
            background: #f0f0f0;
            color: #333;
          }

          .cancel-button:hover {
            background: #e0e0e0;
          }

          .primary-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .primary-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
          }

          .primary-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .invitations-section {
            border-top: 1px solid #eee;
            padding-top: 1.5rem;
          }

          .invitations-section h3 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #333;
          }

          .empty-state {
            text-align: center;
            color: #999;
            padding: 1rem;
            font-size: 0.9rem;
          }

          .invitations-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .invitation-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .invitation-item:hover:not(.expired) {
            border-color: #667eea;
            background: #f5f7ff;
          }

          .invitation-item.expired {
            opacity: 0.6;
            background: #fafafa;
          }

          .invitation-info {
            flex: 1;
            min-width: 0;
          }

          .invitation-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.25rem;
          }

          .invitation-email {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
            word-break: break-all;
          }

          .invitation-expires {
            font-size: 0.8rem;
            color: #999;
          }

          .invitation-item.expired .invitation-expires {
            color: #c33;
            font-weight: 500;
          }

          .invitation-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }

          .copy-button,
          .delete-button {
            padding: 0.5rem;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.8rem;
            transition: all 0.2s;
          }

          .copy-button:hover {
            border-color: #667eea;
            background: #f5f7ff;
            color: #667eea;
          }

          .delete-button:hover {
            border-color: #ff5252;
            background: #ffebee;
            color: #ff5252;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </section>
    </div>
  );
}

export default InviteTeacherModal;
