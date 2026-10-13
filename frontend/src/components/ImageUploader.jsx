import { useState, useRef } from 'react';

/**
 * ImageUploader — Drag-and-drop image upload with preview.
 * Validates file type (JPEG/PNG) and size (5MB max) client-side.
 */
const ImageUploader = ({ onFileSelect, disabled }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Only JPEG and PNG images are allowed.');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 5MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = (file) => {
    if (!validateFile(file)) return;

    // Confirm the browser can decode the image; the backend resizes it for analysis.
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setError('');
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      onFileSelect(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to inspect image dimensions. Please select a valid JPEG or PNG file.');
      setPreview(null);
      onFileSelect(null);
    };
    img.src = objectUrl;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError('');
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {preview ? (
        /* Preview Mode */
        <div className="relative glass-card p-4 animate-fade-in">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full max-h-80 object-contain rounded-lg"
          />
          <button
            onClick={clearPreview}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Drop Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-out
            ${dragActive
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
              : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
              transition-all duration-300
              ${dragActive ? 'bg-emerald-500/20 scale-110' : 'bg-slate-700/50'}
            `}>
              📸
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-200">
                {dragActive ? 'Drop your image here' : 'Drag & drop a leaf image'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                click to browse • JPEG or PNG • Max 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-3 animate-fade-in">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
