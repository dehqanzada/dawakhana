import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation
} from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  RotateCcw,
  Contact
} from 'lucide-react';

import Login from './pages/Login';
import Sale from './pages/Sale';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Brands from './pages/Brands';
import StockOperations from './pages/StockOperations';
import Returns from './pages/Returns';
import UsersPage from './pages/Users';
import { Settings } from './pages/PlaceholderPages';
import logo from "./assets/logo.png";

// --- Sidebar Component ---
const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Satış', path: '/sale', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { name: 'Stok', path: '/stock', icon: Package, roles: ['admin', 'cashier'] },
    { name: 'Mal Girişi', path: '/stock-ops', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'İade İşlemleri', path: '/returns', icon: RotateCcw, roles: ['admin', 'cashier'] },
    { name: 'Markalar', path: '/brands', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Müşteriler', path: '/customers', icon: Users, roles: ['admin', 'cashier'] },
    { name: 'Kullanıcılar', path: '/users', icon: Contact, roles: ['admin'] },
    { name: 'Raporlar', path: '/reports', icon: BarChart3, roles: ['admin'] },
    { name: 'Ayarlar', path: '/settings', icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-4">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow-lg shadow-blue-500/20" />
        <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Dawakhana</h1>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Çıkış Yap"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Protected Layout ---
const AppLayout = ({ user, handleLogout }) => {
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 h-screen overflow-y-auto">
        <Routes>
          <Route path="/sale" element={<Sale />} />
          <Route path="/stock" element={<Stock />} />

          {/* Admin Only Routes */}
          {isAdmin ? (
            <>
              <Route path="/stock-ops" element={<StockOperations />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </>
          ) : (
            <>
              <Route path="/stock-ops" element={<Navigate to="/sale" />} />
              <Route path="/brands" element={<Navigate to="/sale" />} />
              <Route path="/users" element={<Navigate to="/sale" />} />
              <Route path="/reports" element={<Navigate to="/sale" />} />
              <Route path="/settings" element={<Navigate to="/sale" />} />
            </>
          )}

          <Route path="/returns" element={<Returns />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<Navigate to="/sale" />} />
        </Routes>
      </main>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <AppLayout user={user} handleLogout={handleLogout} />
      )}
    </Router>
  );
}

export default App;
