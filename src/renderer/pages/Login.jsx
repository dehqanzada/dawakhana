import React, { useState } from "react";
import logo from "../assets/logo.png";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await window.api.auth.login(username, password);
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-10">
            <img
              src={logo}
              alt="Dawakhana Logo"
              className="w-20 h-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-black text-slate-800 uppercase italic">
              Dawakhana
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Eczane Yönetim Paneli
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 italic">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 MahiJCompany
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
