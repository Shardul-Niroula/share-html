import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, LogOut, UserCheck, Sparkles } from 'lucide-react';
import { UserAccount } from '../types/types';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignUp,
  onSignIn,
  onLogout,
  onShowToast,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onShowToast('Please enter your email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await onSignUp(name, email, password);
        onShowToast('Account created! You are now signed in.', 'success');
      } else {
        await onSignIn(email, password);
        onShowToast('Welcome back!', 'success');
      }
      onClose();
    } catch (err: any) {
      onShowToast(err?.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const guestEmail = `dev.${randomId}.${Date.now()}@sandbox.local`;
    const guestPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    setIsSubmitting(true);
    try {
      await onSignUp(`Dev User #${randomId}`, guestEmail, guestPassword);
      onShowToast(`Signed in as guest: Dev User #${randomId}`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast(err?.message || 'Could not create a guest session.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="auth-modal-overlay">
      <div className="modal-dialog auth-dialog" onClick={(e) => e.stopPropagation()} id="auth-modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              <User size={18} />
            </div>
            <div className="modal-title-text">{user ? 'User Profile' : 'Developer Account'}</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="close-auth-modal-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {user ? (
            <div className="user-profile-card" id="user-profile-active-view">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`}
                alt={user.name}
                className="profile-avatar-large"
              />
              <div className="profile-name">{user.name}</div>
              <div className="profile-email">{user.email}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Account active. You can save code projects and generate secure shareable preview bundles.
              </p>

              <button
                id="logout-btn"
                className="profile-logout-btn"
                onClick={() => {
                  onLogout();
                  onShowToast('Logged out of workspace', 'info');
                  onClose();
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                  onClick={() => setMode('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} id="auth-form">
                {mode === 'register' && (
                  <div className="auth-input-group">
                    <label htmlFor="auth-name-input">Display Name</label>
                    <input
                      id="auth-name-input"
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div className="auth-input-group">
                  <label htmlFor="auth-email-input">Email Address</label>
                  <input
                    id="auth-email-input"
                    className="auth-input"
                    type="email"
                    placeholder="alex@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="auth-password-input">Password</label>
                  <input
                    id="auth-password-input"
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button id="auth-submit-btn" type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                  <LogIn size={15} />
                  <span>{isSubmitting ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                </button>
              </form>

              <div className="guest-option-divider">
                <span>or quick access</span>
              </div>

              <button
                id="guest-login-quick-btn"
                className="guest-login-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleGuestLogin}
              >
                <Sparkles size={14} color="#38bdf8" />
                <span>Continue as Instant Demo User</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
