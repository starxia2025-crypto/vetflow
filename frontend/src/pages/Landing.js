import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, PawPrint, FileText, Package, Bot, Stethoscope, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const PORTAL_BASE_URL = process.env.REACT_APP_PORTAL_URL || 'https://www.starxia.com';

const Landing = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    { icon: PawPrint, title: t('feature1Title'), description: t('feature1Desc') },
    { icon: FileText, title: t('feature2Title'), description: t('feature2Desc') },
    { icon: Package, title: t('feature3Title'), description: t('feature3Desc') },
    { icon: Bot, title: t('feature4Title'), description: t('feature4Desc') }
  ];

  const isLight = theme === 'light';
  const loginPortalUrl = new URL('/iniciar-sesion', PORTAL_BASE_URL);
  loginPortalUrl.searchParams.set('product', 'erp-veterinaria');
  const registerPortalUrl = new URL('/registro', PORTAL_BASE_URL);
  registerPortalUrl.searchParams.set('product', 'erp-veterinaria');
  registerPortalUrl.searchParams.set('mode', 'demo');

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.15) 0%, rgba(9, 9, 11, 0) 35%), radial-gradient(circle at 80% 30%, rgba(34, 197, 94, 0.08) 0%, rgba(9, 9, 11, 0) 30%)'
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-['Manrope']">VetFlow</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className="text-zinc-400 hover:text-orange-500"
            data-testid="theme-toggle"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
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
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start pt-8 md:pt-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
              ERP veterinario para tu SaaS
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-['Manrope'] tracking-tight leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
                {t('heroSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card-surface p-5 hover:-translate-y-1 transition-all duration-300"
                  data-testid={`feature-card-${index}`}
                >
                  <div className="w-11 h-11 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 font-['Manrope']">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="card-surface border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-['Manrope'] text-2xl">
                Acceso centralizado
              </CardTitle>
              <CardDescription>
                Inicia sesión o crea tu cuenta desde Starxia y luego entra en tu ERP veterinario sin volver a registrarte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-4 text-sm text-zinc-200">
                Desde Starxia podrás iniciar sesión con Google o email, crear tu empresa y activar la demo del ERP veterinario con continuidad real entre productos.
              </div>

              <div className="grid gap-3">
                <a href={loginPortalUrl.toString()} className="block">
                  <Button type="button" className="btn-primary w-full">
                    Iniciar sesión en Starxia
                  </Button>
                </a>
                <a href={registerPortalUrl.toString()} className="block">
                  <Button type="button" variant="outline" className="btn-secondary w-full">
                    Crear cuenta y comenzar demo
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Landing;
