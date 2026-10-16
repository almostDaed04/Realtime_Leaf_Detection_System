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
    { name: 'Guava', emoji: '🍈', color: 'from-emerald-500/20 to-emerald-600/10' },
    { name: 'Lemon', emoji: '🍋', color: 'from-yellow-500/20 to-yellow-600/10' },
    { name: 'Lychee', emoji: '🍒', color: 'from-rose-500/20 to-rose-600/10' },
    { name: 'Mango', emoji: '🥭', color: 'from-amber-500/20 to-amber-600/10' },
    { name: 'Olive', emoji: '🫒', color: 'from-lime-500/20 to-lime-600/10' },
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
                Leaf Identification
              </span>
              <br />
              <span className="text-slate-200">System</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Upload a leaf image and our AI instantly detects and classifies it among
              5 common plant species. Fast, accurate, and privacy-focused.
            </p>

            <div className="home-hero-actions mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-4">
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

            {/* Academic Project Credits Banner */}
            <div className="project-credits-card p-5 rounded-2xl max-w-2xl mx-auto text-left" style={{ marginTop: '3.5rem' }}>
              <div className="project-credits-grid text-xs sm:text-sm">
                {/* 1. Team Members (Students First) */}
                <div>
                  <span className="credits-label text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase block mb-2">
                    Project Team
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="credits-chip flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg">
                      <span className="credits-name font-medium text-xs">Shashank Gupta</span>
                      <span className="credits-roll font-mono text-[11px] px-2 py-0.5 rounded">241IT073</span>
                    </div>
                    <div className="credits-chip flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg">
                      <span className="credits-name font-medium text-xs">Manashvi Prajapati</span>
                      <span className="credits-roll font-mono text-[11px] px-2 py-0.5 rounded">241IT042</span>
                    </div>
                    <div className="credits-chip flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg">
                      <span className="credits-name font-medium text-xs">Maitreya Kulkarni</span>
                      <span className="credits-roll font-mono text-[11px] px-2 py-0.5 rounded">241IT041</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider (Desktop/Tablet) */}
                <div className="hidden sm:block w-px self-stretch credits-divider"></div>

                {/* Horizontal Divider (Mobile only) */}
                <div className="block sm:hidden w-full h-px credits-divider my-1"></div>

                {/* 2. Faculty Mentor (Professor Second) */}
                <div className="flex items-center gap-3.5 sm:justify-center">
                  <div className="credits-icon-box w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm">
                    🎓
                  </div>
                  <div>
                    <span className="credits-label text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase block">
                      Under the Guidance of
                    </span>
                    <span className="credits-mentor font-bold text-sm sm:text-base block">
                      Prof. Jaidhar C.D.
                    </span>
                    <span className="credits-sub text-[11px] block">Faculty Guide & Mentor</span>
                  </div>
                </div>
              </div>
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
          <p className="text-slate-400 font-medium">🍃 LeafScan — Leaf Identification System</p>
          <p className="mt-2 text-xs">Copyright &copy; {new Date().getFullYear()} LeafScan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
