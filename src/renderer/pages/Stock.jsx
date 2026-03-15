import { Package, Plus, Search, AlertCircle, Calendar, RefreshCcw, Edit2, Trash2, History, ArrowBigUp, ArrowBigDown, X, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import MedicineForm from '../components/MedicineForm';
import ConfirmModal from '../components/ConfirmModal';

const Stock = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, loading: false });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, med: null, data: [], loading: false });
  
  const searchRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const data = await window.api.medicine.getAll();
      setMedicines(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    searchRef.current?.focus();

    const handleGlobalClick = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
      const isButton = e.target.closest('button');
      
      if (!isInput && !isButton) {
        searchRef.current?.focus();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const getExpiryStatus = (batches) => {
    if (!batches || batches.length === 0) return { label: 'Yok', color: 'text-slate-400', level: 0 };
    
    // Find nearest expiry date
    const dates = batches.map(b => new Date(b.expiry_date)).sort((a, b) => a - b);
    const nearest = dates[0];
    const today = new Date();
    const diffDays = Math.ceil((nearest - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: nearest.toLocaleDateString(), color: 'bg-rose-100 text-rose-700', level: 2 }; // Expired
    if (diffDays <= 30) return { label: nearest.toLocaleDateString(), color: 'bg-amber-100 text-amber-700', level: 1 }; // Critical
    return { label: nearest.toLocaleDateString(), color: 'text-slate-600', level: 0 };
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.barcode?.includes(searchTerm)
  );

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleDeactivate = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.medicine.deactivate(deleteModal.id, 'Kullanıcı tarafından silindi', user.id);
      await fetchMedicines();
      setDeleteModal({ isOpen: false, id: null, loading: false });
    } catch (err) {
      alert('Hata: ' + err.message);
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openHistory = async (medicine) => {
    setHistoryModal({ isOpen: true, med: medicine, data: [], loading: true });
    try {
      const movements = await window.api.medicine.getMovements(medicine.id);
      setHistoryModal(prev => ({ ...prev, data: movements, loading: false }));
    } catch (err) {
      alert('Hata: ' + err.message);
      setHistoryModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Package className="text-blue-600" size={32} />
            Stok Yönetimi
          </h1>
          <p className="text-slate-500 font-medium">İlaç envanteri ve son kullanma takibi</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchMedicines}
            className="p-3 bg-white text-slate-500 hover:text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-all"
            title="Yenile"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
            >
              <Plus size={20} />
              YENİ ÜRÜN EKLE
            </button>
          )}
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            ref={searchRef}
            type="text"
            placeholder="İlaç adı veya barkod ile ara..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onBlur={(e) => {
              setTimeout(() => {
                const activeTag = document.activeElement?.tagName;
                const isAnotherInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag);
                if (!isAnotherInput) {
                  searchRef.current?.focus();
                }
              }, 10);
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Toplam Çeşit</p>
            <p className="text-2xl font-black text-slate-900">{medicines.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="px-8 py-5">İlaç Detayı</th>
                <th className="px-8 py-5">Raf No</th>
                <th className="px-8 py-5 text-center">Mevcut Stok</th>
                <th className="px-8 py-5 text-right">Birim Fiyat</th>
                <th className="px-8 py-5">Son Kullanma</th>
                <th className="px-8 py-5 text-center">Durum</th>
                <th className="px-8 py-5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((med) => {
                const expiry = getExpiryStatus(med.Batches);
                const isOutOfStock = med.stock_quantity <= 0;
                
                return (
                  <tr key={med.id} className={`group hover:bg-blue-50/30 transition-colors ${isOutOfStock ? 'opacity-60' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{med.name}</span>
                        <span className="text-xs font-mono text-slate-400 font-bold">{med.barcode} | {med.Brand?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold border border-slate-200">
                        {med.shelf_number || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-xl font-black ${isOutOfStock ? 'text-rose-500' : 'text-slate-900'}`}>
                        {med.stock_quantity}
                      </span>
                      <span className="ml-1 text-xs text-slate-400 font-bold uppercase">{med.unit || 'Birim'}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-mono font-bold text-slate-800">₺{Number(med.unit_price).toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-bold ring-1 ring-inset ${expiry.color} ${expiry.level > 0 ? 'ring-current' : 'ring-slate-200'}`}>
                        <Calendar size={14} />
                        {expiry.label}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {isOutOfStock ? (
                        <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-rose-100">STOK YOK</span>
                      ) : expiry.level === 2 ? (
                        <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-rose-200">SKT GEÇTİ</span>
                      ) : expiry.level === 1 ? (
                        <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-amber-200">AZALDI</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-emerald-100">AKTİF</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openHistory(med)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Stok Geçmişi"
                        >
                          <History size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleEdit(med)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Düzenle"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, id: med.id, loading: false })}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Sil"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredMedicines.length === 0 && !loading && (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Package size={64} className="mb-4 opacity-20" />
              <p className="text-xl font-medium italic">Kayıtlı ürün bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      <MedicineForm 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }} 
        onSuccess={fetchMedicines} 
        initialData={editingMedicine}
      />

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        loading={deleteModal.loading}
        onClose={() => setDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleDeactivate}
        title="Ürünü Sil"
        message="Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ürün artık listede görünmeyecektir."
      />

      {/* Stock History Modal */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setHistoryModal({ ...historyModal, isOpen: false })} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History className="text-amber-600" size={24} />
                  Stok Geçmişi: {historyModal.med?.name}
                </h2>
                <p className="text-sm text-slate-500 font-medium font-mono lowercase">{historyModal.med?.barcode}</p>
              </div>
              <button 
                onClick={() => setHistoryModal({ ...historyModal, isOpen: false })}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 border-b border-slate-100">
              {historyModal.loading ? (
                <div className="p-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
              ) : historyModal.data.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">Hareket kaydı bulunamadı.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-4">Tarih</th>
                      <th className="px-8 py-4">İşlem</th>
                      <th className="px-8 py-4">Miktar</th>
                      <th className="px-8 py-4">Batch</th>
                      <th className="px-8 py-4">Not/Neden</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyModal.data.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">
                          {new Date(m.movement_date).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-8 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 
                            m.type === 'OUT' ? 'bg-rose-50 text-rose-600' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {m.type === 'IN' ? <ArrowBigUp size={12} fill="currentColor" /> : <ArrowBigDown size={12} fill="currentColor" />}
                            {m.type}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-lg font-black text-slate-800">
                          {m.type === 'OUT' ? '-' : '+'}{Number(m.quantity)}
                        </td>
                        <td className="px-8 py-4 text-xs font-mono font-bold text-slate-400 uppercase">
                          {m.Batch?.batch_number || '-'}
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-xs font-bold text-slate-700">{m.reason}</p>
                          {m.note && <p className="text-[10px] text-slate-400 font-medium italic">{m.note}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="px-8 py-4 bg-slate-50 flex justify-end">
               <button 
                  onClick={() => setHistoryModal({ ...historyModal, isOpen: false })}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl transition-all"
               >
                  KAPAT
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
