import { useLocation, useNavigate, Link } from 'react-router-dom';
import ConfidenceBadge from '../components/ConfidenceBadge';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prediction = location.state?.prediction;

  // If no prediction data, redirect to upload
  if (!prediction) {
    return (
      <div className="page-container text-center">
        <div className="glass-card p-12 max-w-md mx-auto">
          <span className="text-5xl">🤔</span>
          <h2 className="text-xl font-bold text-slate-200 mt-4">No Result to Display</h2>
          <p className="text-slate-400 mt-2 mb-6">Upload a leaf image first to get a prediction.</p>
          <Link to="/upload" className="btn btn-primary">Go to Upload</Link>
        </div>
      </div>
    );
  }

  const speciesInfo = {
    'Guava': { emoji: '🍈', color: 'from-emerald-500 to-emerald-700', description: 'Tropical fruit tree with ovate leaves featuring prominent parallel veins, rich in nutrients.' },
    'Lemon': { emoji: '🍋', color: 'from-yellow-400 to-yellow-600', description: 'Citrus tree with elliptic leaves that emit a pleasant citrus scent when crushed, possessing antimicrobial qualities.' },
    'Lychee': { emoji: '🍒', color: 'from-rose-500 to-rose-700', description: 'Subtropical tree with glossy pinnate leaves and vibrant red fruit, known for rich floral aroma.' },
    'Mango': { emoji: '🥭', color: 'from-amber-500 to-amber-700', description: 'King of fruits — its elongated, glossy leaves are used in traditional rituals and have medicinal properties.' },
    'Olive': { emoji: '🫒', color: 'from-lime-600 to-emerald-800', description: 'Mediterranean evergreen with silvery-green lanceolate leaves, prized for its health-boosting antioxidants.' },
    'Jamun': { emoji: '🫐', color: 'from-purple-500 to-purple-700', description: 'Java Plum — its glossy, leathery leaves closely resemble Mango. The fruit is known for managing blood sugar.' },
    'Ashoka': { emoji: '🌳', color: 'from-green-500 to-green-700', description: 'Sacred tree of India with elegant elongated leaves, used extensively in Ayurvedic medicine.' },
    'Peepal': { emoji: '🌿', color: 'from-green-500 to-green-700', description: 'Sacred fig tree with heart-shaped leaves featuring a distinctive long tail tip.' },
    'Pomegranate': { emoji: '🍎', color: 'from-rose-500 to-rose-700', description: 'Ancient fruit tree with small, glossy, elongated leaves. Known for its antioxidant-rich fruit.' },
  };

  const info = speciesInfo[prediction.species] || { emoji: '🌿', color: 'from-emerald-500 to-emerald-700', description: '' };

  return (
    <div className="page-container">
      <div className="max-w-xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
            ✅ Identification Complete
          </div>
          <h1 className="page-title">Species Identified!</h1>
        </div>

        {/* Result Card */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Species Header */}
          <div className={`bg-gradient-to-r ${info.color} p-8 text-center`}>
            <span className="text-6xl block mb-3">{info.emoji}</span>
            <h2 className="text-3xl font-bold text-white">{prediction.species}</h2>
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            {/* Confidence */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Confidence</span>
              <ConfidenceBadge confidence={prediction.confidence} size="lg" />
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                style={{ width: `${prediction.confidence}%` }}
              ></div>
            </div>

            {/* Description */}
            {info.description && (
              <p className="text-sm text-slate-400 leading-relaxed">
                {info.description}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Analyzed at</span>
              <span className="text-slate-300">
                {new Date(prediction.timestamp).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Divider */}
            <hr className="border-slate-700/50" />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="btn btn-primary flex-1"
              >
                📸 Scan Another
              </button>
              <Link to="/history" className="btn btn-secondary flex-1">
                📋 View History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
