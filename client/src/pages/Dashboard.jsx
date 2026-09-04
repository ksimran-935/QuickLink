import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const PAGE_SIZE = 5;

// Truncates long URLs for display so the card layout doesn't break
const truncate = (str, n = 60) => (str.length > n ? str.slice(0, n) + "…" : str);

// Formats a date string into "Dec 31, 2025"
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const isExpired = (d) => d && new Date(d) < new Date();

const Dashboard = () => {
  // ── URL list state ──────────────────────────────────────────────────────────
  const [urls, setUrls] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  // ── Create form state ───────────────────────────────────────────────────────
  const [form, setForm] = useState({ longUrl: "", alias: "", expiresAt: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // ── Copy feedback ────────────────────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState(null);

  // ── Fetch URLs ───────────────────────────────────────────────────────────────
  const fetchUrls = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/urls", { params });
      setUrls(res.data.urls);
      setPagination(res.data.pagination);
    } catch (err) {
      setListError(err.response?.data?.message || "Failed to load URLs.");
    } finally {
      setListLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset to first page on new search
  };

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setCreating(true);
    try {
      const body = { longUrl: form.longUrl };
      if (form.alias.trim())    body.alias     = form.alias.trim();
      if (form.expiresAt)       body.expiresAt = form.expiresAt;

      const res = await api.post("/urls", body);
      setForm({ longUrl: "", alias: "", expiresAt: "" });
      setFormSuccess(`Created: ${res.data.shortUrl}`);
      setPage(1);
      setSearch("");
      fetchUrls();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create URL.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this short URL permanently?")) return;
    try {
      await api.delete(`/urls/${id}`);
      // If we deleted the only item on this page, go back one page
      if (urls.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchUrls();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleCopy = (shortUrl, id) => {
    // navigator.clipboard requires HTTPS. Fall back to execCommand for localhost.
    const tryClipboard = navigator.clipboard
      ? navigator.clipboard.writeText(shortUrl)
      : Promise.reject(new Error("clipboard API unavailable"));

    tryClipboard.catch(() => {
      const el = document.createElement("textarea");
      el.value = shortUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }).finally(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Today for date input min ──────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="page-container">

      {/* ── Create URL Form ──────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="card-title">Shorten a URL</h2>
        <form onSubmit={handleCreate} className="create-form">
          <div className="field">
            <label htmlFor="longUrl">Destination URL</label>
            <input
              id="longUrl"
              name="longUrl"
              type="url"
              required
              placeholder="https://example.com/very/long/path"
              value={form.longUrl}
              onChange={handleFormChange}
              className="input"
            />
          </div>

          <div className="create-row">
            <div className="field">
              <label htmlFor="alias">Custom alias <span className="optional">(optional)</span></label>
              <input
                id="alias"
                name="alias"
                type="text"
                placeholder="my-link"
                value={form.alias}
                onChange={handleFormChange}
                className="input"
              />
            </div>
            <div className="field">
              <label htmlFor="expiresAt">Expires on <span className="optional">(optional)</span></label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="date"
                min={today}
                value={form.expiresAt}
                onChange={handleFormChange}
                className="input"
              />
            </div>
            <div className="field field-submit">
              <label>&nbsp;</label>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? "Shortening…" : "Shorten URL"}
              </button>
            </div>
          </div>

          {formError   && <p className="error-text">{formError}</p>}
          {formSuccess && <p className="success-text">{formSuccess}</p>}
        </form>
      </section>

      {/* ── URL List ──────────────────────────────────────────────────────────── */}
      <section className="card">
        <div className="list-header">
          <h2 className="card-title">Your links</h2>
          <input
            type="search"
            placeholder="Search by URL or code…"
            value={search}
            onChange={handleSearchChange}
            className="input search-input"
          />
        </div>

        {listLoading && <p className="muted center">Loading…</p>}
        {listError   && <p className="error-text">{listError}</p>}

        {!listLoading && urls.length === 0 && (
          <p className="muted center">
            {search ? "No links match your search." : "You haven't created any links yet."}
          </p>
        )}

        <ul className="url-list">
          {urls.map((url) => {
            const expired = isExpired(url.expiresAt);
            return (
              <li key={url.id} className={`url-item ${expired ? "url-item--expired" : ""}`}>

                <div className="url-main">
                  <div className="url-top">
                    <a
                      href={url.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="short-link"
                    >
                      {url.shortUrl}
                    </a>

                    {url.expiresAt && (
                      <span className={`badge ${expired ? "badge--red" : "badge--green"}`}>
                        {expired ? "Expired" : `Exp. ${fmtDate(url.expiresAt)}`}
                      </span>
                    )}
                  </div>

                  <p className="long-url" title={url.longUrl}>
                    {truncate(url.longUrl)}
                  </p>

                  <div className="url-meta">
                    <span className="meta-chip">
                      <span className="meta-icon">↗</span>
                      {url.clicks} {url.clicks === 1 ? "click" : "clicks"}
                    </span>
                    <span className="meta-sep">·</span>
                    <span className="meta-muted">Created {fmtDate(url.createdAt)}</span>
                  </div>
                </div>

                <div className="url-actions">
                  <button
                    className={`btn btn-sm ${copiedId === url.id ? "btn-success" : "btn-outline"}`}
                    onClick={() => handleCopy(url.shortUrl, url.id)}
                  >
                    {copiedId === url.id ? "✓ Copied" : "Copy"}
                  </button>
                  <Link to={`/analytics/${url.id}`} className="btn btn-sm btn-outline">
                    Analytics
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(url.id)}
                  >
                    Delete
                  </button>
                </div>

              </li>
            );
          })}
        </ul>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages}
              <span className="muted"> ({pagination.total} total)</span>
            </span>
            <button
              className="btn btn-sm btn-outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </section>

    </div>
  );
};

export default Dashboard;
