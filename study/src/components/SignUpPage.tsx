import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api'; // Assure-toi que ce fichier existe avec ta config Axios

export function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
  });

  // Correction : Ajout du type pour l'événement de saisie
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Correction : Ajout du type pour l'événement de soumission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      // Envoi vers le backend FastAPI
      await api.post('/signup', {
        username: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        region: formData.region,
      });

      alert("Votre signature a été apposée au registre !");
      navigate('/login');

    } catch (err: any) {
      // Correction : Gestion du type 'unknown' de l'erreur
      const backendMessage = err.response?.data?.detail || "Erreur de connexion au grimoire.";
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, rotateY: -5 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute inset-0 min-h-screen flex items-center justify-center p-4 z-40 bg-transparent"
      style={{ perspective: '2500px' }}
    >
      <div className="relative flex w-full max-w-7xl h-[700px] rounded-lg shadow-2xl overflow-hidden bg-[#f4f1ea]">

        {/* --- PAGE DE GAUCHE : DÉCORATIVE --- */}
        <div className="w-1/2 relative p-12 flex flex-col justify-center border-r border-[#d1cab5]/30">
          <div className="absolute inset-6 border border-[#cdaa6a]/30 rounded-sm pointer-events-none"></div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-[#eae4d3] border border-[#cdaa6a] shadow-inner overflow-hidden">
              <img src="/assets/logo_genilocal.png" alt="Logo GeniLocal" className="w-14 h-14 object-contain" />
            </div>

            <h2 className="font-serif text-3xl mb-2 text-[#3a3f3b]">Les Fondations</h2>
            <div className="h-px w-16 mx-auto bg-[#cdaa6a] mb-8"></div>

            <p className="font-serif text-lg italic text-[#4a524c] mb-6 leading-relaxed">
              "Chaque grand esprit a un jour commencé par inscrire son nom dans les registres du savoir."
            </p>

            <div className="w-full h-48 rounded-md overflow-hidden border-2 border-[#d1cab5] shadow-md">
              <img
                src="/assets/image2-signup.png"
                alt="Inscription GeniLocal"
                className="w-full h-full object-cover sepia-[0.3]"
              />
            </div>
          </div>
        </div>

        {/* --- LA RELIURE (Centre) --- */}
        <div className="w-12 bg-gradient-to-r from-[#dcd7cb] via-[#c8c2b5] to-[#dcd7cb] shadow-inner flex flex-col justify-around items-center py-20">
          <div className="w-8 h-px bg-[#a39c8b]/40"></div>
          <div className="w-8 h-px bg-[#a39c8b]/40"></div>
          <div className="w-8 h-px bg-[#a39c8b]/40"></div>
        </div>

        {/* --- PAGE DE DROITE : FORMULAIRE --- */}
        <div className="w-1/2 relative p-12 flex flex-col justify-center">
          <div className="absolute inset-6 border border-[#d1cab5]/30 rounded-sm pointer-events-none"></div>

          <div className="relative z-10 max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#3a3f3b]">Chapitre II</h2>
              <p className="text-[#8a9a8f] uppercase text-[10px] tracking-[0.2em] font-bold">L'Inscription</p>
            </div>

            {/* Affichage des erreurs */}
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

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-serif text-[#4a524c]">Prénom</Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="bg-[#eae4d3]/50 border-[#d1cab5] focus:ring-[#8a9a8f]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-serif text-[#4a524c]">Nom</Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="bg-[#eae4d3]/50 border-[#d1cab5] focus:ring-[#8a9a8f]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-serif text-[#4a524c]">Courriel</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-[#eae4d3]/50 border-[#d1cab5]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-serif text-[#4a524c]">Région *</Label>
                <Input
                  name="region"
                  type="text"
                  value={formData.region}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Tunisie, France, Maroc..."
                  className="bg-[#eae4d3]/50 border-[#d1cab5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-serif text-[#4a524c]">Mot de passe</Label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="bg-[#eae4d3]/50 border-[#d1cab5]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-serif text-[#4a524c]">Confirmer</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="bg-[#eae4d3]/50 border-[#d1cab5]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8a9a8f] to-[#708678] text-white font-serif py-6 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apposer ma signature"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#5e6660] font-serif">
                Déjà inscrit ?
                <button onClick={() => navigate('/login')} className="ml-2 text-[#8a9a8f] font-bold hover:underline">
                  Retourner au Chapitre I
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}