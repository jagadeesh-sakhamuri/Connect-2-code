import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // Keep the boundary side-effect free: production logging can be connected here
    // without exposing stack traces or user data in the UI.
    void error;
    void info;
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        className="min-h-screen bg-[#090A0C] text-white flex items-center justify-center px-6"
      >
        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181A20] p-8 text-center shadow-xl">
          <div
            aria-hidden="true"
            className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400"
          >
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            The page could not be rendered safely. Reload to restart the application.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#A3E635] px-5 text-sm font-bold text-black hover:bg-[#84CC16]"
          >
            Reload application
          </button>
          {import.meta.env.DEV && this.state.message ? (
            <p className="mt-4 break-words text-left text-xs text-gray-500" data-testid="error-boundary-message">
              {this.state.message}
            </p>
          ) : null}
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
