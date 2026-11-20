import { useApp } from '../state/store.jsx';
import { Icon, Badge, DataTable } from '../components/ui/index.jsx';
import { st } from '../lib/format.js';

export default function Equipment() {
  const { M, A, set } = useApp();
  const { sens, online } = M;
  const rows = sens.map((s, i) => {
    const k = s.off ? 'crit' : s.bat < 20 ? 'warn' : 'ok';
    return { ...s, k, talTxt: s.tal.id + ' · ' + s.tal.nome, bc: s.bat < 20 ? '#D8452E' : s.bat < 50 ? '#EE8A1F' : '#3FA34D', sinalTxt: s.off ? '—' : s.sinal + ' dBm', ult: s.novo ? 'aguardando' : s.off ? '05:40' : 'há ' + (2 + ((i * 7) % 50)) + ' s', fw: s.fw || 'v2.4.0', status: s.off ? 'Offline' : s.bat < 20 ? 'Bateria baixa' : 'Online' };
  });
  const gwN = Math.max(1, Math.ceil(sens.length / 8));
  const gateways = Array.from({ length: Math.min(2, gwN + (sens.length > 6 ? 1 : 0)) }, (_, i) => ({ nome: i ? 'Gateway Sul · LoRaWAN' : 'Gateway Sede · LoRaWAN', info: `GW-0${i + 1} · ${i ? Math.floor(sens.length / 3) : sens.length - Math.floor(sens.length / 3)} sensores conectados · alcance ${i ? '3,1' : '4,2'} km`, up: i ? 'Ativo há 12 dias' : 'Ativo há 38 dias' }));
  const kpis = [
    { label: 'Dispositivos', icon: 'memory', val: sens.length + gateways.length, c: '#1A1E19' },
    { label: 'Online', icon: 'wifi', val: online + gateways.length, c: '#2B7A3D' },
    { label: 'Bateria baixa', icon: 'battery_2_bar', val: rows.filter(r => !r.off && r.bat < 20).length, c: '#B9561A' },
    { label: 'Atualização pendente', icon: 'system_update', val: rows.filter(r => r.fw !== 'v2.4.0').length, c: '#2563A0' }
  ];
  return (
    <div className="stack" data-screen-label="Equipamentos">
      <div className="grid-kpi sm">
        {kpis.map(k => <div key={k.label} className="kpi" style={{ gap: 10 }}><span className="lbl">{k.label}<Icon n={k.icon} /></span><span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: k.c }}>{k.val}</span></div>)}
      </div>
      <h3 className="ttl" style={{ marginTop: 4 }}>Gateways</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 12 }}>
        {gateways.map(g => (
          <div key={g.nome} className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
            <Icon n="router" size={24} style={{ width: 46, height: 46, borderRadius: 12, background: '#E3EEF8', color: '#2563A0', display: 'grid', placeItems: 'center' }} />
            <div className="tblock" style={{ flex: 1, gap: 3 }}><b style={{ fontSize: 14, fontWeight: 600 }}>{g.nome}</b><span style={{ fontSize: 12, color: 'var(--muted)' }}>{g.info}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><Badge k="ok">Online</Badge><span style={{ fontSize: 11.5, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{g.up}</span></div>
          </div>
        ))}
      </div>
      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Sensores <span className="cnt">· {sens.length}</span></h3>{M.acc.eq === 2 && <button className="btn btn-orange" onClick={() => set({ modal: 'sensor', mf: {}, modalErr: '' })}><Icon n="add" />Novo sensor</button>}</div>
        <DataTable minW={880} rows={rows} rowKey={r => r.id} empty="Nenhum sensor nesta propriedade."
          onRow={r => { A.focusTal(r.talId); set({ mapMode: 'telemetria' }); A.go('mapa'); }}
          cols={[
            { k: 'id', label: 'ID', w: '90px', main: true, render: s => <b style={{ fontWeight: 600 }}>{s.id}</b> },
            { k: 'tipo', label: 'Tipo', w: '160px', render: s => <span className="c-muted">{s.tipo}</span> },
            { k: 'talTxt', label: 'Talhão', w: 'minmax(140px,1.2fr)' },
            { k: 'bat', label: 'Bateria', w: '140px', render: s => <span className="row"><span className="bar"><i style={{ width: s.bat + '%', background: s.bc }} /></span><b className="tnum" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{s.bat}%</b></span> },
            { k: 'sinalTxt', label: 'Sinal', w: '90px', render: s => <span className="c-muted tnum">{s.sinalTxt}</span> },
            { k: 'ult', label: 'Última leitura', w: '110px', render: s => <span className="c-muted">{s.ult}</span> },
            { k: 'fw', label: 'Firmware', w: '80px', render: s => <span className="c-muted">{s.fw}</span> },
            { k: 'status', label: 'Status', w: '110px', render: s => <Badge bg={st(s.k)[0]} fg={st(s.k)[1]}>{s.status}</Badge> }
          ]} />
      </div>
    </div>
  );
}
