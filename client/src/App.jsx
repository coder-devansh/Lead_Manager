import { useEffect, useState } from "react";
import { authApi, leadApi } from "./api";

const SOURCES = ["Website", "Referral", "Social Media", "Advertisement", "Cold Call", "Other"];
const STATUSES = ["New", "Contacted", "Qualified", "Lost"];
const EMPTY_LEAD = { name: "", email: "", phone: "", company: "", source: "Website", status: "New" };

function validateLead(lead) {
  const errors = {};
  ["name", "email", "phone", "company", "source"].forEach((field) => {
    if (!String(lead[field] || "").trim()) errors[field] = "This field is required";
  });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.email = "Enter a valid email";
  return errors;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setError("");
    if (mode === "signup") {
      const nextErrors = {};
      if (!form.name.trim()) nextErrors.name = "Name is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email";
      if (form.password.length < 6) nextErrors.password = "Use at least 6 characters";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }
    setBusy(true);
    try {
      const result = mode === "signup"
        ? await authApi.signup(form)
        : await authApi.login(form);
      onAuthenticated(result);
    } catch (caught) {
      setErrors(caught.errors || {});
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark">LM</span><strong>Lead Manager</strong></div>
        <p className="eyebrow">{mode === "login" ? "Welcome back" : "Create your account"}</p>
        <h1>{mode === "login" ? "Sign in" : "Start managing leads"}</h1>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert">{error}</div>}
          {mode === "signup" && (
            <label><span>Name</span><input name="name" value={form.name} onChange={change} />{errors.name && <small className="field-error">{errors.name}</small>}</label>
          )}
          <label><span>Email</span><input name="email" type="email" value={form.email} onChange={change} />{errors.email && <small className="field-error">{errors.email}</small>}</label>
          <label><span>Password</span><input name="password" type="password" value={form.password} onChange={change} />{errors.password && <small className="field-error">{errors.password}</small>}</label>
          <button className="button primary auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </div>
  );
}

function LeadModal({ lead, onClose, onSaved }) {
  const isEditing = Boolean(lead?._id);
  const [form, setForm] = useState(lead || EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateLead(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError("");
    try {
      const saved = isEditing ? await leadApi.update(form._id, form) : await leadApi.create(form);
      onSaved(saved);
    } catch (caught) {
      setErrors(caught.errors || {});
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
        <div className="modal-header"><div><p className="eyebrow">{isEditing ? "Update information" : "Create a lead"}</p><h2 id="lead-modal-title">{isEditing ? "Edit lead" : "Add new lead"}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button></div>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert">{error}</div>}
          <div className="form-grid">
            <Field label="Name" name="name" value={form.name} onChange={change} error={errors.name} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={change} error={errors.email} />
            <Field label="Phone" name="phone" value={form.phone} onChange={change} error={errors.phone} />
            <Field label="Company" name="company" value={form.company} onChange={change} error={errors.company} />
            <label><span>Source</span><select name="source" value={form.source} onChange={change}>{SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label>
            <label><span>Status</span><select name="status" value={form.status} onChange={change}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
          <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save lead"}</button></div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, error }) {
  return <label><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} aria-invalid={Boolean(error)} />{error && <small className="field-error">{error}</small>}</label>;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("lead_manager_token");
    const user = localStorage.getItem("lead_manager_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [counts, setCounts] = useState({});
  const [modal, setModal] = useState(null);
  const [deleteLead, setDeleteLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function authenticate(result) {
    localStorage.setItem("lead_manager_token", result.token);
    localStorage.setItem("lead_manager_user", JSON.stringify(result.user));
    setSession({ token: result.token, user: result.user });
  }

  function logout() {
    localStorage.removeItem("lead_manager_token");
    localStorage.removeItem("lead_manager_user");
    setSession(null);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await leadApi.list({ search, status: statusFilter, sort, page });
      setLeads(result.leads);
      setPagination(result.pagination);
      setCounts(result.counts);
    } catch (caught) {
      if (caught.status === 401) logout();
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeout);
  }, [session, search, statusFilter, sort, page]);

  async function confirmDelete() {
    try {
      await leadApi.remove(deleteLead._id);
      setDeleteLead(null);
      await load();
    } catch (caught) {
      setError(caught.message);
    }
  }

  if (!session) return <AuthScreen onAuthenticated={authenticate} />;

  return (
    <div className="app-shell">
      <aside className="sidebar"><div className="brand"><span className="brand-mark">LM</span><span>Lead Manager</span></div><button className="logout" type="button" onClick={logout}>Sign out</button></aside>
      <main>
        <header className="topbar"><div><p className="eyebrow">Sales workspace</p><h1>Leads</h1></div><div className="top-actions"><span className="user-name">{session.user.name}</span><button className="button secondary mobile-signout" type="button" onClick={logout}>Sign out</button><button className="button primary" type="button" onClick={() => setModal(EMPTY_LEAD)}>+ Add lead</button></div></header>
        <section className="content">
          <div className="summary">
            {STATUSES.map((status) => <div key={status}><span>{status}</span><strong>{counts[status] || 0}</strong></div>)}
            <div><span>Total</span><strong>{pagination.total || 0}</strong></div>
          </div>
          <div className="toolbar">
            <label className="search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or company…" aria-label="Search leads" /></label>
            <select className="filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
            <select className="filter" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort leads"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="status">Status</option></select>
          </div>
          {error && <div className="alert">{error}</div>}
          <div className="table-card"><div className="table-wrap">
            <table>
              <thead><tr><th>Lead</th><th>Company</th><th>Source</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {!loading && leads.length === 0 && <tr><td colSpan="5"><div className="empty"><strong>No leads found</strong><span>Try another search or add a new lead.</span></div></td></tr>}
                {loading && <tr><td colSpan="5"><div className="empty">Loading leads…</div></td></tr>}
                {!loading && leads.map((lead) => <tr key={lead._id}><td><div className="lead-name"><span className="avatar">{lead.name.charAt(0).toUpperCase()}</span><div><strong>{lead.name}</strong><span>{lead.email}</span></div></div></td><td><strong className="company">{lead.company}</strong><span className="phone">{lead.phone}</span></td><td>{lead.source}</td><td><span className={`status status-${lead.status.toLowerCase()}`}>{lead.status}</span></td><td><div className="row-actions"><button type="button" onClick={() => setModal(lead)}>Edit</button><button className="delete" type="button" onClick={() => setDeleteLead(lead)}>Delete</button></div></td></tr>)}
              </tbody>
            </table>
          </div></div>
          <div className="pagination"><button type="button" className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {pagination.page} of {pagination.pages || 1}</span><button type="button" className="button secondary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </section>
      </main>
      {modal && <LeadModal lead={modal === EMPTY_LEAD ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {deleteLead && <div className="modal-backdrop" role="presentation"><section className="confirm-modal" role="alertdialog" aria-modal="true"><p className="eyebrow">Confirm delete</p><h2>Delete {deleteLead.name}?</h2><p>This lead will be permanently removed.</p><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setDeleteLead(null)}>Cancel</button><button className="button danger" type="button" onClick={confirmDelete}>Delete lead</button></div></section></div>}
    </div>
  );
}
