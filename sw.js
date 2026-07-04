// Este Service Worker escucha las notificaciones Push enviadas desde tu servidor
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "LARMEX - Academia OPT";
  const options = {
    body: data.body || "¡No olvides registrar tu bitácora de inducción de hoy!",
    icon: '/icono-larmex.png', // Asegúrate de tener un icono en tu carpeta public
    badge: '/icono-larmex.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Cuando el alumno toca la notificación, lo llevamos a la app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});