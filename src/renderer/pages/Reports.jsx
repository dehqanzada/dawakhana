import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  Package,
  Loader2,
  RefreshCcw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState(null);

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      switch (activeTab) {
        case 'daily':
          if (!filters.date || isNaN(new Date(filters.date).getTime())) {
            setLoading(false);
            return;
          }
          result = await window.api.report.dailyCash(filters.date);
          break;
        case 'debt':
          result = await window.api.report.debtList();
          break;
        case 'stock':
          result = await window.api.report.stockAlert();
          break;
        case 'analysis':
          if (new Date(filters.startDate) > new Date(filters.endDate)) {
            showFeedback('error', 'Başlangıç tarihi bitiş tarihinden sonra olamaz.');
            setLoading(false);
            return;
          }
          result = await window.api.report.salesSummary(filters.startDate, filters.endDate);
          break;
      }
      setData(result);
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      showFeedback('error', 'Hata: ' + cleanMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null); // Clear old data to prevent layout/structure mismatch
    fetchData();
  }, [activeTab, filters.date, filters.startDate, filters.endDate]); // Added all relevant dependencies

  const renderTabContent = () => {
    if (loading && !data) return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

    switch (activeTab) {
      case 'daily': return renderDailyCash();
      case 'debt': return renderDebtList();
      case 'stock': return renderStockAlerts();
      case 'analysis': return renderAnalysis();
      default: return null;
    }
  };

  const renderDailyCash = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Nakit Satışlar" value={data?.cashSales} color="blue" icon={DollarSign} />
        <StatCard title="Veresiye Satışlar" value={data?.creditSales} color="amber" icon={CreditCard} />
        <StatCard title="Tahsilatlar" value={data?.collections} color="emerald" icon={TrendingUp} />
        <StatCard title="İadeler" value={data?.returns} color="rose" icon={RefreshCcw} negative />
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Net Kasa Durumu</p>
          <div className="flex items-end gap-3">
             <h3 className="text-6xl font-black font-mono">₺{data?.netCash?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
             <span className="mb-2 text-emerald-400 font-bold flex items-center gap-1">
               <TrendingUp size={20} /> Günlük
             </span>
          </div>
          <p className="mt-4 text-slate-500 text-sm max-w-md italic">
            * Net Kasa = (Nakit Satışlar + Tahsilatlar) - İadeler. Veresiye satışlar kasaya nakit girişi sağlamadığı için dahil edilmez.
          </p>
        </div>
        <DollarSign className="absolute -bottom-10 -right-10 text-white/5 opacity-10" size={300} />
      </div>
    </div>
  );

  const renderDebtList = () => (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-widest text-slate-400">
          <tr>
            <th className="px-8 py-5">Müşteri</th>
            <th className="px-8 py-5">Telefon</th>
            <th className="px-8 py-5 text-right">Borç Bakiyesi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.isArray(data) && data.map((c, idx) => (
            <tr key={c.id || idx} className="hover:bg-slate-50 transition-colors">
              <td className="px-8 py-5 font-bold text-slate-800">{c.name}</td>
              <td className="px-8 py-5 text-slate-500 font-medium">{c.phone}</td>
              <td className="px-8 py-5 text-right font-mono font-black text-rose-500 text-lg">₺{parseFloat(c.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStockAlerts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {Array.isArray(data) && data.map((alert, idx) => (
        <div key={idx} className={`p-6 rounded-2xl border flex items-center gap-6 ${
          alert.type === 'LOW_STOCK' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
        }`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            alert.type === 'LOW_STOCK' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
            <AlertTriangle size={28} />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-slate-800">{alert.medicineName}</h4>
            <div className="flex gap-4 mt-1">
              <p className="text-xs font-bold text-slate-400">PARTİ: <span className="text-slate-600">{alert.batchNumber}</span></p>
              <p className="text-xs font-bold text-slate-400">ADET: <span className="text-slate-600">{alert.remainingQuantity}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">DURUM</p>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black text-white ${
              alert.type === 'LOW_STOCK' ? 'bg-amber-500' : 'bg-rose-500'
            }`}>
              {alert.type === 'LOW_STOCK' ? 'AZALAN STOK' : 'KRİTİK SKT'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-3xl border border-slate-200">
         <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tarih Aralığı</label>
            <div className="flex items-center gap-3">
              <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all" />
              <ArrowRight size={20} className="text-slate-300" />
              <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all" />
              <button onClick={fetchData} className="ml-4 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                <Search size={20} />
              </button>
            </div>
         </div>
         <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Toplam Satış Adedi</p>
              <p className="text-2xl font-black text-slate-900">{data?.summary?.totalQuantity}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Toplam Ciro</p>
              <p className="text-2xl font-black text-blue-600">₺{data?.summary?.totalRevenue?.toLocaleString('tr-TR')}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={20} />
          <h4 className="font-black text-slate-800 text-sm tracking-widest uppercase">En Çok Satan Ürünler (Top 10)</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {data?.topProducts?.map((p, idx) => (
            <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm">#{idx+1}</span>
                <span className="font-extrabold text-slate-800">{p.medicine_name}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-900">{p.total_quantity}</span>
                <span className="ml-2 text-xs text-slate-400 font-bold uppercase">ADET</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={40} />
            Raporlar & Analiz
          </h1>
          <p className="text-slate-500 font-medium">İşletme performansı ve kritik stok verileri</p>
        </div>

        <div className="flex bg-white p-2 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100">
          <TabButton id="daily" label="Günlük Kasa" active={activeTab} set={setActiveTab} icon={Calendar} />
          <TabButton id="debt" label="Veresiye Listesi" active={activeTab} set={setActiveTab} icon={CreditCard} />
          <TabButton id="stock" label="Stok Uyarıları" active={activeTab} set={setActiveTab} icon={AlertTriangle} />
          <TabButton id="analysis" label="Satış Analizi" active={activeTab} set={setActiveTab} icon={TrendingUp} />
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="mb-8 flex justify-end">
           <input 
            type="date" 
            className="bg-white border border-slate-200 shadow-sm rounded-xl px-6 py-3 font-bold text-slate-800 outline-none ring-4 ring-transparent focus:ring-blue-500/10 transition-all cursor-pointer" 
            value={filters.date}
            onChange={e => setFilters({...filters, date: e.target.value})}
           />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

const TabButton = ({ id, label, active, set, icon: Icon }) => (
  <button
    onClick={() => set(id)}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
      active === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const StatCard = ({ title, value, color, icon: Icon, negative }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className={`text-2xl font-black font-mono mt-1 ${negative ? 'text-rose-500' : 'text-slate-900'}`}>
        {negative && '-' }₺{value?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default Reports;
