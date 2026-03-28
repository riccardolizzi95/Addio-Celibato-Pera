'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('App error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <span className="text-6xl mb-4">😵</span>
          <h1 className="text-2xl font-black mb-2">Qualcosa è andato storto</h1>
          <p className="text-slate-500 mb-6">La sessione potrebbe essere scaduta.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.assign('/login');
            }}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Torna al Login
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}