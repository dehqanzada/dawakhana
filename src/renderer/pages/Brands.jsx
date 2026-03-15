import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit2, Trash2, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import BrandForm from '../components/BrandForm';
import ConfirmModal from '../components/ConfirmModal';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, loading: false });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const data = await window.api.brand.getAll();
      setBrands(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDeactivate = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.brand.deactivate(deleteModal.id, user.id);
      await fetchBrands();
      setDeleteModal({ isOpen: false, id: null, loading: false });
    } catch (err) {
      alert('Hata: ' + err.message);
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Tag className="text-blue-600" size={32} />
            Marka Yönetimi
          </h1>
          <p className="text-slate-500 font-medium">İlaç markaları ve üreticiler</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchBrands}
            className="p-3 bg-white text-slate-500 hover:text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-all"
            title="Yenile"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setEditingBrand(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
          >
            <Plus size={20} />
            YENİ MARKA EKLE
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Marka adı ile ara..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-5">Marka Adı</th>
                  <th className="px-8 py-5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="2" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p>Yükleniyor...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBrands.map((brand) => (
                  <tr key={brand.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <span className="font-extrabold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{brand.name}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, id: brand.id, loading: false })}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBrands.length === 0 && !loading && (
              <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                <Tag size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium italic">Kayıtlı marka bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BrandForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBrands}
        initialData={editingBrand}
      />

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        loading={deleteModal.loading}
        onClose={() => setDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleDeactivate}
        title="Markayı Sil"
        message="Bu markayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu marka artık ürünlerde görünmeyecektir."
      />
    </div>
  );
};

export default Brands;
