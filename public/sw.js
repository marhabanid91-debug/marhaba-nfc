// خدمة مبسطة لتفعيل «تثبيت التطبيق» فقط. لا تخزّن شيئاً، فيبقى كل تحديث يظهر فوراً.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
