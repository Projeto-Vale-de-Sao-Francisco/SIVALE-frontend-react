import { useEffect } from 'react';
import { useApp } from './state/store.jsx';
import { Sidebar, Header, MobileNav } from './components/layout/Layout.jsx';
import { FormModal, FarmPicker, Notifications, ExportDialog, LogoutDialog, Toast } from './components/overlays/Overlays.jsx';
import { Icon } from './components/ui/index.jsx';
import Login from './screens/Login.jsx';
import Overview from './screens/Overview.jsx';
import MapScreen from './screens/MapScreen.jsx';
import Monitor from './screens/Monitor.jsx';
import Farms from './screens/Farms.jsx';
import Fields from './screens/Fields.jsx';
import Harvest from './screens/Harvest.jsx';
import Predictions from './screens/Predictions.jsx';
import Equipment from './screens/Equipment.jsx';
import Alerts from './screens/Alerts.jsx';
import Market from './screens/Market.jsx';
import Admin from './screens/Admin.jsx';

const SCREENS = { overview: Overview, mapa: MapScreen, mon: Monitor, faz: Farms, tal: Fields, col: Harvest, ia: Predictions, eq: Equipment, al: Alerts, mk: Market, adm: Admin };

export default function App() {
  const { S, M, set } = useApp();

  // perfil sem acesso à tela atual volta para a visão geral
  useEffect(() => {
    if (S.logged && !M.acc[S.screen]) set({ screen: 'overview' });
  }, [S.logged, S.screen, M.acc, set]);

  // rola para o topo ao trocar de tela
  useEffect(() => { window.scrollTo(0, 0); }, [S.screen]);

  if (!S.logged) return <><Login /><Toast /></>;

  const Screen = SCREENS[S.screen] || Overview;
  const isMap = S.screen === 'mapa';

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        {!isMap && <Header />}
        <div className={'content' + (isMap ? ' flush' : '')}>
          {S.apiError && (
            <div className="notice err" style={isMap ? { margin: 12 } : undefined}>
              <Icon n="cloud_off" /><span style={{ flex: 1 }}>{S.apiError}</span>
              <button className="btn-link" style={{ color: '#B3321F' }} onClick={() => set({ apiError: '' })}>Fechar</button>
            </div>
          )}
          <Screen />
        </div>
      </main>
      <MobileNav />
      <FarmPicker />
      <Notifications />
      <ExportDialog />
      <LogoutDialog />
      <FormModal />
      <Toast />
    </div>
  );
}
