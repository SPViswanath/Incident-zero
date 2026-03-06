import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, ChevronRight, Activity, Calendar, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/incidents/reports/all');
        setReports(res.data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <Activity className="animate-spin mr-3 text-[#4ade80]" /> Loading Reports...
      </div>
    );
  }

  return (
    <div className="w-full relative h-full flex flex-col pt-2 md:pt-6 px-4 md:px-10">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-[34px] font-bold text-white tracking-tight font-sans">AI Post-Mortems</h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">Auto-generated reports synthesized by Gemini AI for resolved incidents.</p>
      </div>

      {reports.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-[#162016]/50 rounded-3xl border border-[#2a3a2a]">
          <FileText size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">NO REPORTS GENERATED YET</p>
          <p className="text-slate-500 text-xs mt-2">Resolve an incident to trigger the Gemini AI summarizer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-[#1a241a]/60 backdrop-blur-md border border-[#2a3a2a]/50 rounded-[28px] p-6 hover:bg-[#1a241a]/80 transition-all duration-300 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-widest text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10 flex items-center gap-1.5">
                  <Sparkles size={10} /> AI GENERATED
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
                  <Calendar size={12} /> {new Date(report.generatedAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg md:text-xl font-bold mb-3 text-white group-hover:text-[#4ade80] transition-colors leading-tight line-clamp-2">
                {report.incident?.title || 'Unknown Incident'}
              </h3>
              
              <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6 flex-1">
                {report.summary}
              </p>
              
              <div className="mt-auto border-t border-[#2a3a2a] pt-4 flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#4ade80] uppercase bg-[#0a0f0a]/50 px-2.5 py-1 rounded-md border border-[#1a241a]">
                  INC-{report.incident?.id?.substring(0,4)}
                </span>
                <Link to={`/incident/${report.incidentId}`} className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition uppercase tracking-widest">
                  View Source <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


