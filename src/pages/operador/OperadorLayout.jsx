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
  // 1. Las importaciones van hasta arriba
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

export default function TuComponente() {
  
  // 2. AQUÍ PEGAS EL ESTADO Y LAS FUNCIONES (Antes del return)
  const [modalSoporteAbierto, setModalSoporteAbierto] = useState(false);

  const abrirSoporte = () => {
    setModalSoporteAbierto(true);
  };

  const abrirWhatsApp = (telefono, coordinador) => {
    const mensaje = encodeURIComponent(`Hola ${coordinador}, necesito asistencia en la plataforma.`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };
}
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
          border: 'none', cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 15px rgba(244, 63, 94, 0.5)',
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🆘
      </button>

      {/* Modal Emergente de Contacto Rápido */}
      {modalSoporteAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--card-bg)', color: 'var(--text-light)',
            padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)',
            width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative', animation: 'fadeIn 0.2s ease'
          }}>
            
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📞 Centro de Contacto Rápido
              </h2>
              <button 
                onClick={() => setModalSoporteAbierto(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', fontSize: '22px', cursor: 'pointer', opacity: 0.7 }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'gray', marginBottom: '25px', marginTop: 0 }}>
              Para soporte inmediato con el portal, selecciona un contacto para abrir WhatsApp automáticamente.
            </p>

            {/* Contenedor de Tarjetas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              
              {/* Tarjeta Jorge Osuna */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', background: 'rgba(54, 162, 235, 0.2)', color: '#36a2eb', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Experiencia y soporte OPT
                </span>
                <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', fontWeight: 700 }}>Jorge Osuna</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'gray' }}>+52 123 456 7890</p>
                <button 
                  onClick={() => abrirWhatsApp('528115448828', 'Jorge')} // <- PON EL NÚMERO AQUÍ
                  style={{ background: '#25D366', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 700, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Contactar vía WhatsApp
                </button>
              </div>

              {/* Tarjeta Raymundo Martínez */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Seguimiento OPT
                </span>
                <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', fontWeight: 700 }}>Raymundo Martínez</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'gray' }}>+52 123 456 7890</p>
                <button 
                  onClick={() => abrirWhatsApp('528116626699', 'Raymundo')} // <- PON EL NÚMERO AQUÍ
                  style={{ background: '#25D366', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 700, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Contactar vía WhatsApp
                </button>
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