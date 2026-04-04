import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, ShieldCheck, LogOut, Search, Trash2, Plus, X, Globe, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface User {
  username: string;
  email: string;
  is_admin: boolean;
  fullname?: string;
  institution?: string;
  region?: string;
}

interface Stats {
  total_users: number;
  by_region: Record<string, number>;
  by_institution: Record<string, number>;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total_users: 0, by_region: {}, by_institution: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullname: '',
    institution: '',
    region: '',
    is_admin: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Charger les données
  useEffect(() => {
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erreur de récupération des données", error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${email} ? Cette action supprimera son compte de la base de données.`)) return;

    try {
      await api.delete(`/admin/users/${email}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess(`Utilisateur ${email} supprimé avec succès de la base de données`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la suppression");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUser.username || !newUser.email || !newUser.password) {
      setError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    try {
      await api.post('/admin/users', newUser, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess("Utilisateur créé avec succès et ajouté à la base de données");
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullname: '',
        institution: '',
        region: '',
        is_admin: false
      });
      setShowAddUser(false);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création");
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex">
      {/* Sidebar avec Navigation */}
      <div className="w-64 bg-[#3a3f3b] text-[#f4f1ea] p-6 flex flex-col">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-10">
          <ShieldCheck className="text-[#cdaa6a] w-8 h-8" />
          <h1 className="font-serif text-xl">Sanctuaire Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 mb-10">
          <button className="flex items-center gap-3 w-full p-3 bg-[#4a524c] rounded-lg text-[#cdaa6a]">
            <Users size={20} /> Gestion Utilisateurs
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className="flex items-center gap-3 w-full p-3 hover:bg-[#4a524c] transition-colors rounded-lg text-[#f4f1ea]"
          >
            <BarChart3 size={20} /> Statistiques
          </button>
        </nav>

        {/* Logout */}
        <div className="mt-auto border-t border-[#4a524c] pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} /> Fermer Session
          </button>
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="font-serif text-3xl text-[#3a3f3b]">Gestion des Utilisateurs</h2>
            <p className="text-[#8a9a8f]">Supervision complète des comptes</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-2 bg-[#8a9a8f] text-white px-4 py-2 rounded-lg hover:bg-[#708678] transition-colors font-semibold"
          >
            <Plus size={20} /> Ajouter Utilisateur
          </button>
        </header>

        {/* Messages d'alerte */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            ✗ {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            ✓ {success}
          </motion.div>
        )}

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl border border-[#d1cab5] shadow-sm">
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Total Utilisateurs</p>
            <p className="text-4xl font-serif text-[#3a3f3b]">{users.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl border border-[#d1cab5] shadow-sm">
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Régions</p>
            <p className="text-4xl font-serif text-[#cdaa6a]">{Object.keys(stats.by_region).length}</p>
          </motion.div>
        </div>

        {/* Barre de Recherche */}
        <div className="mb-6 bg-white border border-[#d1cab5] p-3 rounded-lg flex items-center px-4">
          <Search className="text-[#8a9a8f] w-4 h-4 mr-2" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        {/* Liste des Utilisateurs */}
        <div className="bg-white rounded-xl border border-[#d1cab5] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#eae4d3] text-[#3a3f3b] font-serif">
              <tr>
                <th className="p-4">Nom d'utilisateur</th>
                <th className="p-4">Email</th>
                <th className="p-4">Région</th>
                <th className="p-4">Université</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea]">
              {filteredUsers.map((user) => (
                <tr key={user.email} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="p-4 font-medium text-[#3a3f3b]">{user.username}</td>
                  <td className="p-4 text-[#4a524c]">{user.email}</td>
                  <td className="p-4 text-[#8a9a8f]">{user.region || "--"}</td>
                  <td className="p-4 text-[#8a9a8f] truncate max-w-xs" title={user.institution}>{user.institution || "--"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteUser(user.email)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Supprimer de la base de données"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-10 text-center text-[#8a9a8f]">Chargement...</div>}
          {!loading && filteredUsers.length === 0 && (
            <div className="p-10 text-center text-[#8a9a8f]">Aucun utilisateur trouvé</div>
          )}
        </div>
      </main>

      {/* Modal d'ajout d'utilisateur */}
      {showAddUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAddUser(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl border border-[#d1cab5] my-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl text-[#3a3f3b]">Ajouter Utilisateur</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-[#8a9a8f] hover:text-[#3a3f3b] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="Ex: john_doe"
                />
              </div>

              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="Ex: john@example.com"
                />
              </div>

              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Mot de passe *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Nom complet</label>
                <input
                  type="text"
                  value={newUser.fullname}
                  onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="Ex: John Doe"
                />
              </div>

              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Région *</label>
                <input
                  type="text"
                  value={newUser.region}
                  onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="Ex: Tunisie, France, etc."
                />
              </div>

              <div>
                <label className="block text-[#4a524c] font-semibold mb-2">Université</label>
                <input
                  type="text"
                  value={newUser.institution}
                  onChange={(e) => setNewUser({ ...newUser, institution: e.target.value })}
                  className="w-full p-3 border border-[#d1cab5] rounded-lg bg-[#eae4d3] focus:outline-none focus:border-[#8a9a8f]"
                  placeholder="Ex: Université X"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 p-3 border border-[#d1cab5] text-[#3a3f3b] rounded-lg hover:bg-[#eae4d3] transition-colors font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 p-3 bg-[#8a9a8f] text-white rounded-lg hover:bg-[#708678] transition-colors font-semibold"
                >
                  Créer
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

