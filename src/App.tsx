import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // محاكاة تسجيل دخول ناجح بدون الحاجة لقاعدة بيانات خارجية
    if (email && password) {
      setIsLoggedIn(true);
    } else {
      alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 text-amber-400">مرحباً بك في منصة مرحباً NFC</h1>
          <p className="text-neutral-400 mb-6">تم تسجيل الدخول بنجاح عبر النظام المحلي المستقر!</p>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6" dir="rtl">
      <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
        <div className="w-10"></div>
        <div className="text-center font-bold text-lg text-amber-400">منصة مرحباً NFC</div>
        <button className="text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-300">
          English
        </button>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-amber-600 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <h2 className="text-xl font-semibold text-white">تسجيل الدخول</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">البريد الإلكتروني</label>
            <input 
              type="email5" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3.5 rounded-xl transition shadow-lg shadow-amber-500/10 mt-2"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 text-center">
          <button className="w-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
            <span>الدخول بحساب Google</span>
          </button>
        </div>
      </div>

      <div className="text-center pb-4 text-xs text-neutral-500">
        ليس لديك حساب؟ <span className="text-amber-400 cursor-pointer">إنشاء حساب</span>
      </div>
    </div>
  );
}
