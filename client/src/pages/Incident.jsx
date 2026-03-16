import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { socket } from '../socket';
import { 
  Send, Wrench, Scale, AlertCircle, FileText, ChevronLeft, 
  Activity, CheckCircle, ShieldAlert, Clock, Sparkles, 
  Copy, Check, Paperclip, Bell, AlignLeft
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
  const [copied, setCopied] = useState(false);

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
    socket.connect();

    if (user?.id) {
      socket.emit('join-incident', { incidentId: id, userId: user.id });
    }

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.isTimelineEvent) {
        setTimeline((prev) => [...prev, msg]);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      if (user?.id) {
        socket.emit('leave-incident', { incidentId: id, userId: user.id });
      }
      socket.off('new-message', handleNewMessage);
      socket.disconnect();
    };
  }, [id, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socket.emit('send-message', {
      incidentId: id,
      userId: user.id,
      user: user, // Pass the user object for instant optimistic broadcast
      content: messageInput
    });

    setMessageInput('');
    
    // Reset textarea height manually after clearing the state
    const textarea = document.getElementById('chat-input-textarea');
    if (textarea) {
      textarea.style.height = '50px';
    }
  };

  const handleQuickAction = (command) => {
    setMessageInput(command + ' ');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, 150)}px`;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReport = async () => {
    setIsSummarizing(true);
    let errorMsg = "Failed to generate AI report.";

    try {
      // Step 1: Check if we need to resolve it first
      if (incident?.status !== 'RESOLVED' && incident?.status !== 'CLOSED') {
        const resolveRes = await api.patch(`/incidents/${id}/resolve`);
        setIncident(resolveRes.data.incident);
      }

      // Step 2: Poll for the summary to exist (Gemini generation takes a few seconds)
      let summaryFound = null;
      let attempts = 0;
      const maxAttempts = 15; // Wait up to 30 seconds

      while (!summaryFound && attempts < maxAttempts) {
        attempts++;
        try {
          const res = await api.get(`/incidents/${id}/summary`);
          if (res.status === 200 && res.data) {
            summaryFound = res.data;
          }
        } catch (pollErr) {
          // 404 means it's still generating, ignore and let loop continue
          if (pollErr.response?.status !== 404) {
            throw pollErr; // Actual error
          }
        }

        if (!summaryFound) {
          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (summaryFound) {
        setSummaryReport(summaryFound);
      } else {
        errorMsg = "AI Report generation timed out. Check the Reports page later.";
        alert(errorMsg);
      }
      
    } catch (err) {
      console.error(errorMsg, err);
      // Fallback: If it was already resolved and generated previously, just fetch it directly
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already resolved')) {
          try {
              const directRes = await api.get(`/incidents/${id}/summary`);
              setSummaryReport(directRes.data);
          } catch(e) {
              alert(e.response?.data?.message || errorMsg);
          }
      } else {
         alert(err.response?.data?.message || errorMsg);
      }
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
      <div className="h-full flex items-center justify-center text-slate-500 bg-[#000000]">
        <Activity className="animate-spin mr-3 text-[#ffffff]" /> Loading Room...
      </div>
    );
  }

  if (!incident) return <div className="p-10 text-red-500 bg-[#000000] h-full">Incident not found.</div>;

  // --- MESSAGE FORMATTING to match exact mockup colors ---
  const getMessageFormat = (msg) => {
    if (!msg.isTimelineEvent) {
      return {
        bg: 'bg-[#18181b]/80',
        border: 'border-[#27272a]',
        text: 'text-slate-300',
        isAction: false
      };
    }
    switch (msg.eventCategory) {
      case 'OBSERVATION':
        return {
          bg: 'bg-[#18181b]/80',
          border: 'border-yellow-500/30',
          text: 'text-slate-300',
          isAction: true,
          timelineIcon: !msg.content.includes('/log') ? <AlertCircle size={16} className="text-[#000000]" /> : <AlignLeft size={16} className="text-[#000000]" />,
          timelineColor: !msg.content.includes('/log') ? 'bg-red-500 text-red-500' : 'bg-[#ffffff] text-[#ffffff]',
          timelineHeader: !msg.content.includes('/log') ? 'INITIAL TRIGGER' : 'MESSAGE LOG'
        };
      case 'REMEDIATION':
        return {
          bg: 'bg-zinc-800/80', // dark green tint from mockup
          border: 'border-[#ffffff]/50',
          text: 'text-[#ffffff]',
          isAction: true,
          timelineIcon: <Wrench size={12} className="text-[#ffffff]" />,
          timelineColor: 'bg-[#ffffff]',
          timelineHeader: 'MESSAGE LOG'
        };
      case 'MILESTONE':
      default:
        return {
          bg: 'bg-transparent',
          border: 'border-slate-500/30',
          text: 'text-slate-300',
          isAction: true,
          timelineIcon: <CheckCircle size={14} className="text-[#000000]" />,
          timelineColor: 'bg-slate-400 text-slate-400',
          timelineHeader: 'COMMAND EXEC'
        };
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden">
      
      {/* AI Processing Overlay */}
      {isSummarizing && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#000000]/80 backdrop-blur-md">
          <div className="flex flex-col items-center bg-[#09090b] p-8 rounded-3xl border border-[#3f3f46] shadow-2xl">
            <Sparkles className="text-[#ffffff] animate-pulse w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Timeline...</h3>
            <p className="text-sm text-slate-400">Synthesizing milestones into Post-Mortem.</p>
          </div>
        </div>
      )}

      {/* CENTER PANE: MAIN CHAT */}
      <div className="flex-1 flex flex-col h-full border-r border-[#27272a]">
        
        {/* Chat Header (Mockup Style) */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#27272a] shrink-0 pt-4 md:pt-0">
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
            </div>
          </div>

          <div className="flex items-center gap-3 hidden md:flex">
            <button 
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition ${
                copied 
                  ? 'bg-white text-black border-white' 
                  : 'bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a] text-slate-200'
              }`}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth bg-[#09090b]">
          {/* Top Divider */}
          <div className="flex items-center justify-center mb-10">
            <div className="bg-[#18181b] border border-[#27272a] px-4 py-1.5 rounded-full text-[9px] text-slate-500 font-bold tracking-widest uppercase">
              Incident Room Initialized {new Date(incident.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="space-y-8 pr-2">
            {messages.map((msg, idx) => {
              const fmt = getMessageFormat(msg);
              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={idx} className="flex gap-4 group justify-start">
                  {/* Left Avatar */}
                  <div className="shrink-0 mt-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#27272a] flex items-center justify-center overflow-hidden">
                       {/* Placeholder for standard avatars matching the mockup feel */}
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user?.username || 'bot'}&backgroundColor=0a0f0a`} alt="avatar" className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="min-w-0 flex flex-col max-w-[85%] md:max-w-[70%]">
                    <div className="flex items-baseline gap-2 mb-1 pl-1">
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
        <div className="px-6 py-5 bg-[#000000] border-t border-[#27272a] shrink-0">
          {/* Quick command pills */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => handleQuickAction('/status')} className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#3f3f46] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5 shadow-sm">
              <FileText size={12}/> /STATUS
            </button>
            <button onClick={() => handleQuickAction('/log')} className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#3f3f46] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5 shadow-sm">
              <AlignLeft size={12}/> /LOG
            </button>
            <button onClick={() => handleQuickAction('/action')} className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#3f3f46] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5 shadow-sm">
               <Wrench size={12}/> /ACTION
            </button>
            <button onClick={() => handleQuickAction('/decision')} className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#3f3f46] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest uppercase transition flex items-center gap-1.5 shadow-sm">
               <CheckCircle size={12}/> /RESOLVE
            </button>
          </div>

          {/* Input Box - Exactly matching mockup 1 thickness and dark input color */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <button type="button" className="w-12 h-12 flex items-center justify-center bg-[#18181b] border border-[#3f3f46] rounded-xl text-slate-400 hover:text-white transition shrink-0">
               <Paperclip size={18} />
            </button>
            <div className="flex-1 relative flex items-center">
              <textarea
                id="chat-input-textarea"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or /command to log to timeline..."
                rows={1}
                className="w-full bg-[#09090b] border border-[#3f3f46] text-slate-200 px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#ffffff]/50 transition text-sm placeholder-slate-600 shadow-inner resize-none min-h-[50px] max-h-[150px] overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
              />
            </div>
            <button 
              type="button" 
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="w-12 h-12 bg-[#ffffff] hover:bg-zinc-200 disabled:bg-[#18181b] disabled:text-slate-600 text-[#000000] rounded-xl transition flex items-center justify-center shrink-0">
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT PANE: TIMELINE */}
      <div className="hidden lg:flex flex-col w-[380px] bg-[#09090b] shrink-0 h-full">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#27272a] shrink-0">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Logged Timeline</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffffff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffffff]"></span>
            </span>
            <span className="text-[9px] font-bold text-[#ffffff] uppercase tracking-widest">Sync Active</span>
          </div>
        </div>

        {/* Timeline Events area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
           {/* Center connecting line matching the mockup */}
           <div className="absolute left-[39.5px] top-8 bottom-8 w-px bg-gradient-to-b from-[#3f3f46] via-[#27272a] to-transparent z-0"></div>

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
                        {/* Outer dark circle, inner colored circle */}
                        <div className={`w-8 h-8 rounded-full bg-[#000000] border-2 border-[#09090b] flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                           <div className={`w-6 h-6 rounded-full ${fmt.timelineColor.split(' ')[0]} flex items-center justify-center`}>
                              {fmt.timelineIcon}
                           </div>
                        </div>
                      </div>

                      {/* Event Card */}
                      <div className="flex-1 pt-1.5 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${fmt.timelineColor.split(' ')[1]}`}>
                            {fmt.timelineIcon && React.cloneElement(fmt.timelineIcon, { size: 12, className: "text-current bg-transparent" })}
                            {fmt.timelineHeader}
                          </span>
                          <span className="text-[9px] text-slate-600 font-bold font-mono tracking-wider shrink-0 ml-2">{tStr}</span>
                        </div>

                        <div className={`bg-[#18181b]/60 border rounded-xl p-3.5 shadow-md ${fmt.border}`}>
                          {/* Inside Card Header (User) */}
                          <div className="flex items-center gap-2 mb-2">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.user?.username || 'sys'}&backgroundColor=0a0f0a`} alt="avatar" className="w-5 h-5 rounded-full" />
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

        {/* Footer: Export Button matching Mockup 1 (Dark grey block, white text, bold) */}
        <div className="p-6 shrink-0 bg-[#000000] border-t border-[#27272a]">
           <button  
             onClick={handleExportReport}
             className="w-full py-3.5 bg-[#18181b] border border-[#3f3f46] hover:bg-[#27272a] hover:border-[#ffffff]/30 transition rounded-xl flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-widest shadow-sm">
             <FileText size={16} /> Export Incident Report
           </button>
        </div>
      </div>

    </div>
  );
}
