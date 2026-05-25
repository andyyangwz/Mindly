import { config } from "../config";

function getAuthHeaders() {
  const token = localStorage.getItem("mindly-token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(
      body?.error || body?.message || `Request failed: ${response.status}`
    );
    error.response = body;
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function request(endpoint, options = {}) {
  const url = `${config.API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });
  return handleResponse(response);
}

export const api = {
  get: (url) => request(url),

  post: (url, data, options) =>
    request(url, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    }),

  put: (url, data) =>
    request(url, { method: "PUT", body: JSON.stringify(data) }),

  delete: (url) => request(url, { method: "DELETE" }),
};
