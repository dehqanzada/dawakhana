import React, { useState, useEffect } from 'react';
import { 
  PackageSearch, 
  PlusCircle, 
  Search, 
  Calendar, 
  Hash, 
  Barcode, 
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  History,
  Trash2,
  Edit2,
  Save,
  X,
  Filter
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const StockOperations = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // New Entry Form State
  const [formData, setFormData] = useState({
    batchNumber: '',
    batchBarcode: '',
    expiryDate: '',
    quantity: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // History State
  const [historyData, setHistoryData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, loading: false });
  const [editingBatch, setEditingBatch] = useState(null);

  useEffect(() => {
    if (activeTab === 'new' && searchTerm.length > 1) {
      searchMedicines();
    } else {
      setMedicines([]);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const searchMedicines = async () => {
    setLoading(true);
    try {
      const data = await window.api.medicine.getAll();
      const filtered = data.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.barcode?.includes(searchTerm)
      );
      setMedicines(filtered.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await window.api.batch.getByDateRange(dateRange.start, dateRange.end);
      setHistoryData(data);
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelect = (med) => {
    setSelectedMed(med);
    setSearchTerm('');
    setMedicines([]);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.batch.add({
        medicineId: selectedMed.id,
        ...formData,
        userId: user.id
      });
      
      setSuccess(true);
      setFormData({
        batchNumber: '',
        batchBarcode: '',
        expiryDate: '',
        quantity: ''
      });
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.batch.remove(deleteModal.id, user.id);
      await fetchHistory();
      setDeleteModal({ isOpen: false, id: null, loading: false });
    } catch (err) {
      alert('Hata: ' + err.message);
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.batch.update(editingBatch.id, {
        batchNumber: editingBatch.batch_number,
        batchBarcode: editingBatch.batch_barcode,
        expiryDate: editingBatch.expiry_date,
        quantity: editingBatch.total_quantity
      }, user.id);
      
      setEditingBatch(null);
      await fetchHistory();
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <PackageSearch className="text-blue-600" size={32} />
              Stok İşlemleri
            </h1>
            <p className="text-slate-500 font-medium">Yeni mal girişi ve giriş geçmişi yönetimi</p>
          </div>

          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
            <button 
              onClick={() => setActiveTab('new')}
              className={`px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <PlusCircle size={18} />
              YENİ GİRİŞ
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History size={18} />
              GİRİŞ GEÇMİŞİ
            </button>
          </div>
        </div>

        {activeTab === 'new' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* New Entry View (Already Implemented) */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
                <label className="block text-xs font-black text-slate-400 uppercase mb-3 text-center">İlaç Ara</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="İsim veya Barkod..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {medicines.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-50 border-t-0 rounded-t-none">
                    {medicines.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => handleSelect(m)}
                        className="w-full p-4 text-left hover:bg-blue-50 transition-colors flex flex-col"
                      >
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">{m.barcode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMed && (
                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 animate-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <PackageCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-black leading-tight text-lg">{selectedMed.name}</h3>
                      <p className="text-xs text-blue-100 font-medium">{selectedMed.Brand?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                    <div>
                      <p className="text-[10px] font-black text-blue-200 uppercase">Mevcut Stok</p>
                      <p className="text-2xl font-black">{selectedMed.stock_quantity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-200 uppercase">Birim</p>
                      <p className="text-lg font-bold">{selectedMed.unit}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {!selectedMed ? (
                <div className="h-full min-h-[400px] border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                  <PlusCircle size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-black italic">Önce bir ilaç seçiniz</p>
                  <p className="text-sm font-medium">Stok girişi yapmak istediğiniz ilacı soldaki kutudan arayarak seçin.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-8 animate-in zoom-in duration-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <ArrowUpRight className="text-emerald-500" size={24} />
                      Yeni Mal Girişi
                    </h2>
                    {success && (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <CheckCircle2 size={16} />
                        KAYIT BAŞARILI
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 underline decoration-slate-200">
                        <Hash size={14} /> Batch No / Parti No
                      </label>
                      <input 
                        required
                        type="text"
                        placeholder="Örn: BT12345"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                        <Barcode size={14} /> Batch Barkodu (Opsiyonel)
                      </label>
                      <input 
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700 font-mono"
                        value={formData.batchBarcode}
                        onChange={(e) => setFormData({...formData, batchBarcode: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                        <Calendar size={14} /> Son Kullanma Tarihi
                      </label>
                      <input 
                        required
                        type="date"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 text-blue-600">
                        <PlusCircle size={14} /> Giren Miktar
                      </label>
                      <input 
                        required
                        type="number"
                        placeholder="0"
                        className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-black text-blue-700 text-xl"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    <button type="button" onClick={() => setSelectedMed(null)} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl transition-all">VAZGEÇ</button>
                    <button type="submit" disabled={submitLoading} className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                      {submitLoading ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle2 size={24} /> STOK GİRİŞİNİ TAMAMLA</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* History View */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-600"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                </div>
                <span className="text-slate-300 font-bold"> - </span>
                <div className="relative flex-1 md:w-48">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-600"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={fetchHistory}
                disabled={historyLoading}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                {historyLoading ? <Loader2 className="animate-spin" size={20} /> : <><Filter size={18} /> LİSTELE</>}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left order-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Tarih</th>
                    <th className="px-8 py-4">İlaç</th>
                    <th className="px-8 py-4">Batch No</th>
                    <th className="px-8 py-4">SKT</th>
                    <th className="px-8 py-4 text-center">Girilen Miktar</th>
                    <th className="px-8 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">
                        {new Date(b.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 underline decoration-blue-100">{b.Medicine?.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{b.Medicine?.unit}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono font-black text-slate-600">{b.batch_number}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-700">{new Date(b.expiry_date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-xl font-black text-emerald-600">+{Number(b.total_quantity)}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingBatch(b)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Düzenle"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, id: b.id, loading: false })}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="İşlemi İptal Et / Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && !historyLoading && (
                    <tr>
                      <td colSpan="6" className="px-8 py-20 text-center text-slate-400 italic font-medium">Bu tarih aralığında giriş kaydı bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        loading={deleteModal.loading}
        onClose={() => setDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleDeleteEntry}
        title="Stok Girişini Sil"
        message="Bu stok giriş işlemini silmek istediğinize emin misiniz? İlaç toplam stoğu ve bu parti (batch) kaydı otomatik olarak geri alınacaktır."
      />

      {/* Edit Entry Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingBatch(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Edit2 className="text-blue-600" size={28} />
              Girişi Düzenle
            </h3>
            <form onSubmit={handleUpdateEntry} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-slate-50 p-4 rounded-2xl mb-2">
                   <p className="text-xs font-black text-slate-400 uppercase">Düzenlenen İlaç</p>
                   <p className="font-black text-slate-800">{editingBatch.Medicine?.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Batch No</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold"
                    value={editingBatch.batch_number}
                    onChange={(e) => setEditingBatch({...editingBatch, batch_number: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">SKT</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold"
                    value={editingBatch.expiry_date.split('T')[0]}
                    onChange={(e) => setEditingBatch({...editingBatch, expiry_date: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Giren Miktar</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-black text-xl text-blue-700"
                    value={editingBatch.total_quantity}
                    onChange={(e) => setEditingBatch({...editingBatch, total_quantity: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingBatch(null)} className="flex-1 px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">VAZGEÇ</button>
                <button type="submit" disabled={submitLoading} className="flex-[2] px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                  {submitLoading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> GÜNCELLE</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockOperations;
