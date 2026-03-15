import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  CreditCard, 
  History, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';
import CustomerForm from '../components/CustomerForm';
import ConfirmModal from '../components/ConfirmModal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, loading: false });
  const [paymentDeleteModal, setPaymentDeleteModal] = useState({ isOpen: false, id: null, loading: false });
  const [editingPayment, setEditingPayment] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await window.api.customer.getAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    try {
      const detail = await window.api.customer.getDebt(id);
      setCustomerDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setCustomerDetail(null);
    }
  }, [selectedId]);

  const handleReceivePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0 || !selectedId) return;

    setPaymentLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.payment.create({
        customerId: selectedId,
        amount: parseFloat(paymentAmount),
        type: 'tahsilat',
        userId: user.id,
        note: 'Cari tahsilat'
      });
      setPaymentAmount('');
      fetchCustomers();
      fetchDetail(selectedId);
    } catch (err) {
      alert('Ödeme hatası: ' + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.customer.remove(deleteModal.id, user.id);
      setSelectedId(null);
      await fetchCustomers();
      setDeleteModal({ isOpen: false, id: null, loading: false });

    } catch (err) {
      alert('Hata: ' + err.message);
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEditPayment = (transaction) => {
    // Only for PAYMENTS
    if (transaction.type !== 'PAYMENT') return;
    setEditingPayment({
      id: transaction.id,
      amount: transaction.amount,
      note: transaction.note || ''
    });
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.payment.update({
        id: editingPayment.id,
        amount: parseFloat(editingPayment.amount),
        note: editingPayment.note,
        userId: user.id
      });
      setEditingPayment(null);
      fetchCustomers();
      fetchDetail(selectedId);
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    setPaymentDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await window.api.payment.remove({
        id: paymentDeleteModal.id,
        userId: user.id
      });
      await fetchCustomers();
      await fetchDetail(selectedId);
      setPaymentDeleteModal({ isOpen: false, id: null, loading: false });
    } catch (err) {
      alert('Hata: ' + err.message);
      setPaymentDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  const selectedCustomer = customers.find(c => c.id === selectedId);

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      
      {/* Left Panel: Customer List */}
      <div className="w-96 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Müşteriler
          </h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            title="Yeni Müşteri"
          >
            <UserPlus size={20} />
          </button>
        </div>

        <div className="p-4 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Ara (İsim/Tel)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : filteredCustomers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full p-6 text-left hover:bg-slate-50 transition-all flex flex-col gap-1 relative ${selectedId === c.id ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{c.name}</span>
                <span className={`text-sm font-black font-mono ${parseFloat(c.balance) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  ₺{parseFloat(c.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Phone size={12} />
                {c.phone}
              </div>
              {selectedId === c.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Customer Detail */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {!selectedId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <Users size={100} strokeWidth={1} />
            <p className="mt-4 text-xl font-medium">Müşteri detayını görmek için sol listeden seçim yapın</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Customer Summary Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCustomer?.name?.substring(0, 1).toUpperCase()}
                  </div>
                   <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black text-slate-800">{selectedCustomer?.name}</h2>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(selectedCustomer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <Edit2 size={18} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, id: selectedCustomer.id, loading: false })}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                       <Phone size={16} /> {selectedCustomer?.phone}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-20">
                  Adres: <span className="text-slate-600 normal-case">{selectedCustomer?.address || 'Belirtilmemiş'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Borç Bakiyesi</p>
                <h3 className={`text-5xl font-black font-mono ${parseFloat(selectedCustomer?.balance) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  ₺{parseFloat(selectedCustomer?.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">Kredi Limiti: ₺{parseFloat(selectedCustomer?.credit_limit).toFixed(2)}</p>
              </div>
            </div>

            {/* Quick Actions / Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                        <Wallet size={24} />
                        Ödeme Al
                      </h4>
                      <p className="text-emerald-100 text-sm font-medium">Müşteriden borç tahsilatı yapın</p>
                    </div>

                    <div className="mt-8 flex gap-3">
                      <input 
                        type="number"
                        placeholder="Miktar ₺"
                        className="flex-1 bg-white/20 border-white/20 rounded-xl px-4 py-3 outline-none text-white font-mono font-bold placeholder:text-emerald-200"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                      <button 
                        disabled={paymentLoading || !paymentAmount}
                        onClick={handleReceivePayment}
                        className="px-6 py-3 bg-white text-emerald-600 font-black rounded-xl hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {paymentLoading ? <Loader2 size={24} className="animate-spin" /> : 'ONAYLA'}
                      </button>
                    </div>
                  </div>
                  <CreditCard className="absolute -bottom-10 -right-10 opacity-10" size={200} />
               </div>

               <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                   <AlertCircle size={28} />
                 </div>
                 <h4 className="font-bold text-slate-800">Müşteri Notu</h4>
                 <p className="text-sm text-slate-400 mt-1 italic">Henüz bir not eklenmemiş.</p>
               </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <History size={18} className="text-blue-600" />
                  Son 20 İşlem
                </h4>
              </div>

              {detailLoading ? (
                <div className="p-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customerDetail?.transactions?.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 italic font-medium text-sm">
                      Henüz işlem kaydı bulunmuyor.
                    </div>
                  ) : customerDetail?.transactions?.map((t, idx) => (
                     <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group/item">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'SALE' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {t.type === 'SALE' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {t.type === 'SALE' ? 'Satış İşlemi' : 'Ödeme (Tahsilat)'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium uppercase">
                            {new Date(t.date).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {t.type === 'PAYMENT' && isAdmin && (
                          <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all">
                             <button 
                              onClick={() => handleEditPayment(t)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Düzenle"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => setPaymentDeleteModal({ isOpen: true, id: t.id, loading: false })}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <div className="text-right">
                          <p className={`font-black font-mono text-lg ${t.type === 'SALE' ? 'text-slate-800' : 'text-emerald-600'}`}>
                            {t.type === 'SALE' ? '+' : '-'}{parseFloat(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </p>
                          {t.note && <p className="text-[10px] text-slate-400 lowercase">{t.note}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

       <CustomerForm 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }} 
        onSuccess={fetchCustomers} 
        initialData={editingCustomer}
      />

       <ConfirmModal 
        isOpen={deleteModal.isOpen}
        loading={deleteModal.loading}
        onClose={() => setDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleDelete}
        title="Müşteriyi Sil"
        message="Bu müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz (ancak veritabanında arşivlenir)."
      />

      <ConfirmModal 
        isOpen={paymentDeleteModal.isOpen}
        loading={paymentDeleteModal.loading}
        onClose={() => setPaymentDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleDeletePayment}
        title="Tahsilatı Sil"
        message="Bu tahsilat kaydını silmek istediğinize emin misiniz? Müşteri bakiyesi otomatik olarak düzeltilecektir."
      />

      {/* Payment Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingPayment(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Edit2 className="text-blue-600" size={24} />
              Tahsilatı Düzenle
            </h3>
            <form onSubmit={handleUpdatePayment} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Miktar</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700"
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({...editingPayment, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Not</label>
                <input 
                  type="text"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700"
                  value={editingPayment.note}
                  onChange={(e) => setEditingPayment({...editingPayment, note: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingPayment(null)} className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black">VAZGEÇ</button>
                <button type="submit" disabled={paymentLoading} className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                  {paymentLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> GÜNCELLE</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
