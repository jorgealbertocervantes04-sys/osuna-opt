import { supabase } from "./services/supabaseClient";
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';


// --- IMPORTACIONES DE LA APP MÓVIL ---
import OperadorLayout from './pages/Operador/OperadorLayout';
import LoginApp from './pages/Auth/LoginApp';
import DashboardAlumno from './pages/Operador/DashboardAlumno';
import DashboardTutor from './pages/Operador/DashboardTutor';

// --- IMPORTACIONES DEL PANEL DE ADMINISTRACIÓN ---
import LoginAdmin from './pages/Auth/LoginAdmin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Directorio from './pages/Admin/Directorio';
import Viajes from './pages/Admin/Viajes';
import AuditoriaOPT from './pages/Admin/AuditoriaOPT';
import Academia from './pages/Admin/Academia';
import Reportes from './pages/Admin/Reportes';
import Asistencias from './pages/Admin/Asistencias';
import Cardex from './pages/Admin/Cardex';
import Encuestas from './pages/Admin/Encuestas';

// --- IMPORTACIONES DE LA VISTA DIRECTIVA ---
import LoginGeneral from './pages/Auth/LoginGeneral';
import AdminDashboardGeneral from './pages/Admin/AdminDashboardGeneral'; 
<img src="/logo-trayecto.png" alt="Logo" />
// ==========================================
// UTILERÍA: RESTAURADOR DE SCROLL
// ==========================================

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ==========================================
// PANTALLAS GLOBALES (404 Y PORTAL)
// ==========================================
const NotFound = () => (
  <div style={{ textAlign: 'center', minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#f8fafc', padding: '20px' }}>
    <h1 style={{ fontSize: '80px', color: '#0ea5e9', margin: '0 0 10px 0' }}>404</h1>
    <h2 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>Página no encontrada</h2>
    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>La sección a la que intentas acceder no existe.</p>
    <Link to="/" style={{ padding: '14px 30px', background: '#1e293b', color: 'white', border: '1px solid #334155', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold', transition: '0.3s' }}>
      Volver al Inicio
    </Link>
  </div>
);

// PORTAL CON DISEÑO OSCURO CORPORATIVO
const Portal = () => {
  const baseButtonStyle = {
    padding: '16px', color: 'white', textDecoration: 'none', borderRadius: '12px',
    fontWeight: 'bold', width: '100%', maxWidth: '320px', textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'transform 0.2s ease, opacity 0.2s ease',
    fontSize: '16px', display: 'block'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
      <img src={logotrayecto} alt="Logo" style={{ width: '180px', marginBottom: '15px', filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.5))' }} />
      <h1 style={{ color: '#0ea5e9', margin: 0, fontSize: '46px', fontWeight: 900, letterSpacing: '2px' }}>UDAT</h1>
      <p style={{ color: '#94a3b8', marginBottom: '45px', fontSize: '16px', fontWeight: 500 }}>Bienvenido al Centro Corporativo</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
        <Link to="/login-app" style={{ ...baseButtonStyle, background: '#0ea5e9' }}>
          🚚 App Operadores
        </Link>
        <Link to="/admin-login" style={{ ...baseButtonStyle, background: '#2563eb' }}>
          📊 Centro de Mando (Admin)
        </Link>
        <Link to="/login-general" style={{ ...baseButtonStyle, background: '#4f46e5' }}>
          🏢 Portal Alta Dirección
        </Link>
      </div>
    </div>
  );
};

// ==========================================
// CANDADO DIGITAL DE SEGURIDAD (RUTAS PROTEGIDAS)
// ==========================================
const RutaProtegida = ({ children, rolPermitido }) => {
  const session = localStorage.getItem('udat_app_session');
  
  if (!session) return <Navigate to="/" replace />;
  
  const usuario = JSON.parse(session);

  if (rolPermitido && usuario.rol !== rolPermitido) {
    if (usuario.rol === 'Alumno') return <Navigate to="/app/alumno" replace />;
    if (usuario.rol === 'Tutor') return <Navigate to="/app/tutor" replace />;
    if (usuario.rol === 'Admin') return <Navigate to="/admin" replace />;
    if (usuario.rol === 'General') return <Navigate to="/general" replace />;
  }

  return children;
};
 
const { data, error } = await supabase.from("viajes_diarios").select("*").limit(100);
  
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      
      <Routes>
        {/* RUTA RAÍZ */}
        <Route path="/" element={<Portal />} />
        
        {/* LOGINS INDEPENDIENTES */}
        <Route path="/login-app" element={<LoginApp />} />
        <Route path="/admin-login" element={<LoginAdmin />} />
        <Route path="/login-general" element={<LoginGeneral />} />

        {/* RUTAS DE LA APP MÓVIL */}
        <Route path="/app" element={<OperadorLayout />}>
          <Route index element={<LoginApp />} />
          <Route path="alumno" element={<RutaProtegida rolPermitido="Alumno"><DashboardAlumno /></RutaProtegida>} />
          <Route path="tutor" element={<RutaProtegida rolPermitido="Tutor"><DashboardTutor /></RutaProtegida>} />
        </Route>

        {/* RUTAS DEL PANEL ADMINISTRATIVO */}
        <Route path="/admin" element={<RutaProtegida rolPermitido="Admin"><AdminLayout /></RutaProtegida>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="directorio" element={<Directorio />} />
          <Route path="viajes" element={<Viajes />} />
          <Route path="auditoria-opt" element={<AuditoriaOPT />} />
          <Route path="academia" element={<Academia />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="asistencias" element={<Asistencias />} />
          <Route path="cardex" element={<Cardex />} />
          <Route path="encuestas" element={<Encuestas />} />
        </Route>

        {/* RUTA VISTA GENERAL DIRECTIVA */}
        <Route path="/general" element={<RutaProtegida rolPermitido="General"><AdminDashboardGeneral /></RutaProtegida>} />

        {/* ERROR 404 CATCH-ALL */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}