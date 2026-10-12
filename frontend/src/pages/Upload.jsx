import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ImageUploader from '../components/ImageUploader';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30s for AI inference
      });

      // Navigate to result page with prediction data
      navigate('/result', { state: { prediction: response.data.prediction } });
    } catch (err) {
      const message = err.response?.data?.error
        || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="page-title">Upload Leaf Image</h1>
          <p className="page-subtitle">
            Take a clear photo of a single leaf and let our AI identify the species
          </p>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          {/* Strict Requirement Notice (Red Note) */}
          <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm flex items-start gap-3 shadow-lg">
            <span className="text-xl leading-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <strong className="text-red-100 block font-semibold mb-1 text-sm sm:text-base">
                Strict Upload Requirements:
              </strong>
              <ul className="space-y-1.5 text-red-200/90 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span><strong>Single Leaf Only:</strong> Upload an image containing exactly one leaf. Images with multiple leaves will be rejected.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span><strong>Exact Resolution:</strong> The image must be exactly <strong>640 × 640 pixels</strong>. Images with other dimensions will be rejected.</span>
                </li>
              </ul>
            </div>
          </div>

          <ImageUploader onFileSelect={setFile} disabled={loading} />

          {error && (
            <div className="alert alert-error animate-fade-in p-4 rounded-xl border border-red-500/50 bg-red-950/40 text-red-300 flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">❌</span>
              <div>
                <strong className="block font-semibold text-red-200 text-sm">Upload Rejected:</strong>
                <span className="text-xs sm:text-sm">{error}</span>
              </div>
            </div>
          )}

          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <span className="spinner"></span>
                  <span>Analyzing leaf...</span>
                </div>
              ) : (
                <>🔬 Identify Species</>
              )}
            </button>
          )}

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">📌 Tips for best results</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                Image dimensions must be exactly <strong>640 × 640 px</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                Use a clear, well-lit photo of a single leaf against a plain background
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                Supported formats: JPEG, PNG (max 5MB)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 font-bold">!</span>
                <span className="text-red-300">Only one leaf per image — multiple leaves will be rejected</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
