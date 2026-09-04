import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const fmtDate  = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const fmtTime  = (d) => new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
const truncate = (str, n = 50) => (str.length > n ? str.slice(0, n) + "…" : str);

const Analytics = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/urls/${id}/analytics`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <p className="muted center">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Link to="/" className="back-link">← Back to dashboard</Link>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  const expired = data.expiresAt && new Date(data.expiresAt) < new Date();

  return (
    <div className="page-container">
      <Link to="/" className="back-link">← Back to dashboard</Link>

      {/* ── Summary card ──────────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="card-title">Analytics</h2>

        <div className="analytics-layout">
          {/* Stat */}
          <div className="stat-box">
            <span className="stat-number">{data.totalClicks}</span>
            <span className="stat-label">Total clicks</span>
          </div>

          {/* Info */}
          <div className="analytics-info">
            <div className="info-row">
              <span className="info-key">Short URL</span>
              <a
                href={data.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="info-link"
              >
                {data.shortUrl}
              </a>
            </div>
            <div className="info-row">
              <span className="info-key">Destination</span>
              <span className="info-val muted" title={data.longUrl}>
                {truncate(data.longUrl, 70)}
              </span>
            </div>
            {data.expiresAt && (
              <div className="info-row">
                <span className="info-key">Expiry</span>
                <span className={`badge ${expired ? "badge--red" : "badge--green"}`}>
                  {expired ? "Expired" : fmtDate(data.expiresAt)}
                </span>
              </div>
            )}
            <div className="info-row">
              <span className="info-key">Created</span>
              <span className="info-val muted">{fmtDate(data.createdAt)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent clicks table ────────────────────────────────────────────────── */}
      <section className="card">
        <h3 className="card-title">Recent clicks <span className="muted">(last 20)</span></h3>

        {data.recentClicks.length === 0 ? (
          <p className="muted center">No clicks recorded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Referrer</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {data.recentClicks.map((click, i) => (
                  <tr key={i}>
                    <td className="td-time">{fmtTime(click.timestamp)}</td>
                    <td>{click.referrer}</td>
                    <td className="td-ua" title={click.userAgent}>
                      {truncate(click.userAgent, 55)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
