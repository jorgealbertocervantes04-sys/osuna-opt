// sw.js - Service Worker para notificaciones push
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('Push event data no es JSON válido:', e);
  }

  const title = data.title || "LARMEX - Academia OPT";
  const options = {
    body: data.body || "¡No olvides registrar tu bitácora de inducción de hoy!",
    icon: '/osuna-opt/icono-larmex.png',   // Ruta con base del proyecto
    badge: '/osuna-opt/icono-larmex.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/osuna-opt/')      // Redirige a la base de la app
  );
});