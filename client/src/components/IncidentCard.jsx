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
  // Severity colors
  const severityColors = {
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    MEDIUM: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    RESOLVED: 'text-green-500 bg-green-500/10 border-green-500/20'
  };

  const getSeverityStyle = (status, severity) => {
    if (status === 'RESOLVED') return severityColors['RESOLVED'];
    return severityColors[severity] || severityColors['LOW'];
  };

  const badgeStyle = getSeverityStyle(incident.status, incident.severity);
  const displayTime = timeAgo(incident.createdAt);

  return (
    <Link to={`/incident/${incident.id}`} className="block group h-full">
      <div className="bg-[#1a241a]/60 backdrop-blur-md border border-[#2a3a2a]/50 rounded-[28px] p-6 hover:bg-[#1a241a]/80 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
        {/* Top row: Badge & Time */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-widest ${badgeStyle}`}>
            {incident.status === 'RESOLVED' ? 'RESOLVED' : incident.severity}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {displayTime}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-lg md:text-xl font-bold mb-8 line-clamp-2 leading-tight transition-colors ${
          incident.status === 'RESOLVED' 
            ? 'text-slate-500 line-through decoration-slate-600/50' 
            : 'text-white group-hover:text-green-400'
        }`}>
          {incident.title}
        </h3>

        {/* Bottom row: Avatar & ID */}
        <div className="mt-auto flex justify-between items-center pt-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#162016] text-[#4ade80] text-xs font-bold flex items-center justify-center border border-[#2a3a2a]">
              {incident.createdBy?.username ? incident.createdBy.username.substring(0,2).toUpperCase() : 'VI'}
            </div>
            <span className="text-sm text-slate-400 font-medium">
              {incident.createdBy?.username || 'Unknown'}
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#4ade80] uppercase bg-[#0a0f0a]/50 px-2.5 py-1 rounded-md border border-[#1a241a]">
            INC-{incident.id.substring(0,4)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default IncidentCard;
