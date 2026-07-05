import { Navigate } from 'react-router-dom';

/**
 * Protege las rutas verificando la existencia de una sesión en localStorage.
 */
export default function ProtectedRoute({ children, role }) {
  const sessionKey = role === 'admin' ? 'udat_admin_session' : 'udat_app_session';
  const sessionData = localStorage.getItem(sessionKey);

  if (!sessionData) {
    // Redirige al login correspondiente si no hay sesión
    const redirectPath = role === 'admin' ? '/admin-login' : '/app';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}