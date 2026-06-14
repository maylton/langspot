import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, X } from 'lucide-react';

interface InviteAcceptanceProps {
  token: string;
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Page for accepting teacher invitations
 * 
 * Flow:
 * 1. User receives email with link: /accept-invite?token=xxx&email=xxx@example.com
 * 2. This component extracts params and shows registration form
 * 3. User sets password and submits
 * 4. Frontend calls accept-teacher-invite Edge Function
 * 5. New teacher account is created
 * 6. User is redirected to login
 */
export function InviteAcceptance({
  token,
  email,
  onSuccess,
  onError,
}: InviteAcceptanceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

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
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não correspondem');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Call accept-teacher-invite function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-teacher-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            token,
            email,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      const message = (err as Error).message || 'Erro ao processar convite';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="invite-acceptance-success">
        <div className="success-content">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Bem-vindo ao LangSpot!</h2>
          <p>Sua conta foi criada com sucesso.</p>
          <p className="success-hint">
            Você será redirecionado para o login em alguns segundos...
          </p>
          <div className="countdown">
            <LoaderCircle className="spin" size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-acceptance">
      <div className="invite-card">
        <div className="invite-header">
          <h2>Aceitar Convite</h2>
          <p>Finalize sua conta de professor no LangSpot</p>
        </div>

        {error && (
          <div className="invite-error">
            <X size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              disabled
              className="input-disabled"
            />
            <small>Este é o email do seu convite</small>
          </div>

          <div className="form-section">
            <label>Senha *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
            <small>Use uma senha segura e única</small>
          </div>

          <div className="form-section">
            <label>Confirmar Senha *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repita a senha"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? (
              <>
                <LoaderCircle className="spin" size={16} />
                Criando conta...
              </>
            ) : (
              <>
                Criar Conta
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="invite-footer">
          <p>Já tem uma conta? <a href="/login">Entre aqui</a></p>
        </div>
      </div>

      <style>{`
        .invite-acceptance {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .invite-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 2rem;
          max-width: 400px;
          width: 100%;
        }

        .invite-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .invite-header h2 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .invite-header p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
        }

        .invite-error {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          color: #c33;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-section label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .form-section input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-section input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .form-section small {
          color: #999;
          font-size: 0.85rem;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .invite-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }

        .invite-footer p {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .invite-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .invite-footer a:hover {
          text-decoration: underline;
        }

        .invite-acceptance-success {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .success-content {
          background: white;
          border-radius: 12px;
          padding: 3rem 2rem;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: #e8f5e9;
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          color: #4caf50;
        }

        .success-content h2 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.5rem;
        }

        .success-content p {
          color: #666;
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }

        .success-hint {
          color: #999;
          font-size: 0.85rem !important;
          margin-top: 1rem !important;
        }

        .countdown {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
          color: #667eea;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default InviteAcceptance;
