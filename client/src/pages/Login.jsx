import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, MessageSquare, FileText, Activity, CheckCircle2, Zap } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'Select a role'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (formData.role === 'Select a role') {
        setError('Please select a role');
        setLoading(false);
        return;
      }

      if (isSignup) {
        await register(formData.email, formData.username, formData.password, formData.role);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isSignup ? 'register' : 'login'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] lg:min-h-screen bg-[#000000] flex font-sans text-white relative overflow-hidden w-full">
      
      {/* Left Panel - Hidden on Mobile, Shown on Desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-20 relative overflow-hidden z-10 border-r border-[#18181b]">
        <div className="absolute inset-0 z-0">
          <img src="/auth_bg.png" alt="Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-between pt-4">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <ShieldAlert className="h-7 w-7 text-indigo-500" />
              <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">Incident-Zero</span>
            </div>

            <h1 className="text-[3.5rem] leading-[1.1] font-bold tracking-tight mb-4 text-white drop-shadow-lg">
              Command your incidents,<br />
              Heighten your reliability.
            </h1>

            <p className="text-zinc-300 text-lg mt-8 max-w-md leading-relaxed font-medium drop-shadow">
              Welcome to the Operations Control Center. Join us to transform your chaotic outages into organized, actionable resolutions automatically.
            </p>

            <div className="mt-12 space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-zinc-700/50 shadow-lg">
                  <MessageSquare className="w-5 h-5 text-zinc-200" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-wide drop-shadow-md">Real-time War Rooms</h3>
                  <p className="text-zinc-400 text-sm mt-1 font-medium">Synced chat, timelines, and command execution.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-zinc-700/50 shadow-lg">
                  <FileText className="w-5 h-5 text-zinc-200" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-wide drop-shadow-md">AI Powered Post Incident Report</h3>
                  <p className="text-zinc-400 text-sm mt-1 font-medium">Extract action items and key takeaways instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Screenshot Matching Style) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-start pt-[12vh] lg:justify-center lg:pt-0 items-center px-6 sm:px-12 relative z-10 bg-[#000000] h-full overflow-hidden">
        
        <div className="w-full max-w-[22rem] mx-auto relative z-10 bg-[#000000]">
          
          <div className="mb-8 lg:mb-12 flex flex-col items-center">
            <div className={`flex items-center gap-2 mb-10`}>
              <ShieldAlert className="h-6 w-6 text-white" strokeWidth={1.5} />
              <span className="text-[1.25rem] font-medium tracking-wide text-white">Incident-Zero</span>
            </div>
            <h2 className={`text-[2rem] font-semibold text-white tracking-tight`}>
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-500 p-3.5 rounded-lg text-sm flex items-center gap-3 font-medium">
                <Activity className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="relative border-b border-zinc-700 focus-within:border-zinc-400 transition-colors pb-1">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 px-0 py-1 text-[15px]"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {isSignup && (
                <div className="relative border-b border-zinc-700 focus-within:border-zinc-400 transition-colors pb-1">
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 px-0 py-1 text-[15px] transition-colors"
                    placeholder="engineer_01"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="relative border-b border-zinc-700 focus-within:border-zinc-400 transition-colors pb-1">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 px-0 py-1 pr-12 text-[15px] font-mono tracking-widest"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button"
                  className="absolute right-0 bottom-2 text-[10px] text-zinc-400 hover:text-white transition-colors tracking-wide font-medium bg-transparent border-none outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  SHOW
                </button>
              </div>

              <div className="relative border-b border-zinc-700 focus-within:border-zinc-400 transition-colors pb-1">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Role</label>
                <select
                  name="role"
                  required
                  className="w-full bg-transparent border-0 text-zinc-200 focus:outline-none focus:ring-0 px-0 py-1 text-[15px] appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Select a role" className="bg-zinc-900" disabled>Select a role</option>
                  <option value="ENGINEER" className="bg-zinc-900">Engineer</option>
                  <option value="MANAGER" className="bg-zinc-900">Manager</option>
                </select>
              </div>
            </div>
            
            {!isSignup && (
              <div className="flex justify-start pt-2">
                <Link to="#" className="text-[13px] text-zinc-300 hover:text-white transition-colors">
                   Forgot password?
                </Link>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-[14px] px-4 rounded-[1.5rem] text-black bg-[#f1f5f9] hover:bg-white focus:outline-none font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
            </div>
            
            <div className="mt-4 sm:mt-5 text-center text-[13px] text-zinc-400">
              {isSignup ? "Already have an account?" : "New to Incident-Zero?"}
              <button
                type="button"
                className="ml-1.5 font-medium text-white hover:text-zinc-200 transition-colors"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}
              >
                {isSignup ? "Sign in" : "Create an account"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
