const API_URL = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("lead_manager_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = { message: "Request failed" };
    }
    throw Object.assign(new Error(body.message || "Request failed"), {
      errors: body.errors,
      status: response.status
    });
  }
  return response.status === 204 ? null : response.json();
}

export const leadApi = {
  list: ({ search = "", status = "", sort = "newest", page = 1, limit = 10 } = {}) =>
    request(`/leads?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&sort=${sort}&page=${page}&limit=${limit}`),
  create: (lead) => request("/leads", { method: "POST", body: JSON.stringify(lead) }),
  update: (id, lead) => request(`/leads/${id}`, { method: "PUT", body: JSON.stringify(lead) }),
  remove: (id) => request(`/leads/${id}`, { method: "DELETE" })
};

export const authApi = {
  signup: (details) => request("/auth/signup", { method: "POST", body: JSON.stringify(details) }),
  login: (details) => request("/auth/login", { method: "POST", body: JSON.stringify(details) })
};
