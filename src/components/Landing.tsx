import { Sparkles, LogIn, UserPlus, Briefcase, Search, Bookmark } from 'lucide-react';

interface LandingProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
}

function Landing({ onShowLogin, onShowSignup }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-4">
            Internship Finder
          </h1>
          <p className="text-2xl text-slate-600 mb-8">
            Discover your perfect internship opportunity
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Powered by AI-driven search, personalized recommendations, and real-time internship listings
            from top companies worldwide.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-20">
          <button
            onClick={onShowLogin}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
          >
            <LogIn className="w-6 h-6" />
            Log In
          </button>
          <button
            onClick={onShowSignup}
            className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl border-2 border-slate-200 text-lg"
          >
            <UserPlus className="w-6 h-6" />
            Sign Up
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Search</h3>
            <p className="text-slate-600">
              Find internships tailored to your skills, interests, and college year with our intelligent search engine.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Top Companies</h3>
            <p className="text-slate-600">
              Access internships from leading tech companies and startups, all in one place.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl mb-4">
              <Bookmark className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Save & Track</h3>
            <p className="text-slate-600">
              Bookmark opportunities and keep track of your applications all in one organized dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
