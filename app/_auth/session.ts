const TENANT_LOGGED_IN_KEY = "cc_tenant_logged_in";

function canUseWebStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getTenantLoggedIn(): boolean {
  if (!canUseWebStorage()) return false;
  return window.localStorage.getItem(TENANT_LOGGED_IN_KEY) === "1";
}

export function setTenantLoggedIn(loggedIn: boolean) {
  if (!canUseWebStorage()) return;

  if (loggedIn) window.localStorage.setItem(TENANT_LOGGED_IN_KEY, "1");
  else window.localStorage.removeItem(TENANT_LOGGED_IN_KEY);
}