import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Stethoscope,
  Building2,
  Package,
  FileText,
  Settings,
  Bot,
  LogOut,
  Menu,
  Globe,
  ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/clients', icon: Users, label: t('clients') },
    { path: '/pets', icon: PawPrint, label: t('pets') },
    { path: '/doctors', icon: Stethoscope, label: t('doctors') },
    { path: '/cabinets', icon: Building2, label: t('cabinets') },
    { path: '/inventory', icon: Package, label: t('inventory') },
    { path: '/invoices', icon: FileText, label: t('invoices') },
    { path: '/settings', icon: Settings, label: t('settings') },
    { path: '/ai-assistant', icon: Bot, label: t('aiAssistant') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavContent = () => (
    <nav className="flex-1 py-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `sidebar-item mx-2 ${isActive ? 'sidebar-item-active' : ''}`
          }
          data-testid={`nav-${item.path.slice(1)}`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
          <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-zinc-950 border-r border-white/5 fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-['Manrope']">VetFlow</span>
          </div>
        </div>

        <NavContent />

        {/* User section */}
        <div className="p-4 border-t border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 px-3 py-6 hover:bg-zinc-900"
                data-testid="user-menu-trigger"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-500">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
              <DropdownMenuItem 
                onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
                className="cursor-pointer"
                data-testid="language-switch"
              >
                <Globe className="w-4 h-4 mr-2" />
                {language === 'es' ? 'English' : 'Español'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 focus:text-red-400"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-zinc-950 border-zinc-800 p-0">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">VetFlow</span>
                  </div>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
            <span className="text-lg font-bold text-white">VetFlow</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-500 text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
                className="cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                {language === 'es' ? 'English' : 'Español'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
