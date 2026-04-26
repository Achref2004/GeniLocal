import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import logoGeniLocal from '../assets/logoo_genilocal.png';
import login_image from '../assets/login_image.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. GESTION DU RETOUR GOOGLE (Au chargement de la page) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      try {
        const decoded: any = jwtDecode(token);
        // On redirige selon le rôle stocké dans le JWT
        if (decoded.is_admin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        setError("Le badge magique est invalide.");
      }
    }
  }, [navigate]);

  // --- 2. CONNEXION VIA GOOGLE (Redirection) ---
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/login/google";
  };

  // --- 3. CONNEXION CLASSIQUE (Email/Password) ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);

      const decoded: any = jwtDecode(access_token);
      if (decoded.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || "Accès refusé. Vérifiez vos parchemins.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, rotateY: 5 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      className="absolute inset-0 min-h-screen flex items-center justify-center p-4 z-40 bg-transparent pointer-events-none"
      style={{ perspective: '2500px' }}
    >
      <div 
        className="relative flex w-full max-w-7xl h-[700px] rounded-lg pointer-events-auto"
        style={{
          background: '#f4f1ea',
          boxShadow: '0 25px 50px -12px rgba(60,65,60,0.4), 0 0 20px rgba(138,154,143,0.2)',
        }}
      >
        {/* --- PAGE DE GAUCHE : PRÉFACE --- */}
        <div 
          className="w-1/2 relative p-12 flex flex-col justify-center rounded-l-lg overflow-hidden"
          style={{
            boxShadow: 'inset -15px 0 20px -10px rgba(92,84,70,0.15)',
            backgroundImage: `repeating-linear-gradient(45deg, rgba(167,188,174,0.05) 0px, rgba(167,188,174,0.05) 1px, transparent 1px, transparent 4px)`,
          }}
        >
          <div className="absolute inset-6 border border-[#d1cab5] rounded-sm pointer-events-none"></div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-[#eae4d3] border border-[#cdaa6a] shadow-inner overflow-hidden">
              <img src={logoGeniLocal} alt="Logo GeniLocal" className="w-[72px] h-[72px] object-contain" />
            </div>
            <h2 className="font-serif text-3xl mb-2 text-[#3a3f3b]">Préface</h2>
            <div className="h-px w-16 mx-auto bg-[#cdaa6a] mb-8"></div>
            <p className="font-serif text-lg italic text-[#4a524c] mb-6 leading-relaxed">
              "Apprendre local, briller global."
            </p>
            <div>
              <img 
                  src={login_image} 
                  alt="Logo GeniLocal"
                  className="w-full h-full object-cover"              />
            </div>
            <p className="text-sm text-[#5e6660] leading-relaxed px-4">
              Bienvenue dans <span style={{ color: '#0e7d83' }}>Geni</span><span style={{ color: '#95393e' }}>Local</span>. Une plateforme conçue par <span className="font-serif font-semibold text-[#3a3f3b]">Achref Jnayeh</span> pour redéfinir l'apprentissage.
            </p>
          </div>
        </div>

        {/* --- LA RELIURE --- */}
        <div 
          className="w-10 relative z-20 shrink-0"
          style={{
            background: 'linear-gradient(90deg, #e3dfd5 0%, #dcd7cb 20%, #c8c2b5 50%, #dcd7cb 80%, #e3dfd5 100%)',
            boxShadow: 'inset 5px 0 10px rgba(0,0,0,0.05), inset -5px 0 10px rgba(0,0,0,0.05)',
          }}
        >
          <div className="absolute top-1/4 left-1/2 w-8 h-px bg-[#a39c8b] -translate-x-1/2 opacity-50"></div>
          <div className="absolute top-2/4 left-1/2 w-8 h-px bg-[#a39c8b] -translate-x-1/2 opacity-50"></div>
          <div className="absolute top-3/4 left-1/2 w-8 h-px bg-[#a39c8b] -translate-x-1/2 opacity-50"></div>
        </div>

        {/* --- PAGE DE DROITE : FORMULAIRE --- */}
        <div 
          className="w-1/2 relative p-12 flex flex-col justify-center rounded-r-lg"
          style={{ boxShadow: 'inset 15px 0 20px -10px rgba(92,84,70,0.15)' }}
        >
          <div className="absolute inset-6 border border-[#d1cab5] rounded-sm pointer-events-none"></div>
          <div className="relative z-10 max-w-sm mx-auto w-full">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl mb-2 text-[#3a3f3b]">Chapitre I</h2>
              <p className="text-[#5e6660] tracking-widest uppercase text-xs font-medium">Connexion</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4a524c] font-serif">Courriel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-[#eae4d3] border-[#d1cab5] text-[#3a3f3b] focus:border-[#8a9a8f] focus:ring-[#8a9a8f]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[#4a524c] font-serif">Mot de passe</Label>
                  <button 
                    type="button" 
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-[#cdaa6a] hover:text-[#b5955c] font-medium"
                  >
                    Oublié ?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-[#eae4d3] border-[#d1cab5] text-[#3a3f3b] focus:border-[#8a9a8f] focus:ring-[#8a9a8f]"
                />
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 text-[#f4f1ea] font-serif tracking-wide text-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8a9a8f 0%, #708678 100%)',
                  boxShadow: '0 4px 15px rgba(112,134,120,0.3)',
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Ouvrir la session"}
              </Button>
            </form>

            <div className="mt-6 relative flex items-center justify-center">
              <div className="w-full border-t border-[#d1cab5] absolute"></div>
              <span className="bg-[#f4f1ea] px-4 text-xs text-[#8c948e] font-serif relative">ou continuer avec</span>
            </div>

            <Button 
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 mt-6 border-[#d1cab5] text-[#4a524c] hover:bg-[#eae4d3] flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            <button 
              onClick={() => navigate('/signup')}
              className="w-full mt-6 text-center text-[#3a3f3b] text-sm font-serif hover:underline"
            >
              Écrire votre nom dans le registre (S'inscrire)
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}