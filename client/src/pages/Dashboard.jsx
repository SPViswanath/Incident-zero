import { useState, useEffect, useContext } from 'react';
import { Search, SlidersHorizontal, Plus, Bell, X, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import IncidentCard from '../components/IncidentCard';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate true counts based on the fetched incidents list
  const activeIncidentCount = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING').length;

  const SystemHealth = ({ activeCount }) => {
    let healthStatus = "Optimal";
    let colorClass = "bg-zinc-300 shadow-[0_0_6px_rgba(255,255,255,0.8)]";
    let pingClass = "bg-white";
    
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
          System Health: <span className={activeCount >= 5 ? "text-red-400" : activeCount >= 3 ? "text-orange-400" : activeCount >= 1 ? "text-yellow-400" : "text-white"}>{healthStatus}</span>
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
    category: 'SOFTWARE',
    description: ''
  });
  const [error, setError] = useState(null);
  
  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      setFormData({ title: '', severity: 'MEDIUM', category: 'SOFTWARE', description: '' });
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

  // Add activeFilter state
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Filter incidents based on selected pill
  const filteredIncidents = incidents.filter(incident => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return incident.severity === 'CRITICAL';
    if (activeFilter === 'Hardware') return incident.category === 'HARDWARE';
    if (activeFilter === 'Security') return incident.category === 'SECURITY';
    if (activeFilter === 'Software') return incident.category === 'SOFTWARE';
    return true;
  });

  return (
    <div className="w-full relative h-full flex flex-col pt-2 md:pt-6 px-4 md:px-10">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-[34px] font-bold text-white tracking-tight font-sans">Incidents</h1>
          <SystemHealth activeCount={activeIncidentCount} />
        </div>
        
        {/* Top Right User Profile & Bell */}
        <div className="flex items-center space-x-3 md:space-x-4 pt-1 hover:cursor-pointer">
          <button className="relative p-2.5 rounded-full bg-[#18181b] text-slate-300 hover:text-white transition border border-[#27272a]">
            <Bell size={18} />
            <span className="absolute top-[9px] right-[11px] w-[5px] h-[5px] bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Profile Dropdown */}
          <div className="relative">
            <div 
              className="flex items-center space-x-3 cursor-pointer group pl-1"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-10 h-10 rounded-full bg-[#18181b] text-zinc-300 font-bold flex items-center justify-center border border-white/20 hover:border-zinc-500 transition-colors">
                {user?.username ? user.username.substring(0,2).toUpperCase() : 'VI'}
              </div>
            </div>
            
            {/* Transparent overlay for outside click */}
            {isProfileOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              ></div>
            )}
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 md:w-64 bg-[#000000] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/40">
                  <p className="text-base font-bold text-white truncate">{user?.username || 'Viswanath'}</p>
                  <p className="text-[12px] md:text-[13px] text-slate-400 font-medium tracking-wide mt-1 truncate capitalize">
                    {user?.role ? user.role.toLowerCase() : 'Unknown Role'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-5 py-3.5 text-sm md:text-base text-red-500 font-bold hover:bg-red-950/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Circles Container */}
      <div className="flex justify-between mt-2 md:justify-start gap-2 md:gap-8 mb-6 md:mb-10 w-full px-1 mx-0">
        
        {/* Open Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[70px] h-[70px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradOpen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#09090b" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradOpen)" strokeWidth="3.5" strokeDasharray="289.026" strokeDashoffset={calculateOffset(openCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[22px] md:text-[38px] font-semibold text-[#ffffff] leading-none mb-0 md:mb-1">{formatCount(openCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Open</span>
          </div>
        </div>

        {/* Active Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[70px] h-[70px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#09090b" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradActive)" strokeWidth="3.5" strokeDasharray="289.026" strokeDashoffset={calculateOffset(activeCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[22px] md:text-[38px] font-semibold text-[#ffffff] leading-none mb-0 md:mb-1">{formatCount(activeCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active</span>
          </div>
        </div>

        {/* Done Circle SVG Arc */}
        <div className="relative flex flex-col items-center justify-center w-[70px] h-[70px] md:w-[120px] md:h-[120px] flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#09090b" strokeWidth="2" />
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#ffffff" strokeWidth="4" strokeDasharray="289.026" strokeDashoffset={calculateOffset(doneCount)} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[22px] md:text-[38px] font-semibold text-[#ffffff] leading-none mb-0 md:mb-1">{formatCount(doneCount)}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Done</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="w-full md:w-[70%] flex flex-row gap-2.5 mb-5 px-1 bg-black/40 backdrop-blur-md pb-4 pt-2 -mx-1 px-2 border-b border-zinc-900 rounded-b-xl">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-8 pr-4 py-2 bg-transparent border-0 border-b border-zinc-800 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-0 transition text-sm font-medium"
            placeholder="Search ID or Keyword"
          />
        </div>
        <button className="flex-shrink-0 w-9 h-9 border-0 border-b border-zinc-800 bg-transparent flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-400 transition">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Pill Filters */}
      <div className="flex overflow-x-auto gap-2.5 pb-2 mb-4 no-scrollbar px-1">
        <button onClick={() => setActiveFilter('All')} className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-[11px] transition ${activeFilter === 'All' ? 'bg-[#ffffff] text-[#000000] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1e271e]/60 border border-[#3f3f46]/50 text-slate-400 hover:text-white'}`}>All incidents</button>
        <button onClick={() => setActiveFilter('Hardware')} className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold text-[11px] transition ${activeFilter === 'Hardware' ? 'bg-[#ffffff] text-[#000000] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1e271e]/60 border border-[#3f3f46]/50 text-slate-400 hover:text-white'}`}>Hardware</button>
        <button onClick={() => setActiveFilter('Security')} className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold text-[11px] transition ${activeFilter === 'Security' ? 'bg-[#ffffff] text-[#000000] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1e271e]/60 border border-[#3f3f46]/50 text-slate-400 hover:text-white'}`}>Security</button>
        <button onClick={() => setActiveFilter('Software')} className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold text-[11px] transition ${activeFilter === 'Software' ? 'bg-[#ffffff] text-[#000000] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1e271e]/60 border border-[#3f3f46]/50 text-slate-400 hover:text-white'}`}>Software</button>
      </div>

      {/* Incident Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-28 md:pb-8 mt-4 xl:mt-2">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-slate-500 w-full">Loading incidents...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="col-span-full py-12 flex justify-center text-slate-500 border border-dashed border-[#3f3f46] rounded-3xl mt-4 w-full">No incidents found for this filter.</div>
        ) : (
          filteredIncidents.map(incident => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 md:right-12 w-12 h-12 md:w-16 md:h-16 bg-[#ffffff] hover:bg-zinc-300 text-[#000000] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all hover:scale-110 z-50">
        <Plus className="w-6 h-6 md:w-9 md:h-9" strokeWidth={2.5} />
      </button>

      {/* Create Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#000000] border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 md:p-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">New Incident</h2>
                  <p className="text-sm text-zinc-500">Initialize a new War Room.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors p-2"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 bg-red-950/40 border border-red-900/60 text-red-400 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateIncident} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., API Gateway Latency Spike"
                    className="w-full bg-transparent border-0 border-b border-zinc-800 text-zinc-300 px-0 py-2 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-all font-medium text-sm placeholder-zinc-700"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Severity Level</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                      className="w-full bg-transparent border-0 border-b border-zinc-800 text-zinc-300 px-0 py-2 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-all font-medium text-sm appearance-none cursor-pointer"
                    >
                      <option value="CRITICAL" className="bg-zinc-900">🔴 Critical (P0)</option>
                      <option value="HIGH" className="bg-zinc-900">🟠 High (P1)</option>
                      <option value="MEDIUM" className="bg-zinc-900">🟡 Medium (P2)</option>
                      <option value="LOW" className="bg-zinc-900">⚪ Low (P3)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-transparent border-0 border-b border-zinc-800 text-zinc-300 px-0 py-2 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-all font-medium text-sm appearance-none cursor-pointer"
                    >
                      <option value="SOFTWARE" className="bg-zinc-900">💻 Software</option>
                      <option value="HARDWARE" className="bg-zinc-900">🖥️ Hardware</option>
                      <option value="SECURITY" className="bg-zinc-900">🔒 Security</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe symptoms or impact..."
                    className="w-full bg-transparent border-0 border-b border-zinc-800 text-zinc-300 px-0 py-2 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-all font-medium text-sm placeholder-zinc-700 resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isCreating || !formData.title.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-200 hover:bg-white active:scale-[0.98] text-black font-bold text-sm transition-all disabled:opacity-50 flex justify-center items-center"
                  >
                    {isCreating ? 'Creating War Room...' : 'Declare Incident →'}
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
