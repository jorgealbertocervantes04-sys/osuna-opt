import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Tus otras importaciones de estilos...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// =========================================================
// AQUÍ PEGAS EL CÓDIGO DEL SERVICE WORKER
// =========================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Asegúrate de que el archivo sw.js esté en tu carpeta "public"
   navigator.serviceWorker.register('/osuna-opt/sw.js')
      .then(reg => console.log('✓ Service Worker registrado con éxito', reg.scope))
      .catch(err => console.error('❌ Error al registrar Service Worker', err));
  });
}