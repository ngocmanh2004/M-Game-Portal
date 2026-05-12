import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// ⭐ ErrorBoundary: bắt crash React → hiện lỗi thay vì màn hình trắng
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a0a0a', color: 'white', padding: '24px', gap: '12px' }}>
          <div style={{ fontSize: '40px' }}>⚠️</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Có lỗi xảy ra</div>
          <div style={{ color: '#ff8080', fontSize: '13px', textAlign: 'center', maxWidth: '360px', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '10px 24px', background: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// Service worker bị tắt vì gây xung đột với Firebase redirect auth trên mobile
// (cached JS cũ được serve sau login, gây màn hình trắng)
serviceWorkerRegistration.unregister();


reportWebVitals();
