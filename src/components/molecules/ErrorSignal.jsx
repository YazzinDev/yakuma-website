import Micrographic from '../atoms/Micrographic';

/** Lost-carrier and diagnostic molecules from kO2Ft / fbpPR. */
export function ErrorRegister() {
  return <aside className="error-register" aria-hidden="true">
    <div className="error-register__header"><span>YK-ERROR // 404</span><span>[ERR.404]</span></div>
    <div className="error-register__detail">
      <strong>[ UNKNOWN ]</strong>
      <Micrographic name="frequency-arrows" preserveAspectRatio="none" />
      <p><span>SIGNAL&nbsp;&nbsp; : LOST / NO CARRIER</span><span>ORIGIN&nbsp;&nbsp; : YAKUMA.DE/ROUTE</span><span>RECOVERY : DIRECT ROUTE [01]</span></p>
    </div>
  </aside>;
}

export default function ErrorSignal() {
  return <div className="error-signal" aria-hidden="true">
    <div className="error-signal__barcode"><Micrographic name="route-barcode" preserveAspectRatio="none" /><p className="error-signal__desktop">ROUTE_NOT_FOUND // 625.437.LBA<br />STATUS: DISCONNECTED [404]</p><p className="error-signal__mobile">DIAGNOSTIC // SUSPENDED<br />ROUTE_NOT_FOUND [004]</p></div>
    <div className="error-signal__carrier"><div className="error-signal__symbols"><Micrographic name="lost-network" /><Micrographic name="lost-alert" /><Micrographic name="return-route" /></div><p className="error-signal__desktop">[ NO CARRIER ] &nbsp; // &nbsp; 004</p></div>
    <p className="error-signal__standby">DIAGNOSTIC UNIT // STANDBY<br />NODE: EGH-4040<br />STATE: SUSPENDED</p>
  </div>;
}
