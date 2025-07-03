const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Ajout du token JWT si nécessaire
  if (withAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = "Erreur inconnue";
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

// Exemples d'appels spécialisés
export function login(email: string, password: string) {
  return apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: any) {
  return apiFetch<{ token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function get<T>(endpoint: string, token?: string) {
  return apiFetch<T>(endpoint, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function post<T>(endpoint: string, data: any, token?: string) {
  return apiFetch<T>(endpoint, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  });
}

export function del<T>(endpoint: string, token?: string) {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Récupérer le profil utilisateur
export function getProfile() {
  return apiFetch<any>("/users/profile", {}, true);
}

// Mettre à jour le profil utilisateur
export function updateProfile(data: any) {
  return apiFetch<any>("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }, true);
}

// Setup 2FA (générer secret et QR code)
export function setup2FA() {
  return apiFetch<any>("/auth/2fa/setup", {
    method: "POST",
  }, true);
}

// Activer le 2FA (vérifier le code)
export function verify2FA(token: string) {
  return apiFetch<any>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  }, true);
}

// Désactiver le 2FA
export function disable2FA(password: string, token: string) {
  return apiFetch<any>("/auth/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password, token }),
  }, true);
}

// Changer le mot de passe utilisateur
export function changePassword(current_password: string, new_password: string) {
  return apiFetch<any>("/users/change-password", {
    method: "PUT",
    body: JSON.stringify({ current_password, new_password }),
  }, true);
}

// Récupérer la liste des diplômes
export function getDiplomas(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<any>(`/diplomas${query ? `?${query}` : ""}`, {}, true);
}

// Créer un diplôme
export function createDiploma(data: any) {
  return apiFetch<any>("/diplomas", {
    method: "POST",
    body: JSON.stringify(data),
  }, true);
}

// Récupérer un diplôme par ID
export function getDiploma(id: string) {
  return apiFetch<any>(`/diplomas/${id}`, {}, true);
}

// Supprimer un diplôme
export function deleteDiploma(id: string) {
  return apiFetch<any>(`/diplomas/${id}`, { method: "DELETE" }, true);
}

// Enregistrer un diplôme sur la blockchain
export function registerDiplomaOnBlockchain(id: string) {
  return apiFetch<any>(`/diplomas/${id}/register-blockchain`, { method: "POST" }, true);
}

// Télécharger le PDF d'un diplôme
export function getDiplomaPDF(id: string) {
  return apiFetch<any>(`/diplomas/${id}/pdf`, {}, true);
}

// Récupérer les statistiques des diplômes
export function getDiplomaStats() {
  return apiFetch<any>("/diplomas/stats", {}, true);
}

// Lister les vérifications
export function getVerifications(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<any>(`/verifications${query ? `?${query}` : ""}`, {}, true);
}

// Vérifier un diplôme par hash (GET public)
export function verifyDiplomaByHash(hash: string) {
  return apiFetch<any>(`/diplomas/verify/${hash}`, {}, false);
}

// Créer une vérification (POST)
export function createVerification(data: any) {
  return apiFetch<any>("/verifications", {
    method: "POST",
    body: JSON.stringify(data),
  }, true);
}

// Lister les notifications
export function getNotifications(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<any>(`/notifications${query ? `?${query}` : ""}`, {}, true);
}

// Marquer une notification comme lue
export function markNotificationRead(id: string) {
  return apiFetch<any>(`/notifications/${id}/read`, { method: "PUT" }, true);
}

// Marquer toutes les notifications comme lues
export function markAllNotificationsRead() {
  return apiFetch<any>("/notifications/read-all", { method: "POST" }, true);
}

// Lister les utilisateurs
export function getUsers(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch<any>(`/admin/users${query ? `?${query}` : ""}`, {}, true);
}

// Modifier le rôle d'un utilisateur
export function updateUserRole(userId: string, role: string) {
  return apiFetch<any>(`/admin/update-role/${userId}`, {
    method: "POST",
    body: JSON.stringify({ role }),
  }, true);
}

// Modifier le statut d'un utilisateur
export function updateUserStatus(userId: string, status: string) {
  return apiFetch<any>(`/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  }, true);
}

// Suspendre un utilisateur
export function suspendUser(userId: string, reason: string) {
  return apiFetch<any>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, true);
}

// Lister les rôles
export function getRoles() {
  return apiFetch<any>("/admin/roles", {}, true);
}

// Lister les logs
export function getLogs() {
  return apiFetch<any>("/admin/logs", {}, true);
}

// Lister les analytics
export function getAnalytics() {
  return apiFetch<any>("/admin/analytics", {}, true);
} 