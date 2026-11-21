const API_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = { message: "Request failed" };
    }
    throw Object.assign(new Error(body.message || "Request failed"), { errors: body.errors });
  }
  return response.status === 204 ? null : response.json();
}

export const leadApi = {
  list: (search = "", status = "") =>
    request(`/leads?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  create: (lead) => request("/leads", { method: "POST", body: JSON.stringify(lead) }),
  update: (id, lead) => request(`/leads/${id}`, { method: "PUT", body: JSON.stringify(lead) }),
  remove: (id) => request(`/leads/${id}`, { method: "DELETE" })
};
