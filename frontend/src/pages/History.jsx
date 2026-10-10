import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import HistoryCard from '../components/HistoryCard';
import PaginationControl from '../components/PaginationControl';

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/history?page=${page}&limit=12`);
      setPredictions(response.data.predictions);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePageChange = (page) => {
    fetchHistory(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadReport = async () => {
    try {
      const response = await api.get('/history/report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leafscan_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  return (
    <div className="page-container history-page">
      <div className="history-heading animate-slide-up">
        <div>
          <span className="history-eyebrow"><span /> YOUR ACTIVITY</span>
          <h1 className="page-title">Prediction history</h1>
        <p className="page-subtitle">
          {pagination.total > 0
            ? `${pagination.total} prediction${pagination.total === 1 ? '' : 's'} found`
            : 'Your past predictions will appear here'}
          </p>
        </div>
        {!loading && predictions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="history-count"><strong>{pagination.total}</strong><span>total scans</span></div>
            <button onClick={downloadReport} className="btn btn-secondary text-sm px-4 py-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download Report
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : predictions.length === 0 ? (
        <div className="glass-card history-empty animate-fade-in">
          <span className="text-5xl">🍂</span>
          <h2>No predictions yet</h2>
          <p className="text-slate-400 mt-2 mb-6">Upload your first leaf image to get started.</p>
          <Link to="/upload" className="btn btn-primary">📸 Upload Image</Link>
        </div>
      ) : (
        <>
          <div className="history-grid">
            {predictions.map((prediction) => (
              <HistoryCard key={prediction._id} prediction={prediction} />
            ))}
          </div>

          <PaginationControl
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default History;
