import { useState, useEffect } from 'react';

interface Props {
  onLogin: (token: string) => void;
  onClose: () => void;
}

export const LoginModal = ({ onLogin, onClose }: Props) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    const savedPassword = localStorage.getItem('rememberPassword');
    if (savedEmail) { setEmail(savedEmail); setRememberEmail(true); }
    if (savedPassword) { setPassword(savedPassword); setRememberPassword(true); }
  }, []);

  const handleSendCode = async () => {
    if (!email) { setError('请输入邮箱'); return; }
    setLoading(true);
    try {
      const { default: axios } = await import('axios');
      await axios.post('http://localhost:3000/auth/send-code', { email });
      setCountdown(60);
      const timer = setInterval(() => setCountdown(c => { if (c <= 1) clearInterval(timer); return c - 1; }), 1000);
    } catch { setError('发送失败，请稍后重试'); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { authApi, setToken } = await import('../utils/api');
      
      if (mode === 'forgot') {
        await authApi.resetPassword(email, code, newPassword);
        alert('密码重置成功，请登录');
        setMode('login');
        setLoading(false);
        return;
      }

      const isLogin = mode === 'login';
      const res = await (isLogin ? authApi.login(email, password) : authApi.register(email, password, name));
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.data?.access_token) {
        if (rememberEmail) localStorage.setItem('rememberEmail', email);
        else { localStorage.removeItem('rememberEmail'); }
        if (rememberPassword) localStorage.setItem('rememberPassword', password);
        else { localStorage.removeItem('rememberPassword'); }
        setToken(res.data.access_token);
        onLogin(res.data.access_token);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '请求失败');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2 className="modal-title">
          {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '找回密码'}
        </h2>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'forgot' ? (
            <>
              <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="modal-input" required />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="验证码" value={code} onChange={e => setCode(e.target.value)} className="modal-input" style={{ flex: 1 }} required />
                <button type="button" onClick={handleSendCode} disabled={countdown > 0} style={{ padding: '0 16px', borderRadius: 12, border: 'none', background: countdown > 0 ? '#ccc' : '#6366f1', color: '#fff', cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}>
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
              <input type="password" placeholder="新密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="modal-input" minLength={6} required />
            </>
          ) : (
            <>
              {!mode.includes('forgot') && (
                <>
                  {mode === 'register' && (
                    <input type="text" placeholder="姓名（可选）" value={name} onChange={e => setName(e.target.value)} className="modal-input" />
                  )}
                  <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="modal-input" required />
                  <input type="password" placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} className="modal-input" minLength={6} required />
                </>
              )}
            </>
          )}
          
          {mode === 'login' && (
            <div className="modal-options">
              <label><input type="checkbox" checked={rememberEmail} onChange={e => setRememberEmail(e.target.checked)} /> 记住账号</label>
              <label><input type="checkbox" checked={rememberPassword} onChange={e => setRememberPassword(e.target.checked)} /> 记住密码</label>
            </div>
          )}
          
          {error && <div className="modal-error">{error}</div>}
          
          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登录' : mode === 'register' ? '注册' : '重置密码')}
          </button>
        </form>
        
        <p className="modal-switch">
          {mode === 'login' ? (
            <>
              <span>没有账号？</span>
              <button type="button" onClick={() => setMode('register')}>立即注册</button>
              <span style={{ margin: '0 8px' }}>|</span>
              <button type="button" onClick={() => setMode('forgot')}>忘记密码？</button>
            </>
          ) : mode === 'register' ? (
            <>
              <span>已有账号？</span>
              <button type="button" onClick={() => setMode('login')}>立即登录</button>
            </>
          ) : (
            <>
              <span>记起密码？</span>
              <button type="button" onClick={() => setMode('login')}>立即登录</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
