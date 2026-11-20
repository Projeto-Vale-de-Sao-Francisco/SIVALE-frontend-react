import { useApp } from '../state/store.jsx';
import { Icon } from '../components/ui/index.jsx';
import { ROLES } from '../data/mock.js';

export default function Login() {
  const { S, set, A, api } = useApp();
  const role = ROLES.find(r => r.v === S.role) || ROLES[0];
  return (
    <div className="login" data-screen-label="Login">
      <div className="login-art">
        <div className="txt">
          <Icon n="eco" fill />
          <b>Monitoramento climático para fruticultura de exportação</b>
          <span>Leituras de sensores IoT, alertas por cultura e apoio à decisão de colheita e exportação.</span>
        </div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: '32px 20px', minWidth: 0 }}>
        <form onSubmit={A.login}>
          <div className="tblock" style={{ gap: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Entrar</h1>
            <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Acesse com seu e-mail e senha.</span>
          </div>
          {api.isMock && (
            <div className="stack" style={{ gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink2)' }}>Perfil de demonstração</span>
              <div className="chips">
                {ROLES.map(r => (
                  <button type="button" key={r.v} className={'chip sm' + (r.v === S.role ? ' on' : '')} onClick={() => set({ role: r.v, loginEmail: null, loginErr: '' })}>{r.label}</button>
                ))}
              </div>
            </div>
          )}
          <label className="field">E-mail
            <input type="email" autoComplete="username" value={S.loginEmail ?? role.email} onChange={e => set({ loginEmail: e.target.value, loginErr: '' })} />
          </label>
          <label className="field">Senha
            <input type="password" autoComplete="current-password" value={S.loginPwd} onChange={e => set({ loginPwd: e.target.value, loginErr: '' })} placeholder={api.isMock ? 'Qualquer senha no modo demonstração' : ''} />
          </label>
          {S.loginErr && <span className="row" style={{ fontSize: 12.5, color: '#B3321F', gap: 6 }}><Icon n="error" size={17} />{S.loginErr}</span>}
          <button type="submit" className="btn btn-green btn-lg" disabled={S.loggingIn}>{S.loggingIn ? 'Entrando…' : 'Entrar'}</button>
          <div className="between wrap" style={{ fontSize: 12.5 }}>
            <span style={{ color: 'var(--muted)' }}>Sessão encerra após 30 min sem uso</span>
            <a href="#" onClick={e => e.preventDefault()}>Esqueci minha senha</a>
          </div>
        </form>
      </div>
    </div>
  );
}
