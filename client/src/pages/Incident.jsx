import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { 
  Send, Wrench, Scale, AlertCircle, FileText, ChevronLeft, 
  Activity, CheckCircle, ShieldAlert, Clock, Sparkles, 
  Video, Share2, Paperclip, Bell, AlignLeft
} from 'lucide-react';

export default function Incident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [timeline, setTimeline] = useState([]);
  
  const [messageInput, setMessageInput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryReport, setSummaryReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timelineEndRef = useRef(null);

  // Auto-scroll logic
  const scrollToBottom = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  useEffect(() => {
    scrollToBottom(timelineEndRef);
  }, [timeline]);

  // Initial Data Fetch & Socket Connection
  useEffect(() => {
    const fetchIncidentData = async () => {
      try {
        const [incRes, msgRes, tlRes] = await Promise.all([
          api.get(`/incidents/${id}`),
          api.get(`/messages/${id}`),
          api.get(`/incidents/${id}/timeline`)
        ]);
        
        setIncident(incRes.data);
        setMessages(msgRes.data);
        setTimeline(tlRes.data);
      } catch (err) {
        console.error("Failed to load incident data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentData();

    // Socket Connection
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
    socketRef.current = io(baseURL);

    if (user?.id) {
      socketRef.current.emit('join-incident', { incidentId: id, userId: user.id });
    }

    socketRef.current.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.isTimelineEvent) {
        setTimeline((prev) => [...prev, msg]);
      }
    });

    return () => {
      if (user?.id) {
        socketRef.current.emit('leave-incident', { incidentId: id, userId: user.id });
      }
      socketRef.current.disconnect();
    };
  }, [id, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socketRef.current.emit('send-message', {
      incidentId: id,
      userId: user.id,
      content: messageInput
    });

    setMessageInput('');
  };

  const handleQuickAction = (command) => {
    setMessageInput(command + ' ');
  };

  const handleExportReport = async () => {
    setIsSummarizing(true);
    try {
      const res = await api.get(`/incidents/${id}/summary`);
      setSummaryReport(res.data);
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Duration Helper for Mockup Top Bar
  const getDuration = (start) => {
    const diff = new Date() - new Date(start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 bg-[#0a0f0a]">
        <Activity className="animate-spin mr-3 text-[#4ade80]" /> Loading Room...
      </div>
    );
  }

  if (!incident) return <div className="p-10 text-red-500 bg-[#0a0f0a] h-full">Incident not found.</div>;

  // --- MESSAGE FORMATTING to match exact mockup colors ---
  const getMessageFormat = (msg) => {
    if (!msg.isTimelineEvent) {
      return {
        bg: 'bg-[#162016]/80',
        border: 'border-[#1a241a]',
        text: 'text-slate-300',
        isAction: false
      };
    }
    switch (msg.eventCategory) {
      case 'OBSERVATION':
        return {
          bg: 'bg-transparent',
          border: 'border-yellow-500/50',
          text: 'text-slate-300',
          isAction: true,
          timelineIcon: <AlertCircle size={16} className="text-red-500" />,
          timelineColor: 'bg-red-500',
          timelineHeader: 'RESOURCE ALERT'
        };
      case 'REMEDIATION':
        return {
          bg: 'bg-[#121f12]', // dark green tint from mockup
          border: 'border-[#4ade80]/40',
          text: 'text-[#4ade80]',
          isAction: true,
          timelineIcon: <Wrench size={12} className="text-[#4ade80]" />,
          timelineColor: 'bg-[#4ade80]',
          timelineHeader: 'MESSAGE LOG'
        };
      case 'MILESTONE':
      default:
        return {
          bg: 'bg-transparent',
          border: 'border-slate-500/50',
          text: 'text-slate-300',
          isAction: true,
          timelineIcon: <Clock size={12} className="text-slate-400" />,
          timelineColor: 'bg-slate-500',
          timelineHeader: 'COMMAND EXEC'
        };
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0f0a] overflow-hidden -mt-6">
      
      {/* AI Processing Overlay */}
      {isSummarizing && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#0a0f0a]/80 backdrop-blur-md">
          <div className="flex flex-col items-center bg-[#121a12] p-8 rounded-3xl border border-[#2a3a2a] shadow-2xl">
            <Sparkles className="text-[#4ade80] animate-pulse w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Timeline...</h3>
            <p className="text-sm text-slate-400">Synthesizing milestones into Post-Mortem.</p>
          </div>
        </div>
      )}

      {/* CENTER PANE: MAIN CHAT */}
      <div className="flex-1 flex flex-col h-full border-r border-[#1a241a]">
        
        {/* Chat Header (Mockup Style) */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#1a241a] shrink-0 pt-4 md:pt-0">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-none">{incident.title}</h1>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border 
                ${incident.severity === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 
                  incident.severity === 'HIGH' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' : 
                  'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'}`}>
                {incident.severity}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>INC-{incident.id.substring(0,4)}</span>
              <span>•</span>
              <span>Owner: <span className="text-slate-300">{incident.createdBy?.username || 'System'}</span></span>
              <span>•</span>
              <span>Duration: <span className="text-slate-300">{getDuration(incident.createdAt)}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3 hidden md:flex">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#162016] border border-[#2a3a2a] hover:bg-[#1a241a] text-slate-200 rounded-lg text-xs font-bold transition">
              <Video size={14} /> Join Call
            </button>
            <button className="p-2 bg-[#162016] border border-[#2a3a2a] hover:bg-[#1a241a] text-slate-200 rounded-lg transition">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth bg-[#0d130d]">
          {/* Top Divider */}
          <div className="flex items-center justify-center mb-10">
            <div className="bg-[#162016] border border-[#1a241a] px-4 py-1.5 rounded-full text-[9px] text-slate-500 font-bold tracking-widest uppercase">
              Incident Room Initialized at {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {messages.map((msg, idx) => {
              const fmt = getMessageFormat(msg);
              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={idx} className="flex gap-4 group">
                  {/* Left Avatar */}
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#1a241a] flex items-center justify-center overflow-hidden">
                       {/* Placeholder for standard avatars matching the mockup feel */}
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user?.username || 'bot'}&backgroundColor=162016`} alt="avatar" className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5 pl-1">
                      <span className="text-sm font-bold text-white">{msg.user?.username || 'System Bot'}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{timeStr}</span>
                    </div>

                    <div className={`p-4 rounded-xl rounded-tl-sm border text-sm leading-relaxed ${fmt.bg} ${fmt.border} ${fmt.text}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    
                    {/* Delivered Indicator (only for action commands like the mockup) */}
                    {fmt.isAction && (
                      <div className="flex justify-end mt-1 pr-1">
                         <span className="text-[9px] text-slate-500 font-bold tracking-wider">{timeStr} - Delivered</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area */}
        <div className="px-6 py-5 bg-[#0a0f0a] border-t border-[#1a241a] shrink-0">
          {/* Quick command pills */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => handleQuickAction('/status')} className="px-3 py-1.5 rounded bg-[#162016] border border-[#2a3a2a] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5">
              <FileText size={12}/> /status
            </button>
            <button onClick={() => handleQuickAction('/log')} className="px-3 py-1.5 rounded bg-[#162016] border border-[#2a3a2a] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5">
              <AlignLeft size={12}/> /log
            </button>
            <button onClick={() => handleQuickAction('/action')} className="px-3 py-1.5 rounded bg-[#162016] border border-[#2a3a2a] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5">
               <Wrench size={12}/> /action
            </button>
            <button onClick={() => handleQuickAction('/decision')} className="px-3 py-1.5 rounded bg-[#162016] border border-[#2a3a2a] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5">
               <CheckCircle size={12}/> /resolve
            </button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <button type="button" className="p-3 bg-[#162016] border border-[#2a3a2a] rounded-xl text-slate-400 hover:text-white transition shrink-0">
               <Paperclip size={18} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message or /command to log to timeline..."
                className="w-full bg-[#162016] border border-[#2a3a2a] text-slate-200 px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#4ade80]/50 transition text-sm placeholder-slate-600"
              />
            </div>
            <button 
              type="submit" 
              disabled={!messageInput.trim()}
              className="p-3.5 bg-[#4ade80] hover:bg-green-400 disabled:bg-[#162016] disabled:text-slate-600 text-[#0a0f0a] rounded-xl transition shrink-0 flex items-center justify-center">
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT PANE: TIMELINE */}
      <div className="hidden lg:flex flex-col w-[380px] bg-[#121812] shrink-0 h-full">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#1a241a] shrink-0">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Logged Timeline</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
            </span>
            <span className="text-[9px] font-bold text-[#4ade80] uppercase tracking-widest">Sync Active</span>
          </div>
        </div>

        {/* Timeline Events area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
           {/* Center connecting line matching the mockup (faint grey on dark) */}
           <div className="absolute left-[39.5px] top-8 bottom-8 w-px bg-[#2a3a2a] z-0"></div>

           <div className="space-y-8">
             {timeline.length === 0 ? (
                <p className="text-slate-600 text-xs italic text-center mt-10">No events logged.</p>
             ) : (
                timeline.map((event, idx) => {
                  const fmt = getMessageFormat(event);
                  const tStr = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  return (
                    <div key={idx} className="relative z-10 flex gap-4">
                      {/* Icon Node */}
                      <div className="shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full ${fmt.timelineColor} flex items-center justify-center text-[#0a0f0a] shadow-lg border-2 border-[#121812]`}>
                           {fmt.timelineIcon}
                        </div>
                      </div>

                      {/* Event Card */}
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${fmt.timelineColor.replace('bg-', 'text-')}`}>
                            {fmt.timelineHeader}
                          </span>
                          <span className="text-[9px] text-slate-600 font-bold font-mono tracking-wider">{tStr}</span>
                        </div>

                        <div className={`bg-[#162016]/40 border rounded-xl p-3 shadow-md ${fmt.border}`}>
                          {/* Inside Card Header (User) */}
                          <div className="flex items-center gap-2 mb-2">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.user?.username || 'sys'}&backgroundColor=162016`} alt="avatar" className="w-5 h-5 rounded-full" />
                            <span className="text-xs font-bold text-white">{event.user?.username || 'System'}</span>
                          </div>
                          {/* Inner Content */}
                          <p className={`text-xs leading-relaxed ${fmt.text} break-words whitespace-pre-wrap`}>
                            {event.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
             )}
             <div ref={timelineEndRef} />
           </div>
        </div>

        {/* Footer: Export Button */}
        <div className="p-6 shrink-0 bg-[#0a0f0a]">
           <button 
             onClick={handleExportReport}
             className="w-full py-3 bg-[#162016] border border-[#2a3a2a] hover:bg-[#1a241a] hover:border-[#4ade80]/30 transition rounded-xl flex items-center justify-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-widest">
             <FileText size={16} /> Export Incident Report
           </button>
        </div>
      </div>

    </div>
  );
}
