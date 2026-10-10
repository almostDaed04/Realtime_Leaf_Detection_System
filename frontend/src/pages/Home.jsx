import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: '📸',
      title: 'Upload Leaf Image',
      description: 'Simply upload a clear photo of a single leaf in JPEG or PNG format.',
    },
    {
      icon: '🔍',
      title: 'AI Detection',
      description: 'YOLOv8 detects and isolates the leaf from the background automatically.',
    },
    {
      icon: '🧬',
      title: 'Species Classification',
      description: 'Our CNN model identifies the species with high confidence.',
    },
    {
      icon: '📊',
      title: 'Track History',
      description: 'View all your past predictions with thumbnails and confidence scores.',
    },
  ];

  const species = [
    { name: 'Mango', emoji: '🥭', color: 'from-amber-500/20 to-amber-600/10' },
    { name: 'Guava', emoji: '🍈', color: 'from-emerald-500/20 to-emerald-600/10' },
    { name: 'Apple', emoji: '🍎', color: 'from-red-500/20 to-red-600/10' },
    { name: 'Cherry', emoji: '🍒', color: 'from-rose-500/20 to-rose-600/10' },
    { name: 'Peach', emoji: '🍑', color: 'from-orange-500/20 to-orange-600/10' },
  ];

  return (
    <div className="min-h-screen relative home-page">

      {/* Hero Section */}
      <section className="relative overflow-hidden home-hero">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 home-hero-inner">
          <div className="animate-slide-up home-hero-copy">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              🍃 AI-Powered Plant Identification
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mt-4">
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-amber-400 bg-clip-text text-transparent">
                Identify Leaves
              </span>
              <br />
              <span className="text-slate-200">in Seconds</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
              Upload a leaf image and our AI instantly detects and classifies it among
              5 common plant species. Fast, accurate, and privacy-focused.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/upload" className="btn btn-primary text-lg py-3 px-8">
                  🔬 Start Scanning
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary text-lg py-3 px-8">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-secondary text-lg py-3 px-8">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-visual-glow" />
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <div className="home-leaf" />
            <div className="home-scan-line" />
            <div className="home-detection-tag"><span /> MODEL PREVIEW <b>5 SPECIES</b></div>
            <div className="home-visual-caption"><span>LEAFSCAN / AI</span><strong>Species recognition</strong><small>YOLOv8 detection + CNN classification</small></div>
            <div className="home-coordinate">UPLOAD / DETECT / IDENTIFY</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 home-steps">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-200">How It Works</h2>
          <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto">
            Four simple steps from upload to identification
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 text-center home-step-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-slate-200 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
                <div className="mt-3 text-emerald-500 font-bold text-lg opacity-20">
                  0{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Species */}
      <section className="py-20 px-4 border-t border-slate-800 home-species">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-200">Supported Species</h2>
          <p className="text-center text-slate-400 mb-12">
            Our AI model can identify these 5 common plant species
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {species.map((s) => (
              <div
                key={s.name}
                className={`
                  glass-card p-5 text-center home-species-card
                  bg-gradient-to-br ${s.color}
                `}
              >
                <span className="text-3xl block mb-2">{s.emoji}</span>
                <span className="text-sm font-medium text-slate-200">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto glass-card p-12 text-center home-cta">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">Ready to Identify Leaves?</h2>
            <p className="text-slate-400 mb-8">
              Create a free account and start classifying plant species in seconds.
            </p>
            <Link to="/signup" className="btn btn-primary text-lg py-3 px-8">
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p>🍃 LeafScan — Real-Time Leaf Detection System</p>
          <p className="mt-1">Built with React, Express, FastAPI, YOLOv8 & PyTorch</p>
          <p className="mt-4">Copyright &copy; {new Date().getFullYear()} LeafScan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
