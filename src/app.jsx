import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// --- IMÁGENES Y ASSETS ---
import logotrayecto from "./logo-trayecto.png";

// --- IMPORTACIONES DE LOGINS (TRES PUERTAS) ---
import LoginApp from './components/LoginApp';
import LoginAdmin from './components/LoginAdmin';
import LoginGeneral from './components/LoginGeneral';

// --- IMPORTACIONES DE DASHBOARDS CORPORATIVOS ---
import DashboardAlumno from './components/DashboardAlumno';
import DashboardTutor from './components/DashboardTutor';
import AdminDashboard from './components/AdminDashboard';
import DashboardGeneral from './components/DashboardGeneral';

// --- IMPORTACIONES DE LAYOUTS Y OTRAS PÁGINAS ADMIN ---
import OperadorLayout from './pages/Operador/OperadorLayout';
import AdminLayout from './pages/Admin/AdminLayout';
import Directorio from './pages/Admin/Directorio';
import Viajes from './pages/Admin/Viajes';
import AuditoriaOPT from './pages/Admin/AuditoriaOPT';
import Academia from './pages/Admin/Academia';
import Reportes from './pages/Admin/Reportes';
import Asistencias from './pages/Admin/Asistencias';
import Cardex from './pages/Admin/Cardex';
import Encuestas from './pages/Admin/Encuestas';

// ==========================================
// UTILERÍA Y COMPONENTES GLOBALES
// ==========================================
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NotFound = () => (
  <div style={{ textAlign: 'center', marginTop: '100px', color: '#f8fafc', padding: '20px', fontFamily: 'system-ui' }}>
    <h1 style={{ fontSize: '72px', color: '#0284c7', margin: '0 0 10px 0' }}>404</h1>
    <h2 style={{ fontSize: '22px', margin: '0 0 20px 0' }}>Oops... Página no encontrada</h2>
    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>La sección a la que intentas acceder no existe o fue movida.</p>
    <Link to="/" style={{ padding: '12px 25px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
      Volver al Centro Corporativo
    </Link>
  </div>
);

const Portal = () => {
  const baseButtonStyle = { padding: '18px', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', width: '90%', maxWidth: '300px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'transform 0.2s ease', display: 'block', margin: '0 auto' };
  
  return (
    <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px', fontFamily: 'system-ui' }}>
      <img src={logotrayecto} alt="Logo UDAT LARMEX" style={{ width: '160px', marginBottom: '20px', filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.3))' }} />
      <h1 style={{ color: '#0284c7', margin: 0, fontSize: '42px', fontWeight: 900, letterSpacing: '1.5px' }}>UDAT</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px', fontSize: '15px', fontWeight: 500 }}>Bienvenido al Centro Corporativo.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
        <Link to="/login-app" style={{ ...baseButtonStyle, background: '#0284c7' }}>🚚 Acceso App Operadores</Link>
        <Link to="/login-admin" style={{ ...baseButtonStyle, background: '#2563eb' }}>📊 Acceso Administración</Link>
        <Link to="/login-general" style={{ ...baseButtonStyle, background: '#4f46e5' }}>🏢 Portal Alta Dirección</Link>
      </div>
    </div>
  );
};

// ==========================================
// CANDADO DIGITAL DE SEGURIDAD (POR ROLES)
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

// ==========================================
// ENRUTADOR MAESTRO
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* RUTA RAÍZ: PORTAL DE BIENVENIDA */}
        <Route path="/" element={<Portal />} />
        
        {/* =========================================
            LOS TRES LOGINS INDEPENDIENTES
        ========================================= */}
        <Route path="/login-app" element={<LoginApp />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/login-general" element={<LoginGeneral />} />

        {/* =========================================
            RUTAS APP MÓVIL (ALUMNOS Y TUTORES)
        ========================================= */}
        <Route path="/app" element={<OperadorLayout />}>
          <Route path="alumno" element={<RutaProtegida rolPermitido="Alumno"><DashboardAlumno /></RutaProtegida>} />
          <Route path="tutor" element={<RutaProtegida rolPermitido="Tutor"><DashboardTutor /></RutaProtegida>} />
        </Route>

        {/* =========================================
            RUTAS PANEL ADMINISTRATIVO (ADMIN)
        ========================================= */}
        <Route path="/admin" element={<RutaProtegida rolPermitido="Admin"><AdminLayout /></RutaProtegida>}>
          <Route index element={<AdminDashboard />} />
          <Route path="directorio" element={<Directorio />} />
          <Route path="viajes" element={<Viajes />} />
          <Route path="auditoria-opt" element={<AuditoriaOPT />} />
          <Route path="academia" element={<Academia />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="asistencias" element={<Asistencias />} />
          <Route path="cardex" element={<Cardex />} />
          <Route path="encuestas" element={<Encuestas />} />
        </Route>

        {/* =========================================
            RUTA VISTA GENERAL DIRECTIVA
        ========================================= */}
        <Route path="/general" element={<RutaProtegida rolPermitido="General"><DashboardGeneral /></RutaProtegida>} />

        {/* CATCH-ALL: Redirección de rutas rotas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}