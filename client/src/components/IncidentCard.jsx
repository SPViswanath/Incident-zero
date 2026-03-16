import { Link } from 'react-router-dom';

const timeAgo = (dateStr) => {
  const diffMs = new Date() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

const IncidentCard = ({ incident }) => {
  // Severity colors mapping to B&W or standard alert colors
  const severityColors = {
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    MEDIUM: 'text-zinc-300 bg-zinc-800 border-zinc-700',
    LOW: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    RESOLVED: 'text-white bg-white/10 border-white/20'
  };

  const getSeverityStyle = (status, severity) => {
    if (status === 'RESOLVED') return severityColors['RESOLVED'];
    return severityColors[severity] || severityColors['LOW'];
  };

  const badgeStyle = getSeverityStyle(incident.status, incident.severity);
  const displayTime = timeAgo(incident.createdAt);

  return (
    <Link to={`/incident/${incident.id}`} className="block group w-full">
      <div className="bg-[#1e271e]/30 border border-[#3f3f46]/30 rounded-[20px] md:rounded-[28px] p-5 md:p-6 hover:bg-[#1e271e]/50 hover:border-[#3f3f46]/60 transition-all duration-300 min-h-[160px] md:min-h-[210px] flex flex-col relative overflow-hidden shadow-sm">
        {/* Top row: Badge & Time */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${badgeStyle}`}>
            {incident.status === 'RESOLVED' ? 'RESOLVED' : incident.severity}
          </span>
          <span className="text-[10px] md:text-[11px] text-[#64748b] font-medium tracking-wide">
            {displayTime}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-[17px] md:text-[20px] font-bold mb-6 md:mb-8 line-clamp-2 leading-[1.3] transition-colors ${
          incident.status === 'RESOLVED' 
            ? 'text-zinc-600 line-through decoration-zinc-800 hover:text-zinc-500' 
            : 'text-white group-hover:text-zinc-200'
        }`}>
          {incident.title}
        </h3>

        {/* Bottom row: Avatar & ID */}
        <div className="mt-auto pt-4 border-t border-[#3f3f46]/20 flex justify-between items-center w-full">
          <div className="flex items-center space-x-2 md:space-x-3 truncate mr-2">
            <div className="w-[24px] h-[24px] md:w-[30px] md:h-[30px] rounded-full bg-[#182025] text-cyan-400 text-[9px] md:text-[10px] font-bold flex items-center justify-center border border-[#1e293b] flex-shrink-0 relative overflow-hidden">
               {/* Simplified mock avatar based on blue person in screenshot */}
              {incident.createdBy?.username ? incident.createdBy.username.substring(0,2).toUpperCase() : 'VI'}
              <div className="absolute inset-0 bg-cyan-900/40 mix-blend-overlay"></div>
            </div>
            <span className="text-[12px] md:text-[13px] text-cyan-500/80 font-medium tracking-wide group-hover:text-cyan-400 transition-colors truncate">
              {incident.createdBy?.username || 'System'}
            </span>
          </div>
          <span className="flex-shrink-0 text-[10px] md:text-[11px] font-bold tracking-widest text-emerald-600/80 uppercase">
            INC-{incident.id.substring(0,4)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default IncidentCard;
