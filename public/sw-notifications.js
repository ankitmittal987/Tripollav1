self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
      return undefined;
    })
  );
});

self.addEventListener("push", (event) => {
  let title = "Tripolla Upcoming Event";
  let body = "You have an upcoming flight or trip milestone.";

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
    } catch {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "tripolla-event"
    })
  );
});

self.addEventListener("message", (event) => {
  const payload = event.data;
  if (payload && payload.type === "SHOW_EVENT_NOTIFICATION") {
    event.waitUntil(
      self.registration.showNotification(payload.title || "Tripolla Trip Alert", {
        body: payload.body || "",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: payload.tag || "tripolla-event"
      })
    );
  }
});
