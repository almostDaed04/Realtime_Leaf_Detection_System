import { useState, useEffect } from 'react';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * HistoryCard — Displays a single prediction result with thumbnail.
 */
const HistoryCard = ({ prediction }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    let activeUrl = null;
    // Load thumbnail from the dedicated endpoint
    const loadThumbnail = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/history/${prediction._id}/thumbnail`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          activeUrl = url;
          setThumbnailUrl(url);
        } else {
          setThumbnailError(true);
        }
      } catch {
        setThumbnailError(true);
      }
    };

    loadThumbnail();

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [prediction._id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Species emoji map
  const speciesEmoji = {
    'Lemon': '🍋',
    'Lychee': '🍒',
    'Mango': '🥭',
    'Olive': '🫒',
    'Guava': '🍈',
    'Jamun': '🫐',
    'Ashoka': '🌳',
    'Pomegranate': '🍎',
  };

  return (
    <div className="glass-card history-card animate-fade-in">
      {/* Thumbnail */}
      <div className="aspect-square bg-slate-800 flex items-center justify-center history-thumb">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${prediction.species} leaf`}
            className="w-full h-full object-cover"
          />
        ) : thumbnailError ? (
          <span className="text-4xl opacity-30">🍂</span>
        ) : (
          <div className="spinner"></div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2 history-card-info">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span>{speciesEmoji[prediction.species] || '🌿'}</span>
            {prediction.species}
          </h3>
          <ConfidenceBadge confidence={prediction.confidenceScore} size="sm" />
        </div>
        <p className="text-xs text-slate-400">
          {formatDate(prediction.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default HistoryCard;
