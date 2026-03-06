import { useState, useEffect, useContext } from 'react';
import { Search, SlidersHorizontal, Plus, Bell, X, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import IncidentCard from '../components/IncidentCard';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate true counts based on the fetched incidents list
  const activeIncidentCount = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING').length;

  const SystemHealth = ({ activeCount }) => {
    let healthStatus = "Optimal";
    let colorClass = "bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.8)]";
    let pingClass = "bg-green-400";
    
    if (activeCount >= 5) {
      healthStatus = "Critical";
      colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]";
      pingClass = "bg-red-500 animate-ping";
    } else if (activeCount >= 3) {
      healthStatus = "Degraded";
      colorClass = "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]";
      pingClass = "bg-orange-400 animate-ping";
    } else if (activeCount >= 1) {
      healthStatus = "Stable";
      colorClass = "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]";
      pingClass = "bg-yellow-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]";
    }

    return (
      <div className="flex items-center mt-2.5">
        <div className="relative w-1.5 h-1.5 mr-2 flex items-center justify-center">
          {activeCount > 0 && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${pingClass}`}></span>
          )}
          <div className={`relative w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
        </div>
        <span className="text-slate-400 text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase transition-colors duration-500">
          System Health: <span className={activeCount >= 5 ? "text-red-400" : activeCount >= 3 ? "text-orange-400" : activeCount >= 1 ? "text-yellow-400" : "text-green-400"}>{healthStatus}</span>
        </span>
      </div>
    );
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    severity: 'MEDIUM',
    description: ''
  });
  const [error, setError] = useState(null);

  // Calculate true counts based on the fetched incidents list
  const targetOpenCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length; 
  const targetActiveCount = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING').length;
  const targetDoneCount = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  // Animated state for counters
  const [openCount, setOpenCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    let startTime = null;
    const duration = 1500; // 1.5 seconds to match SVG transition loosely

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setOpenCount(Math.floor(easeProgress * targetOpenCount));
      setActiveCount(Math.floor(easeProgress * targetActiveCount));
      setDoneCount(Math.floor(easeProgress * targetDoneCount));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setOpenCount(targetOpenCount);
        setActiveCount(targetActiveCount);
        setDoneCount(targetDoneCount);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [loading, targetOpenCount, targetActiveCount, targetDoneCount]);

  // Max value reference for the scale rings 
  // limit exactly to 100 based on design goal.
  const ringMax = 100; 
  
  // Calculate SVG stroke offset based on percentage logic formula
  // circumference = 2 * PI * r (where r is 46 -> 289.026)
  const calculateOffset = (count) => {
    const percentage = Math.min(count / ringMax, 1);
    // 289.026 is the total circumference of the circle. We want to reveal a portion of it.
    return 289.026 * (1 - Math.max(percentage, 0.005));
  };

  const formatCount = (count) => {
    if (count === 0) return 0;
    return count < 10 ? `${count}` : count;
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await api.get('/incidents');
        setIncidents(response.data);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setIsCreating(true);
    
    try {
      await api.post('/incidents', formData);
      setIsModalOpen(false);
      setFormData({ title: '', severity: 'MEDIUM', description: '' });
      // Refresh incidents implicitly by re-fetching
      setLoading(true);
      const response = await api.get('/incidents');
      setIncidents(response.data);
    } catch (err) {
      console.error('Failed to create incident:', err);
      setError(err.response?.data?.message || 'Failed to create incident');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full relative h-full flex flex-col pt-2 md:pt-6 px-4 md:px-10">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center mb-6 md:mb-10">
        <div>
          <h1 className="text-3xl md:text-[34px] font-bold text-white tracking-tight font-sans">Incidents</h1>
          <SystemHealth activeCount={activeIncidentCount} />
        </div>
        
        {/* Top Right User Profile & Bell */}
        <div className="flex items-center space-x-3 md:space-x-4 pt-1 hover:cursor-pointer">
          <button className="relative p-2.5 rounded-full bg-[#162016] text-slate-300 hover:text-white transition border border-[#1a241a]">
            <Bell size={18} />
            <span className="absolute top-[9px] right-[11px] w-[5px] h-[5px] bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Profile (Hidden on mobile to match mockup) */}
          <div className="hidden md:flex items-center space-x-3 cursor-pointer group pl-1">
            <div className="w-10 h-10 rounded-full bg-[#162016] text-green-500 font-bold flex items-center justify-center border border-green-500/20">
              {user?.username ? user.username.substring(0,2).toUpperCase() : 'VI'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight group-hover:text-green-400 transition-colors">{user?.username || 'Viswanath'}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role || 'ENGINEER'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Circles Container */}
      <div className="flex justify-between mt-2 md:justify-start gap-3 md:gap-8 mb-8 md:mb-10 w-full px-1 mx-0">
        
        {/* Open Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[85px] h-[85px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradOpen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(34,197,94,0)" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#121a12" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradOpen)" strokeWidth="3.5" strokeDasharray="289.026" strokeDashoffset={calculateOffset(openCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[26px] md:text-[38px] font-semibold text-[#4ade80] leading-none mb-0 md:mb-1">{formatCount(openCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Open</span>
          </div>
        </div>

        {/* Active Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[85px] h-[85px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(34,197,94,0)" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#121a12" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradActive)" strokeWidth="3.5" strokeDasharray="289.026" strokeDashoffset={calculateOffset(activeCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[26px] md:text-[38px] font-semibold text-[#4ade80] leading-none mb-0 md:mb-1">{formatCount(activeCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active</span>
          </div>
        </div>

        {/* Done Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[85px] h-[85px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#121a12" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#4ade80" strokeWidth="4" strokeDasharray="289.026" strokeDashoffset={calculateOffset(doneCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[26px] md:text-[38px] font-semibold text-[#4ade80] leading-none mb-0 md:mb-1">{formatCount(doneCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Done</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="w-full md:w-[70%] flex flex-row gap-2.5 mb-5 px-1">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-4 py-2.5 bg-[#162016] border border-[#1a241a] rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#2a3a2a] transition text-xs font-semibold"
            placeholder="Search ID or Keyword"
          />
        </div>
        <button className="flex-shrink-0 w-10 h-10 bg-[#162016] border border-[#1a241a] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Pill Filters */}
      <div className="flex overflow-x-auto gap-2.5 pb-2 mb-4 no-scrollbar px-1">
        <button className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#4ade80] text-[#0a0f0a] font-bold text-[11px] shadow-[0_0_15px_rgba(74,222,128,0.2)] transition hover:bg-green-300">All incidents</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#1e271e]/60 border border-[#2a3a2a]/50 text-slate-400 hover:text-white transition font-semibold text-[11px]">Critical</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#1e271e]/60 border border-[#2a3a2a]/50 text-slate-400 hover:text-white transition font-semibold text-[11px]">Hardware</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#1e271e]/60 border border-[#2a3a2a]/50 text-slate-400 hover:text-white transition font-semibold text-[11px]">Security</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#1e271e]/60 border border-[#2a3a2a]/50 text-slate-400 hover:text-white transition font-semibold text-[11px]">Software</button>
      </div>

      {/* Incident Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-28 md:pb-8 mt-2">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-slate-500">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="col-span-full py-12 flex justify-center text-slate-500 border border-dashed border-[#2a3a2a] rounded-3xl mt-4">No active incidents found. Everything is calm.</div>
        ) : (
          incidents.map(incident => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 md:right-12 w-16 h-16 bg-[#4ade80] hover:bg-green-300 text-[#0a0f0a] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all hover:scale-110 z-50">
        <Plus size={36} strokeWidth={2.5} />
      </button>

      {/* Create Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121a12] border border-[#2a3a2a] rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#22c55e] to-[#4ade80]"></div>
            
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">New Incident</h2>
                  <p className="text-sm text-slate-400">Initialize a new War Room.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors bg-[#1a241a] p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateIncident} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Title</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., API Gateway Latency Spike"
                    className="w-full bg-[#162016] border border-[#2a3a2a] text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Severity Level</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full bg-[#162016] border border-[#2a3a2a] text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all appearance-none cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 Critical (P0)</option>
                    <option value="HIGH">🟠 High (P1)</option>
                    <option value="MEDIUM">🟡 Medium (P2)</option>
                    <option value="LOW">⚪ Low (P3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe symptoms or impact..."
                    className="w-full bg-[#162016] border border-[#2a3a2a] text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all placeholder-slate-600 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreating || !formData.title.trim()}
                    className="w-full py-4 rounded-xl bg-[#4ade80] hover:bg-[#22c55e] active:scale-[0.98] text-[#0a0f0a] font-bold text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4ade80]"
                  >
                    {isCreating ? 'Creating War Room...' : 'Declare Incident'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Hide scrollbar styles globally for the pill filter container */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
