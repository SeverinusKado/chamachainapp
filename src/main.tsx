import './index.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Component, ReactNode } from 'react';

import App from './App';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state = { error: null };
    static getDerivedStateFromError(error: Error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 24, fontFamily: 'monospace', color: 'red', background: '#111', minHeight: '100vh' }}>
                    <h2>Runtime Error</h2>
                    <pre>{(this.state.error as Error).message}</pre>
                    <pre>{(this.state.error as Error).stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
    <ErrorBoundary>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ErrorBoundary>,
);
