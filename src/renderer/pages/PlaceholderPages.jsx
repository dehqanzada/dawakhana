import React from 'react';

const PagePlaceholder = ({ title }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-medium">
      {title} modülü yapım aşamasında...
    </div>
  </div>
);

export const Sales = () => <PagePlaceholder title="Satış Ekranı" />;
export const Stock = () => <PagePlaceholder title="Stok Listesi" />;
export const Customers = () => <PagePlaceholder title="Müşteriler" />;
export const Reports = () => <PagePlaceholder title="Raporlar" />;
export const Settings = () => <PagePlaceholder title="Ayarlar" />;
