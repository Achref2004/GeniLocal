import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ShieldCheck, LogOut, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Charger les utilisateurs depuis le backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Erreur de récupération des parchemins", error);
        navigate('/login'); // Rediriger si le token est invalide
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex">
      {/* Barre Latérale (Sidebar) */}
      <div className="w-64 bg-[#3a3f3b] text-[#f4f1ea] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <ShieldCheck className="text-[#cdaa6a] w-8 h-8" />
          <h1 className="font-serif text-xl">Sanctuaire</h1>
        </div>
        
        <nav className="flex-1 space-y-4">
          <button className="flex items-center gap-3 w-full p-3 bg-[#4a524c] rounded-lg text-[#cdaa6a]">
            <Users size={20} /> Gestion des Élèves
          </button>
          <button className="flex items-center gap-3 w-full p-3 hover:bg-[#4a524c] transition-colors">
            <BookOpen size={20} /> Bibliothèque
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} /> Fermer le Sanctuaire
        </button>
      </div>

      {/* Contenu Principal */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="font-serif text-3xl text-[#3a3f3b]">Tableau de Bord de l'Archiviste</h2>
            <p className="text-[#8a9a8f]">Supervision des registres de Study</p>
          </div>
          <div className="bg-white border border-[#d1cab5] p-2 rounded-full flex items-center px-4">
            <Search className="text-[#8a9a8f] w-4 h-4 mr-2" />
            <input type="text" placeholder="Rechercher un élève..." className="bg-transparent outline-none text-sm" />
          </div>
        </header>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl border border-[#d1cab5] shadow-sm">
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Total Élèves</p>
            <p className="text-4xl font-serif text-[#3a3f3b]">{users.length}</p>
          </motion.div>
        </div>

        {/* Liste des Utilisateurs */}
        <div className="bg-white rounded-xl border border-[#d1cab5] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#eae4d3] text-[#3a3f3b] font-serif">
              <tr>
                <th className="p-4">Identifiant</th>
                <th className="p-4">Nom d'utilisateur</th>
                <th className="p-4">Courriel</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="p-4 text-[#8a9a8f]">#{user.id}</td>
                  <td className="p-4 font-medium text-[#3a3f3b]">{user.username}</td>
                  <td className="p-4 text-[#4a524c]">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${user.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {user.is_admin ? 'Maître' : 'Élève'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-10 text-center text-[#8a9a8f]">Lecture des registres...</div>}
        </div>
      </main>
    </div>
  );
}