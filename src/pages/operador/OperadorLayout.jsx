import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function OperadorLayout() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Detector de conexión a Internet en tiempo real
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      // Aquí llamaremos a la función de sincronización en el futuro
      alert("📡 Internet recuperado. Sincronizando viajes...");
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const abrirSoporte = () => {
    alert("Próximamente: Se abrirá el modal de contacto con Jorge o Raymundo.");
  };

  return (
    <>
      {/* Banner Offline */}
      {isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', background: '#475569', 
          color: 'white', textAlign: 'center', padding: '10px', fontSize: '13px', 
          fontWeight: 'bold', zIndex: 9999, boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          ⚠️ Sin conexión a Internet. Estás en Modo Fuera de Línea.
        </div>
      )}

      {/* Botón Flotante de Soporte */}
      <button 
        className="fab-soporte" 
        onClick={abrirSoporte} 
        title="Soporte Estudiantil"
        style={{
          position: 'fixed', bottom: '25px', right: '25px', background: 'var(--danger)',
          color: 'white', width: '60px', height: '60px', borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px',
          border: 'none', cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 15px rgba(244, 63, 94, 0.5)'
        }}
      >
        🆘
      </button>

      {/* Renderiza las pantallas hijas (Login, Dashboard, etc.) */}
      <Outlet />
    </>
  );
}