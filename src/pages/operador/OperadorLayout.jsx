import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function OperadorLayout() {
  // --- ESTADOS ---
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [modalSoporteAbierto, setModalSoporteAbierto] = useState(false);
  
  // Nuevo Estado: Para alertas/toasts internos del sistema sin bloquear la pantalla
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '' });

  // --- DETECTOR DE CONEXIÓN A INTERNET (Tiempo Real) ---
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      
      // Upgrade: En lugar de un alert() nativo invasivo, usamos un Toast personalizado
      setNotificacion({
        visible: true,
        mensaje: "📡 Internet recuperado. Sincronizando viajes..."
      });

      // Auto ocultar la notificación tras 4 segundos
      setTimeout(() => {
        setNotificacion({ visible: false, mensaje: '' });
      }, 4000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // --- EFECTO DE ACCESIBILIDAD (Cerrar con tecla Escape) ---
  useEffect(() => {
    const manejarTeclaEsc = (e) => {
      if (e.key === 'Escape') setModalSoporteAbierto(false);
    };

    if (modalSoporteAbierto) {
      window.addEventListener('keydown', manejarTeclaEsc);
    }
    return () => window.removeEventListener('keydown', manejarTeclaEsc);
  }, [modalSoporteAbierto]);

  // --- LÓGICA DE SOPORTE ---
  const abrirSoporte = () => {
    setModalSoporteAbierto(true);
  };

  const abrirWhatsApp = (telefono, coordinador) => {
    const mensaje = encodeURIComponent(`Hola ${coordinador}, necesito asistencia en la plataforma.`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  // Nueva Función: Llamada directa por línea telefónica regular
  const realizarLlamada = (telefono) => {
    window.open(`tel:${telefono}`, '_self');
  };

  // --- RENDERIZADO DEL LAYOUT ---
  return (
    <>
      {/* Banner Offline */}
      {isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', background: '#ef4444', 
          color: 'white', textAlign: 'center', padding: '12px', fontSize: '13px', 
          fontWeight: 'bold', zIndex: 9999, boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          animation: 'slideDown 0.3s ease'
        }}>
          <span>⚠️ Sin conexión a Internet. Estás en Modo Fuera de Línea.</span>
        </div>
      )}

      {/* Toast de Notificación del Sistema (Reconexión de Red u otros) */}
      {notificacion.visible && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#1e293b',
          color: '#22c55e', padding: '15px 25px', borderRadius: '12px', fontSize: '14px',
          fontWeight: 700, zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'fadeInRight 0.3s ease'
        }}>
          {notificacion.mensaje}
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
          border: 'none', cursor: 'pointer', zIndex: 1000, 
          boxShadow: '0 4px 20px rgba(244, 63, 94, 0.6)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(244, 63, 94, 0.8)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(244, 63, 94, 0.6)';
        }}
      >
        🆘
      </button>

      {/* Modal Emergente de Contacto Rápido */}
      {modalSoporteAbierto && (
        <div 
          onClick={() => setModalSoporteAbierto(false)} // Cierre al hacer clic en el fondo oscuro
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(6px)',
            transition: 'all 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
            style={{
              background: 'var(--card-bg)', color: 'var(--text-light)',
              padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)',
              width: '90%', maxWidth: '620px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative', animation: 'fadeInUp 0.2s ease'
            }}
          >
            
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📞 Centro de Contacto Rápido
              </h2>
              <button 
                onClick={() => setModalSoporteAbierto(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', fontSize: '22px', cursor: 'pointer', opacity: 0.7, outline: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'gray', marginBottom: '25px', marginTop: 0, textAlign: 'left' }}>
              Para soporte inmediato con el portal, selecciona un método de contacto. WhatsApp requiere datos; la llamada telefónica funciona incluso con señal celular básica.
            </p>

            {/* Contenedor de Tarjetas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              
              {/* Tarjeta Jorge Osuna */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
                <div>
                  <span style={{ display: 'inline-block', fontSize: '11px', background: 'rgba(54, 162, 235, 0.15)', color: '#36a2eb', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    Experiencia y soporte OPT
                  </span>
                  <h3 style={{ margin: '5px 0 2px 0', fontSize: '18px', fontWeight: 700, textAlign: 'left' }}>Jorge Osuna</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'gray', textAlign: 'left' }}>+52 81 1544 8828</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => abrirWhatsApp('528115448828', 'Jorge')}
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '11px 15px', borderRadius: '10px', fontWeight: 700, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    💬 WhatsApp
                  </button>
                  <button 
                    onClick={() => realizarLlamada('528115448828')}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '9px 15px', borderRadius: '10px', fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    📞 Llamada Directa
                  </button>
                </div>
              </div>

              {/* Tarjeta Raymundo Martínez */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
                <div>
                  <span style={{ display: 'inline-block', fontSize: '11px', background: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    Seguimiento OPT
                  </span>
                  <h3 style={{ margin: '5px 0 2px 0', fontSize: '18px', fontWeight: 700, textAlign: 'left' }}>Raymundo Martínez</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'gray', textAlign: 'left' }}>+52 81 1662 6699</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => abrirWhatsApp('528116626699', 'Raymundo')}
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '11px 15px', borderRadius: '10px', fontWeight: 700, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    💬 WhatsApp
                  </button>
                  <button 
                    onClick={() => realizarLlamada('528116626699')}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '9px 15px', borderRadius: '10px', fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    📞 Llamada Directa
                  </button>
                </div>
              </div>

            </div>

            {/* Botón Inferior para Cerrar */}
            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => setModalSoporteAbierto(false)}
                style={{ background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Renderiza las pantallas hijas (Login, Dashboard, etc.) */}
      <Outlet />
    </>
  );
}