import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean; diagnostic: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, diagnostic: '' };

  static getDerivedStateFromError(): State {
    return { failed: true, diagnostic: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // RELIABILITY: Detail teknis tetap di konsol lokal; pengguna menerima
    // pemulihan yang aman tanpa layar putih atau kebocoran informasi internal.
    console.error('Admin UI gagal dirender', error, info.componentStack);
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.setState({ diagnostic: `${error.name}: ${error.message}`.slice(0, 240) });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 text-center text-slate-950 dark:bg-slate-950 dark:text-white">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900/70 dark:bg-slate-900">
          <h1 className="text-2xl font-black">Web Admin belum dapat ditampilkan</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Muat ulang halaman untuk mengambil versi aplikasi terbaru. Pekerjaan yang sudah tersimpan tidak berubah.
          </p>
          {this.state.diagnostic && (
            <p className="mt-3 rounded-xl bg-slate-100 p-3 text-left text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Diagnosis lokal: {this.state.diagnostic}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            Muat ulang Web Admin
          </button>
        </section>
      </main>
    );
  }
}
