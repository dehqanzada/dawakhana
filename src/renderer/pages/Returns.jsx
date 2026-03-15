import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Search as SearchIcon, 
  RotateCcw, 
  Calendar, 
  User as UserIcon,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronDown,
  History
} from 'lucide-react';

const Returns = () => {
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 7 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [message, setMessage] = useState(null);
  const [returnForm, setReturnForm] = useState({
    saleItem: null,
    quantity: 1,
    reason: ''
  });

  const [returnHistory, setReturnHistory] = useState([]);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await window.api.sale.getByDateRange(new Date(startDate), new Date(endDate + 'T23:59:59'));
      setSales(data);
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      showFeedback('error', 'Satışlar yüklenirken hata oluştu: ' + cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSelectSale = async (sale) => {
    setSelectedSale(sale);
    setReturnForm({ saleItem: null, quantity: 1, reason: '' });
    
    // Fetch return history for this sale
    try {
      const history = await window.api.return.getBySale(sale.id);
      setReturnHistory(history);
    } catch (err) {
      console.error('Return history error:', err);
    }
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedSale || returnForm.quantity <= 0) return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.return.create({
        saleId: selectedSale.id,
        quantity: returnForm.quantity,
        reason: returnForm.reason || 'Müşteri iadesi',
        userId: user.id
      });

      showFeedback('success', 'İade başarıyla tamamlandı. Stok güncellendi.');
      setReturnForm({ saleItem: null, quantity: 1, reason: '' });
      
      // Refresh sale data and history
      handleSearch();
      handleSelectSale(selectedSale);
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      showFeedback('error', 'İade hatası: ' + cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all animate-bounce ${
          message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <RotateCcw className="text-white" size={32} />
            </div>
            İade İşlemleri
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Satılan ürünlerin iadesini yönetin ve stoklarınızı güncelleyin.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Sale Search */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search size={18} className="text-blue-600" />
                Satış Ara
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Başlangıç</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border-none rounded-xl p-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bitiş</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border-none rounded-xl p-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <SearchIcon size={18} />}
                Satışları Getir
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Satış Listesi</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-sm">
                {sales.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 italic">Seçilen tarihlerde satış bulunamadı.</div>
                ) : (
                  sales.map(sale => (
                    <button
                      key={sale.id}
                      onClick={() => handleSelectSale(sale)}
                      className={`w-full p-4 flex items-center justify-between text-left transition-all hover:bg-blue-50/50 ${
                        selectedSale?.id === sale.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-transparent'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800">#{sale.id} - {sale.Batch?.Medicine?.name}</div>
                        <div className="text-slate-500 text-xs flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(sale.sale_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><UserIcon size={12} /> {sale.Customer?.name || 'Perakende'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">₺{sale.total_price.toFixed(2)}</div>
                        <div className="text-xs text-blue-600 font-bold uppercase">{sale.payment_type}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Return Details */}
          <div className="lg:col-span-7 space-y-6">
            {!selectedSale ? (
              <div className="h-[600px] bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                <RotateCcw size={64} strokeWidth={1} />
                <p className="mt-4 text-xl font-medium text-slate-400">İade işlemi için sol listeden bir satış seçin</p>
              </div>
            ) : (
              <>
                {/* Sale Details Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-black uppercase px-3 py-1 rounded-full mb-3 inline-block">Satış Detayı</span>
                      <h3 className="text-2xl font-black text-slate-900 italic">#{selectedSale.id} nolu İşlem</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs font-bold uppercase">Toplam Tutar</p>
                      <p className="text-3xl font-black text-slate-900">₺{selectedSale.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase">Ürün</p>
                      <p className="font-bold text-slate-800 truncate">{selectedSale.Batch?.Medicine?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase">Parti / Batch</p>
                      <p className="font-mono text-slate-600">{selectedSale.Batch?.batch_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase">Satılan Miktar</p>
                      <p className="font-bold text-slate-800">{selectedSale.quantity} Adet</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase">Müşteri</p>
                      <p className="font-bold text-slate-800">{selectedSale.Customer?.name || 'İsimsiz Müşteri'}</p>
                    </div>
                  </div>

                  {/* Return Action Form */}
                  <form onSubmit={handleProcessReturn} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <RotateCcw size={16} className="text-rose-500" />
                      İade Al
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">İade Miktarı</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedSale.quantity}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          value={returnForm.quantity}
                          onChange={(e) => setReturnForm({ ...returnForm, quantity: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">İade Nedeni</label>
                        <input
                          type="text"
                          placeholder="Örn: Hatalı ürün, Vazgeçme..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          value={returnForm.reason}
                          onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-6 bg-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transform transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <RotateCcw size={20} />}
                      İADEYİ ONAYLA VE STOĞA EKLE
                    </button>
                  </form>
                </div>

                {/* Return History for this sale */}
                {returnHistory.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <History size={18} className="text-slate-400" />
                      <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Bu Satışın İade Geçmişi</h3>
                    </div>
                    <div className="divide-y divide-slate-50 text-sm">
                      {returnHistory.map(ret => (
                        <div key={ret.id} className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                              <RotateCcw size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{ret.quantity} Adet İade Alındı</p>
                              <p className="text-slate-400 text-xs italic">{ret.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500 font-medium">{new Date(ret.return_date).toLocaleDateString()}</p>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">{new Date(ret.return_date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Returns;
