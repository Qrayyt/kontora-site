(function initFirebase() {
  const cfg = {
    apiKey: window.KONTORA_FIREBASE_API_KEY || "",
    authDomain: window.KONTORA_FIREBASE_AUTH_DOMAIN || "",
    projectId: window.KONTORA_FIREBASE_PROJECT_ID || "",
  };

  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId) return;
  if (!window.firebase?.initializeApp) return;
  if (!firebase.apps.length) firebase.initializeApp(cfg);
})();
