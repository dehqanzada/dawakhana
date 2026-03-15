import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  Trash2, 
  Minus, 
  Plus, 
  CreditCard, 
  Banknote, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Search,
  X
} from 'lucide-react';

const Sale = () => {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [paymentType, setPaymentType] = useState('nakit');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    return localStorage.getItem('pos_customer_id') || '';
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [loading, setLoading] = useState(false);

  const barcodeInputRef = useRef(null);

  // Persistence: Save cart and customer to localStorage
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_customer_id', selectedCustomerId);
  }, [selectedCustomerId]);

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const fetchCustomers = async () => {
    if (paymentType === 'veresiye') {
      const data = await window.api.customer.getAll();
      setCustomers(data);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [paymentType]);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const result = await window.api.medicine.getByBarcode(barcode);
      
      if (!result) {
        showFeedback('error', 'Ürün bulunamadı!');
      } else {
        // Result could be { type: 'batch', data: ... } or { type: 'medicine', data: ... }
        const medData = result.type === 'batch' ? result.data.Medicine : result.data;
        const batchData = result.type === 'batch' ? result.data : null;

        addToCart({
          id: medData.id,
          name: medData.name,
          unit_price: medData.unit_price,
          batch_id: batchData?.id || (medData.Batches?.[0]?.id) // Use first available batch if medicine scanned
        });
      }
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      showFeedback('error', 'Barkod okuma hatası: ' + cleanMsg);
    }

    setBarcode('');
    barcodeInputRef.current?.focus();
  };

  const addToCart = (product) => {
    if (!product.batch_id) {
      showFeedback('error', 'Bu ürün için aktif stok/parti bulunamadı.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.medicine_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        medicine_id: product.id, 
        name: product.name, 
        quantity: 1, 
        unit_price: product.unit_price 
      }];
    });
  };

  const updateQuantity = (medId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.medicine_id === medId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (medId) => {
    setCart(prev => prev.filter(item => item.medicine_id !== medId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'veresiye' && !selectedCustomerId) {
      showFeedback('error', 'Lütfen müşteri seçiniz.');
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      await window.api.sale.create({
        items: cart,
        paymentType,
        customerId: selectedCustomerId || null,
        userId: user.id
      });

      showFeedback('success', 'Satış başarıyla tamamlandı.');
      setCart([]);
      setSelectedCustomerId('');
      localStorage.removeItem('pos_cart');
      localStorage.removeItem('pos_customer_id');
      setPaymentType('nakit');
    } catch (err) {
      const cleanMsg = err.message?.includes('Error:') 
        ? err.message.split('Error:').pop().trim() 
        : err.message;
      showFeedback('error', 'Satış hatası: ' + cleanMsg);
    } finally {
      setLoading(false);
      setCustomerSearch('');
      setIsCustomerDropdownOpen(false);
      barcodeInputRef.current?.focus();
    }
  };

  const filteredCustomers = customers.filter(c => {
    const search = (customerSearch || '').toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(search);
    const phoneMatch = String(c.phone || '').includes(search);
    return nameMatch || phoneMatch;
  });

  const selectedCustomer = customers.find(c => c.id === Number(selectedCustomerId));

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all animate-bounce ${
          message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {/* Header / Barcode Input */}
      <div className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
              ref={barcodeInputRef}
              type="text"
              className="w-full pl-14 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-xl font-mono focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
              placeholder="Barkodu okutun veya manuel yazın..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </form>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Toplam Tutar</p>
          <h2 className="text-4xl font-black text-slate-900">
            ₺{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* Cart Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <ShoppingCart size={80} strokeWidth={1} />
            <p className="mt-4 text-xl font-medium">Sepetiniz boş</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ürün Adı</th>
                  <th className="px-6 py-4 text-center">Miktar</th>
                  <th className="px-6 py-4 text-right">Birim Fiyat</th>
                  <th className="px-6 py-4 text-right">Toplam</th>
                  <th className="px-6 py-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <tr key={item.medicine_id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.medicine_id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-lg font-mono font-bold w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.medicine_id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">₺{Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-extrabold text-slate-900">
                        ₺{(item.quantity * Number(item.unit_price)).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer / Checkout Controls */}
      <div className="bg-white border-t border-slate-200 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-end">
          
          {/* Payment Type */}
          <div className="w-full lg:w-auto">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Ödeme Yöntemi</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPaymentType('nakit')}
                className={`flex-1 lg:w-40 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                  paymentType === 'nakit' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Banknote size={20} />
                Nakit
              </button>
              <button
                onClick={() => setPaymentType('veresiye')}
                className={`flex-1 lg:w-40 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                  paymentType === 'veresiye' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CreditCard size={20} />
                Veresiye
              </button>
            </div>
          </div>

          {/* Customer Selection (Conditional) */}
          {paymentType === 'veresiye' && (
            <div className="flex-1 w-full animate-in fade-in slide-in-from-left-4 duration-300 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 text-emerald-600">Veresiye Müşterisi Seçin</label>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Müşteri adı veya telefon..."
                  className="w-full pl-12 pr-12 py-3 bg-slate-100 border-none rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  value={selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone}` : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomerId('');
                    if (!isCustomerDropdownOpen) setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    fetchCustomers(); // Refresh on focus
                  }}
                  onBlur={() => {
                    // Slight delay to allow clicking the dropdown options
                    setTimeout(() => setIsCustomerDropdownOpen(false), 200);
                  }}
                  readOnly={!!selectedCustomer}
                />
                
                {selectedCustomer ? (
                  <button 
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerSearch('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                ) : null}

                {/* Dropdown Options */}
                {isCustomerDropdownOpen && !selectedCustomer && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-y-auto divide-y divide-slate-50">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          className="w-full text-left px-5 py-4 hover:bg-emerald-50 transition-colors flex flex-col"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearch('');
                          }}
                        >
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-xs text-slate-400 font-medium">{c.phone}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-5 text-center text-slate-400 italic font-medium">Müşteri bulunamadı</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Button */}
          <div className="w-full lg:w-auto ml-auto">
            <button
              disabled={cart.length === 0 || loading}
              onClick={handleCompleteSale}
              className={`w-full lg:w-64 py-4 rounded-xl text-white font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                paymentType === 'nakit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? 'İşleniyor...' : 'SATIŞI TAMAMLA'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sale;
