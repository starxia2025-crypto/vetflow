import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Users,
  PawPrint,
  Stethoscope,
  FileText,
  Syringe,
  AlertTriangle,
  Calendar,
  Phone
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingVaccines, setUpcomingVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, vaccinesRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/stats`, { credentials: 'include' }),
          fetch(`${API_URL}/api/dashboard/upcoming-vaccines`, { credentials: 'include' })
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (vaccinesRes.ok) {
          setUpcomingVaccines(await vaccinesRes.json());
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: t('totalClients'),
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: t('totalPets'),
      value: stats?.total_pets || 0,
      icon: PawPrint,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: t('activeDoctors'),
      value: stats?.total_doctors || 0,
      icon: Stethoscope,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: t('pendingInvoices'),
      value: stats?.pending_invoices || 0,
      icon: FileText,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      subtitle: stats?.pending_amount ? `$${stats.pending_amount.toFixed(2)}` : null
    },
    {
      title: t('upcomingVaccines'),
      value: stats?.upcoming_vaccines || 0,
      icon: Syringe,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: t('lowStockItems'),
      value: stats?.low_stock_items || 0,
      icon: AlertTriangle,
      color: stats?.low_stock_items > 0 ? 'text-red-400' : 'text-zinc-400',
      bgColor: stats?.low_stock_items > 0 ? 'bg-red-500/10' : 'bg-zinc-500/10'
    }
  ];

  const getDaysUntil = (dateString) => {
    if (!dateString) return 0;
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-['Manrope']">
          {t('welcome')}, {user?.name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-zinc-400 mt-1">
          {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="card-surface"
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-zinc-400">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-zinc-500 mt-1">{stat.subtitle}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vaccine Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-surface" data-testid="vaccine-alerts-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white font-['Manrope']">
              <Syringe className="w-5 h-5 text-orange-500" />
              {t('vaccineAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingVaccines.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                {t('noResults')}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {upcomingVaccines.slice(0, 5).map((vaccine, index) => {
                  const daysUntil = getDaysUntil(vaccine.next_due_date);
                  return (
                    <div 
                      key={index} 
                      className="p-4 hover:bg-zinc-900/50 transition-colors"
                      data-testid={`vaccine-alert-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <PawPrint className="w-4 h-4 text-zinc-500" />
                            <span className="font-medium text-white">{vaccine.pet_name}</span>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{vaccine.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {vaccine.next_due_date}
                            </span>
                            {vaccine.client_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {vaccine.client_phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge 
                          className={daysUntil <= 7 ? 'badge-error' : daysUntil <= 14 ? 'badge-warning' : 'badge-info'}
                        >
                          {t('dueIn')} {daysUntil} {t('days')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-surface" data-testid="recent-activity-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white font-['Manrope']">
              <Calendar className="w-5 h-5 text-orange-500" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !stats?.recent_analyses?.length ? (
              <div className="p-8 text-center text-zinc-500">
                {t('noResults')}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {stats.recent_analyses.map((analysis, index) => (
                  <div 
                    key={index} 
                    className="p-4 hover:bg-zinc-900/50 transition-colors"
                    data-testid={`activity-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="badge-info mb-2">{analysis.type}</Badge>
                        <p className="text-sm text-white">{analysis.description}</p>
                        <p className="text-xs text-zinc-500 mt-1">{analysis.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hero Image */}
      <Card className="card-surface overflow-hidden">
        <div className="relative h-48 md:h-64">
          <img
            src="https://images.pexels.com/photos/6234607/pexels-photo-6234607.jpeg"
            alt="Veterinary clinic"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />
          <div className="absolute inset-0 flex items-center p-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-['Manrope'] mb-2">
                {language === 'es' ? 'Tu clínica, bajo control' : 'Your clinic, under control'}
              </h2>
              <p className="text-zinc-300 max-w-md">
                {language === 'es' 
                  ? 'Gestiona pacientes, inventario y finanzas en un solo lugar'
                  : 'Manage patients, inventory and finances in one place'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
