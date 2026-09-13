import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, LogOut, UserCheck, Sparkles } from 'lucide-react';
import { UserAccount } from '../types/types';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onLogin: (name: string, email: string) => UserAccount;
  onLogout: () => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  onShowToast,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onShowToast('Please enter an email address', 'error');
      return;
    }
    const loggedUser = onLogin(name || 'Developer', email);
    onShowToast(`Welcome back, ${loggedUser.name}!`, 'success');
    onClose();
  };

  const handleGuestLogin = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const guestUser = onLogin(`Dev User #${randomId}`, `dev.${randomId}@sandbox.local`);
    onShowToast(`Signed in as guest: ${guestUser.name}`, 'success');
    onClose();
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
              <form className="auth-form" onSubmit={handleSubmit} id="auth-form">
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

                <button id="auth-submit-btn" type="submit" className="auth-submit-btn">
                  <LogIn size={15} />
                  <span>Sign In & Enable Code Sharing</span>
                </button>
              </form>

              <div className="guest-option-divider">
                <span>or quick access</span>
              </div>

              <button
                id="guest-login-quick-btn"
                className="guest-login-btn"
                type="button"
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
