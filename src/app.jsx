import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import logotrayecto from "./logo-trayecto.png";

// Importaciones de la App Móvil
import OperadorLayout from './pages/Operador/OperadorLayout';
import LoginApp from './pages/Auth/LoginApp';
import DashboardAlumno from './pages/Operador/DashboardAlumno';
import DashboardTutor from './pages/Operador/DashboardTutor';

// Importaciones del Panel de general
import AdminDashboardGeneral from './pages/Admin/AdminDashboardGeneral';

// Importaciones del Panel de Administración
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

// --- UTILERÍA: RESTAURADOR DE SCROLL ENTRE PÁGINAS ---
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// --- VISTA GLOBAL DE ERROR 404 (CATCH-ALL) ---
const NotFound = () => (
  <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-light)', padding: '20px' }}>
    <h1 style={{ fontSize: '72px', color: 'var(--primary)', margin: '0 0 10px 0' }}>404</h1>
    <h2 style={{ fontSize: '22px', margin: '0 0 20px 0' }}>Oops... Página no encontrada</h2>
    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>La sección a la que intentas acceder no existe o fue movida.</p>
    <Link to="/" style={{ padding: '12px 25px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', transition: '0.3s' }}>
      Volver al Centro Corporativo
    </Link>
  </div>
);

// --- PORTAL DE ENTRADA CORPORATIVO ---
const Portal = () => {
  const baseButtonStyle = {
    padding: '18px',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    width: '90%',
    maxWidth: '300px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px', animation: 'fadeIn 0.4s ease' }}>
      <img src={logotrayecto} alt="Logo" style={{ width: '160px', marginBottom: '20px', filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.3))' }} />
      <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: '42px', fontWeight: 900, letterSpacing: '1.5px' }}>UDAT</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px', fontSize: '15px', fontWeight: 500 }}>Bienvenido al Centro Corporativo.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
        <Link 
          to="/app" 
          style={{ ...baseButtonStyle, background: 'var(--primary)' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 119, 6, 0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'; }}
        >
          🚚 App Operadores
        </Link>
        
        <Link 
          to="/admin-login" 
          style={{ ...baseButtonStyle, background: '#2563eb' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'; }}
        >
          📊 Centro de Mando (Admin)
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      {/* Resetea la barra de desplazamiento en cada cambio de ruta */}
      <ScrollToTop />
      
      <Routes>
        {/* RUTA RAÍZ */}
        <Route path="/" element={<Portal />} />
        
        {/* RUTAS DE LA APP MÓVIL */}
        <Route path="/app" element={<OperadorLayout />}>
          <Route index element={<LoginApp />} />
          <Route path="alumno" element={
            <ProtectedRoute role="app"><DashboardAlumno /></ProtectedRoute>
          } />
          <Route path="tutor" element={
            <ProtectedRoute role="app"><DashboardTutor /></ProtectedRoute>
          } />
        </Route>

        {/* RUTAS DEL PANEL ADMINISTRATIVO */}
        <Route path="/admin-login" element={<LoginAdmin />} />
        
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* MEJORA: Resuelve la ruta base '/admin' usando el Dashboard General */}
          <Route index element={<AdminDashboardGeneral />} />
          
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="general" element={<AdminDashboardGeneral />} /> {/* Mapeo explícito adicional */}
          <Route path="directorio" element={<Directorio />} />
          <Route path="viajes" element={<Viajes />} />
          <Route path="auditoria-opt" element={<AuditoriaOPT />} />
          <Route path="academia" element={<Academia />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="asistencias" element={<Asistencias />} />
          <Route path="cardex" element={<Cardex />} />
          <Route path="encuestas" element={<Encuestas />} />
        </Route>

        {/* CATCH-ALL: Redirección o manejo seguro de rutas rotas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

export default App;