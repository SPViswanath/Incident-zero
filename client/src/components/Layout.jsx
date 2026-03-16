import { useContext } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, LayoutDashboard, BarChart2, Users, Settings } from 'lucide-react';

const NavItem = ({ icon: Icon, label, path, isActive }) => {
  return (
    <Link 
      to={path} 
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'text-white' 
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">{label}</span>
    </Link>
  );
};

const Layout = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Quick helper to determine active path
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-[#000000] text-slate-100 font-sans selection:bg-white/30">
      
      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col w-20 bg-[#000000] border-r border-zinc-900 items-center py-6 fixed inset-y-0 left-0 z-50">
        
        {/* Logo */}
        <div className="mb-10">
          <div className="bg-white rounded-xl p-2 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Zap className="text-[#000000]" size={24} fill="currentColor" />
          </div>
        </div>
        
        {/* Nav Links */}
        <div className="flex flex-col space-y-6 flex-grow ">
          <NavItem icon={LayoutDashboard} label="Dash" path="/dashboard" isActive={isActive('/dashboard')} />
          <NavItem icon={BarChart2} label="Reports" path="/reports" isActive={isActive('/reports')} />
          <NavItem icon={Users} label="Team" path="/team" isActive={isActive('/team')} />
          <NavItem icon={Settings} label="Setup" path="/setup" isActive={isActive('/setup')} />
        </div>

      </nav>

      {/* Main Content Area */}
      <main className="flex-grow w-full md:ml-20 pb-20 md:pb-0 overflow-x-hidden min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#000000]/90 backdrop-blur-md border-t border-zinc-900 flex justify-around items-center py-2 px-2 z-50 pb-safe">
        <NavItem icon={LayoutDashboard} label="Dash" path="/dashboard" isActive={isActive('/dashboard')} />
        <NavItem icon={BarChart2} label="Reports" path="/reports" isActive={isActive('/reports')} />
        <NavItem icon={Users} label="Team" path="/team" isActive={isActive('/team')} />
        <NavItem icon={Settings} label="Setup" path="/setup" isActive={isActive('/setup')} />
      </nav>

    </div>
  );
};

export default Layout;
