import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const MedicineForm = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingMedicine, setExistingMedicine] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    brand_id: '',
    categories: [],
    shelf_number: '',
    unit_price: '',
    units_per_carton: '',
    batch_number: '',
    batch_barcode: '',
    expiry_date: '',
    total_quantity: '',
    carton_count: ''
  });

  useEffect(() => {
    if (isOpen) {
      window.api.medicine.getBrands().then(setBrands);
      window.api.medicine.getCategories().then(setCategories);
      
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          barcode: initialData.barcode || '',
          brand_id: initialData.brand_id?.toString() || '',
          categories: initialData.Categories?.map(c => c.id) || [],
          shelf_number: initialData.shelf_number || '',
          unit_price: initialData.unit_price || '',
          units_per_carton: initialData.units_per_carton || '',
          // Batch info is not typically edited here for existing medicines
          batch_number: '',
          batch_barcode: '',
          expiry_date: '',
          total_quantity: '',
          carton_count: ''
        });
      } else {
        setFormData({
          name: '',
          barcode: '',
          brand_id: '',
          categories: [],
          shelf_number: '',
          unit_price: '',
          units_per_carton: '',
          batch_number: '',
          batch_barcode: '',
          expiry_date: '',
          total_quantity: '',
          carton_count: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const checkBarcode = async (barcode) => {
    if (!barcode || initialData) return; // Don't check barcode when editing
    try {
      const result = await window.api.medicine.getByBarcode(barcode);
      if (result && result.type === 'medicine') {
        setExistingMedicine(result.data);
      } else {
        setExistingMedicine(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (initialData) {
        const payload = {
          name: formData.name,
          brand_id: parseInt(formData.brand_id),
          barcode: formData.barcode,
          unit_price: parseFloat(formData.unit_price),
          shelf_number: formData.shelf_number,
          units_per_carton: parseInt(formData.units_per_carton) || 0,
        };
        await window.api.medicine.update(initialData.id, payload, user.id);
      } else {
        const payload = {
          ...formData,
          brand_id: parseInt(formData.brand_id),
          unit_price: parseFloat(formData.unit_price),
          units_per_carton: parseInt(formData.units_per_carton) || 0,
          total_quantity: parseInt(formData.total_quantity),
          carton_count: parseInt(formData.carton_count) || 0,
          userId: user.id
        };
        await window.api.medicine.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Ürün Bilgilerini Düzenle' : 'Yeni İlaç / Stok Girişi'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Medicine Info */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Ürün Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">İlaç Adı</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Barkod</label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 outline-none transition-all ${existingMedicine ? 'ring-2 ring-amber-500' : 'focus:ring-blue-500'}`}
                  value={formData.barcode}
                  onChange={(e) => {
                    setFormData({...formData, barcode: e.target.value});
                    checkBarcode(e.target.value);
                  }}
                />
                {existingMedicine && (
                  <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 font-medium italic">
                    <AlertTriangle size={14} />
                    Bu ürün mevcut! Sadece yeni parti eklenecek.
                  </div>
                )}
              </div>

              <div>
                <SearchableSelect
                  label="Marka"
                  required
                  options={brands}
                  value={formData.brand_id}
                  onChange={(val) => setFormData({...formData, brand_id: val})}
                  placeholder="Seçiniz..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Birim Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Raf Numarası</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.shelf_number}
                  onChange={(e) => setFormData({...formData, shelf_number: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Initial Batch Info - ONLY for NEW items */}
          {!initialData && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">İlk Parti (Stok) Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Parti (Batch) No</label>
                  <input
                    type="text"
                    required={!initialData}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Son Kullanma Tarihi</label>
                  <input
                    type="date"
                    required={!initialData}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Gelen Miktar (Birim)</label>
                  <input
                    type="number"
                    required={!initialData}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({...formData, total_quantity: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kutu Sayısı (Opsiyonel)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.carton_count}
                    onChange={(e) => setFormData({...formData, carton_count: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicineForm;
