import { Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Importamos el protector

// Importaciones de la App Móvil
import OperadorLayout from './pages/Operador/OperadorLayout';
import LoginApp from './pages/Auth/LoginApp';
import DashboardAlumno from './pages/Operador/DashboardAlumno';
import DashboardTutor from './pages/Operador/DashboardTutor';

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

const Portal = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: '36px', letterSpacing: '1px', textShadow: '0 0 20px rgba(217,119,6,0.4)' }}>UDAT</h1>
    <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '15px' }}>Bienvenido al Centro Corporativo.</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <Link to="/app" style={{ padding: '18px', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', width: '90%', maxWidth: '300px', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)' }}>🚚 App Operadores</Link>
      <Link to="/admin-login" style={{ padding: '18px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', width: '90%', maxWidth: '300px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}>📊 Centro de Mando (Admin)</Link>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      
      {/* RUTAS DE LA APP MÓVIL */}
      <Route path="/app" element={<OperadorLayout />}>
        <Route index element={<LoginApp />} />
        {/* Rutas protegidas para Alumnos */}
        <Route path="alumno" element={
          <ProtectedRoute role="app">
            <DashboardAlumno />
          </ProtectedRoute>
        } />
        {/* Rutas protegidas para Tutores */}
        <Route path="tutor" element={
          <ProtectedRoute role="app">
            <DashboardTutor />
          </ProtectedRoute>
        } />
      </Route>

      {/* RUTAS DEL PANEL ADMINISTRATIVO */}
      {/* Separamos el Login en su propia ruta independiente */}
      <Route path="/admin-login" element={<LoginAdmin />} />
      
      {/* Esta es la Gran Carpeta "/admin" protegida */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
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
    </Routes>
  );
}

export default App;