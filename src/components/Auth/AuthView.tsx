import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wallet, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

type AuthTab = 'login' | 'signup' | 'forgot';

export const AuthView: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const changeTab = (t: AuthTab) => {
    resetForm();
    setTab(t);
  };

  const translateError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('User already registered')) return 'Este e-mail já possui uma conta.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
    if (msg.includes('Unable to validate email address')) return 'Endereço de e-mail inválido.';
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError(translateError(error.message));
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      setError(translateError(error.message));
    } else {
      setSuccess('Conta criada! Verifique seu e-mail para confirmar o acesso.');
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) {
      setError(translateError(error.message));
    } else {
      setSuccess('Link de recuperação enviado para seu e-mail!');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background:
          'radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.08) 0px, transparent 50%)',
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
            marginBottom: '12px',
          }}
        >
          <Wallet size={28} color="white" />
        </div>
        <h1
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #e2e8f0, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}
        >
          FINTHIGAS
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Gestão Financeira & Controle de Gastos
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Bar — Login / Cadastro */}
        {tab !== 'forgot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => changeTab(t)}
                style={{
                  padding: '14px',
                  border: 'none',
                  background: tab === t ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                  color: tab === t ? '#c4b5fd' : 'var(--text-muted)',
                  fontWeight: tab === t ? 700 : 400,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Forgot Password header */}
          {tab === 'forgot' && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => changeTab('login')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, fontSize: '0.82rem', marginBottom: '12px' }}
              >
                <ArrowLeft size={14} /> Voltar ao login
              </button>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Recuperar Senha</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Enviaremos um link para redefinir sua senha.
              </p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#f43f5e',
              }}
            >
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                <button type="button" onClick={() => changeTab('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                  Esqueci minha senha
                </button>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
                {loading ? <Loader2 size={17} className="spin" /> : 'Entrar na Conta'}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirmar Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
                {loading ? <Loader2 size={17} className="spin" /> : 'Criar Minha Conta'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && !success && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>E-mail da Conta</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
                {loading ? <Loader2 size={17} className="spin" /> : 'Enviar Link de Recuperação'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '20px', textAlign: 'center' }}>
        Seus dados são protegidos com criptografia end-to-end via Supabase.
      </p>
    </div>
  );
};
