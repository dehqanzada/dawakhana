import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  UserX, 
  UserCheck,
  Loader2,
  MoreVertical
} from 'lucide-react';
import UserForm from '../components/UserForm';
import ConfirmModal from '../components/ConfirmModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await window.api.user.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (formData) => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    if (editingUser) {
      await window.api.user.update(editingUser.id, formData, activeUser.id);
    } else {
      await window.api.user.create(formData, activeUser.id);
    }
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    try {
      await window.api.user.toggleStatus(user.id, activeUser.id);
      fetchUsers();
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      alert(cleanMsg);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const activeUser = JSON.parse(localStorage.getItem('user'));
    try {
      await window.api.user.remove(userToDelete.id, activeUser.id);
      setIsConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      alert(cleanMsg);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                <UsersIcon className="text-white" size={32} />
              </div>
              Kullanıcı Yönetimi
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Sisteme erişimi olan personelleri ve yetkilerini yönetin.</p>
          </div>
          <button 
            onClick={() => {
              setEditingUser(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 text-white font-black px-6 py-4 rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <UserPlus size={20} />
            YENİ KULLANICI EKLE
          </button>
        </header>

        {/* Search Bar */}
        <div className="mb-8 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Kullanıcı adına göre ara..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Kullanıcı</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Yetki Rolü</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Durum</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                        <Loader2 className="animate-spin" size={40} />
                        <p className="font-bold">Kullanıcılar yükleniyor...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <UsersIcon size={64} strokeWidth={1} />
                        <p className="text-xl font-medium">Hiç kullanıcı bulunamadı</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                            user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(user.username || '?').substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-lg uppercase">{user.username || 'İSİMSİZ'}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">ID: #{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase ${
                          user.role === 'admin' 
                            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' 
                            : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck size={16} /> : <Shield size={16} />}
                          {user.role === 'admin' ? 'YÖNETİCİ' : 'KASİYER'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase transition-all active:scale-95 ${
                            user.is_active 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {user.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                          {user.is_active ? 'AKTİF' : 'PASİF'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingUser(user);
                              setIsFormOpen(true);
                            }}
                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                            title="Düzenle"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setUserToDelete(user);
                              setIsConfirmOpen(true);
                            }}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveUser}
        initialData={editingUser}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        title="Kullanıcıyı Sil"
        message={`"${userToDelete?.username}" isimli kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="SİL"
        type="danger"
      />
    </div>
  );
};

export default Users;
