import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  // Verificamos si existe sesión según el rol
  const session = localStorage.getItem(role === 'admin' ? 'udat_admin_session' : 'udat_app_session');

  if (!session) {
    // Si no hay sesión, mandamos al login correspondiente
    return <Navigate to={role === 'admin' ? '/admin' : '/app'} replace />;
  }

  // Si hay sesión, dejamos que el componente cargue (el dashboard)
  return children;
}