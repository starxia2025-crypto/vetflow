import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, PawPrint, FileText, Package, Bot, Stethoscope } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const initialLogin = { email: '', password: '' };
const initialRegister = { name: '', clinic_name: '', email: '', password: '' };

const Landing = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user, loginWithPassword, register, startGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginWithPassword(loginForm);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(registerForm);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.15) 0%, rgba(9, 9, 11, 0) 35%), radial-gradient(circle at 80% 30%, rgba(34, 197, 94, 0.08) 0%, rgba(9, 9, 11, 0) 30%)'
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-['Manrope']">VetFlow</span>
        </div>

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
                {mode === 'login' ? 'Acceso privado' : 'Crear clínica'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Entra con email y contraseña o continúa con Google.'
                  : 'Crea la cuenta principal de tu clínica veterinaria.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === 'login' ? 'default' : 'outline'}
                  className={mode === 'login' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setMode('login')}
                >
                  Iniciar sesión
                </Button>
                <Button
                  type="button"
                  variant={mode === 'register' ? 'default' : 'outline'}
                  className={mode === 'register' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setMode('register')}
                >
                  Registrarse
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={startGoogleLogin}
                className="w-full border-white/10 text-white hover:bg-white/5"
              >
                Continuar con Google
              </Button>

              {error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {mode === 'login' ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                      className="input-field"
                      minLength={8}
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? 'Entrando...' : 'Entrar al ERP'}
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre del admin</Label>
                    <Input
                      id="register-name"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-clinic">Nombre de la clínica</Label>
                    <Input
                      id="register-clinic"
                      value={registerForm.clinic_name}
                      onChange={(event) => setRegisterForm({ ...registerForm, clinic_name: event.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                      className="input-field"
                      minLength={8}
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? 'Creando...' : 'Crear cuenta'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Landing;
