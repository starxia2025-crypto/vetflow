import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { 
  PawPrint, 
  FileText, 
  Package, 
  Bot, 
  ArrowRight,
  Globe,
  Stethoscope
} from 'lucide-react';
import { useEffect } from 'react';

const Landing = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    {
      icon: PawPrint,
      title: t('feature1Title'),
      description: t('feature1Desc')
    },
    {
      icon: FileText,
      title: t('feature2Title'),
      description: t('feature2Desc')
    },
    {
      icon: Package,
      title: t('feature3Title'),
      description: t('feature3Desc')
    },
    {
      icon: Bot,
      title: t('feature4Title'),
      description: t('feature4Desc')
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.12) 0%, rgba(9, 9, 11, 0) 60%)'
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-['Manrope']">VetFlow</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
            className="text-zinc-400 hover:text-orange-500"
            data-testid="language-toggle"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'es' ? 'EN' : 'ES'}
          </Button>
          <Button 
            onClick={handleLogin}
            className="btn-primary"
            data-testid="login-btn"
          >
            {t('login')}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-['Manrope'] tracking-tight leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="btn-primary text-lg px-8 py-6"
                data-testid="get-started-btn"
              >
                {t('getStarted')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="https://images.pexels.com/photos/4040656/pexels-photo-4040656.jpeg"
                alt="Veterinary care"
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-white font-semibold">+2,500</p>
                  <p className="text-zinc-400 text-sm">{t('totalPets')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto py-20 md:py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16 font-['Manrope']">
            {t('features')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card-surface p-6 hover:-translate-y-1 transition-all duration-300"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-['Manrope']">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-3xl mx-auto text-center py-20 border-t border-zinc-800">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-['Manrope']">
            {language === 'es' ? '¿Listo para comenzar?' : 'Ready to get started?'}
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            {language === 'es' 
              ? 'Únete a cientos de clínicas veterinarias que ya confían en VetFlow'
              : 'Join hundreds of veterinary clinics that already trust VetFlow'}
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="btn-primary text-lg px-8 py-6"
            data-testid="cta-btn"
          >
            {t('loginWithGoogle')}
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-orange-500" />
            <span className="text-zinc-400">VetFlow CRM</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2025 VetFlow. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
