import { useEffect, useMemo, useState } from "react";
import { leadApi } from "./api";

const SOURCES = ["Website", "Referral", "Social Media", "Advertisement", "Cold Call", "Other"];
const STATUSES = ["New", "Contacted", "Qualified", "Lost"];
const EMPTY_LEAD = { name: "", email: "", phone: "", company: "", source: "Website", status: "New" };

function validateLead(lead) {
  const errors = {};
  ["name", "email", "phone", "company", "source"].forEach((field) => {
    if (!String(lead[field] || "").trim()) errors[field] = "This field is required";
  });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.email = "Enter a valid email";
  }
  return errors;
}

function LeadModal({ lead, onClose, onSaved }) {
  const isEditing = Boolean(lead?._id);
  const [form, setForm] = useState(lead || EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
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
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isEditing ? "Update information" : "Create a lead"}</p>
            <h2 id="lead-modal-title">{isEditing ? "Edit lead" : "Add new lead"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert">{error}</div>}
          <div className="form-grid">
            <Field label="Name" name="name" value={form.name} onChange={change} error={errors.name} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={change} error={errors.email} />
            <Field label="Phone" name="phone" value={form.phone} onChange={change} error={errors.phone} />
            <Field label="Company" name="company" value={form.company} onChange={change} error={errors.company} />
            <label>
              <span>Source</span>
              <select name="source" value={form.source} onChange={change}>
                {SOURCES.map((source) => <option key={source}>{source}</option>)}
              </select>
              {errors.source && <small className="field-error">{errors.source}</small>}
            </label>
            <label>
              <span>Status</span>
              <select name="status" value={form.status} onChange={change}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
              {errors.status && <small className="field-error">{errors.status}</small>}
            </label>
          </div>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save lead"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, error }) {
  return (
    <label>
      <span>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} aria-invalid={Boolean(error)} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteLead, setDeleteLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setLeads(await leadApi.list(search, statusFilter));
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeout);
  }, [search, statusFilter]);

  async function confirmDelete() {
    try {
      await leadApi.remove(deleteLead._id);
      setDeleteLead(null);
      await load();
    } catch (caught) {
      setError(caught.message);
    }
  }

  const counts = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter((lead) => lead.status === "Qualified").length
  }), [leads]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">LM</span><span>Lead Manager</span></div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Sales workspace</p>
            <h1>Leads</h1>
          </div>
          <button className="button primary" type="button" onClick={() => setModal(EMPTY_LEAD)}>+ Add lead</button>
        </header>

        <section className="content">
          <div className="summary">
            <div><span>Visible leads</span><strong>{counts.total}</strong></div>
            <div><span>Qualified</span><strong>{counts.qualified}</strong></div>
          </div>

          <div className="toolbar">
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or company…" aria-label="Search leads" />
            </label>
            <select className="filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          {error && <div className="alert">{error}</div>}
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Lead</th><th>Company</th><th>Source</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!loading && leads.length === 0 && (
                    <tr><td colSpan="5"><div className="empty"><strong>No leads found</strong><span>Try another search or add a new lead.</span></div></td></tr>
                  )}
                  {loading && <tr><td colSpan="5"><div className="empty">Loading leads…</div></td></tr>}
                  {!loading && leads.map((lead) => (
                    <tr key={lead._id}>
                      <td><div className="lead-name"><span className="avatar">{lead.name.charAt(0).toUpperCase()}</span><div><strong>{lead.name}</strong><span>{lead.email}</span></div></div></td>
                      <td><strong className="company">{lead.company}</strong><span className="phone">{lead.phone}</span></td>
                      <td>{lead.source}</td>
                      <td><span className={`status status-${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                      <td><div className="row-actions"><button type="button" onClick={() => setModal(lead)}>Edit</button><button className="delete" type="button" onClick={() => setDeleteLead(lead)}>Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {modal && <LeadModal lead={modal === EMPTY_LEAD ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {deleteLead && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <p className="eyebrow">Confirm delete</p>
            <h2 id="delete-title">Delete {deleteLead.name}?</h2>
            <p>This lead will be permanently removed.</p>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setDeleteLead(null)}>Cancel</button>
              <button className="button danger" type="button" onClick={confirmDelete}>Delete lead</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
