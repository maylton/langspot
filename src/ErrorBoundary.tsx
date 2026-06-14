import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LangSpot runtime error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="fatal-error" role="alert">
        <div className="fatal-error-card">
          <span><AlertTriangle size={28} /></span>
          <p className="eyebrow">ERRO INESPERADO</p>
          <h1>Não foi possível carregar esta tela</h1>
          <p>Seus dados continuam no Supabase. Recarregue o aplicativo para tentar novamente.</p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            <RotateCcw size={17} /> Recarregar aplicativo
          </button>
        </div>
      </main>
    );
  }
}
