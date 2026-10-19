import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, Home } from 'lucide-react';

export default function AdminUnauthorized() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem',
          borderRadius: '20px',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.05))',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            marginBottom: '1.5rem',
          }}
        >
          <ShieldAlert size={40} />
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            color: 'var(--text-main, #0f172a)',
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            color: 'var(--text-muted, #64748b)',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '2rem',
          }}
        >
          Regular users cannot access the <strong>Administrator Portal</strong>.
          Only the single designated administrator account is authorized to view and manage this area.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '10px',
            }}
          >
            <KeyRound size={18} />
            Sign In with Admin Credentials
          </Link>

          <Link
            to="/"
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '10px',
            }}
          >
            <Home size={18} />
            Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
