import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ClientGallery from './pages/ClientGallery';
import { StorageService } from './services/storageService';
import { Lock, Camera, User } from 'lucide-react';

type View = 'home' | 'admin-login' | 'admin-dashboard' | 'client-login' | 'client-gallery';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  
  // Force reset home when clicking logo
  const [homeKey, setHomeKey] = useState(0);

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'xavier.garcia.gf@gmail.com' && password === 'Tokio.1997') {
      setIsAdminAuthenticated(true);
      setCurrentView('admin-dashboard');
      setError('');
    } else {
      setError('Credenciales inválidas');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('home');
    setEmail('');
    setPassword('');
  };

  // Handle Client Login
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate against stored clients
    const isValid = StorageService.validateClient(email, password);
    
    if (isValid) {
      setClientEmail(email);
      setCurrentView('client-gallery');
      setError('');
    } else {
      setError('Correo o contraseña incorrectos.');
    }
  };

  const resetHome = () => {
      setCurrentView('home');
      setHomeKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Main Navigation Component
  const Navbar = () => (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 cursor-pointer" onClick={resetHome}>
            <span className="font-serif text-2xl tracking-widest text-white">XAVI.PH</span>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <button 
                onClick={() => {
                    setError('');
                    setEmail('');
                    setPassword('');
                    setCurrentView('client-login');
                }}
                className="text-sm uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
                Galerías Clientes
            </button>
            <button 
                onClick={() => {
                    if(isAdminAuthenticated) setCurrentView('admin-dashboard');
                    else {
                        setError('');
                        setEmail('');
                        setPassword('');
                        setCurrentView('admin-login');
                    }
                }}
                className="px-6 py-2 bg-white text-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors font-bold"
            >
                Portal
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Footer Component
  const Footer = () => (
    <footer className="bg-black border-t border-zinc-800 py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
                <h4 className="font-serif text-xl mb-2">Xavi.Ph</h4>
                <p className="text-gray-400 text-sm">Capturando legados en CDMX.</p>
            </div>
            <div className="flex space-x-6 flex-wrap justify-center">
                <a href="https://www.instagram.com/xavi.ph/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Instagram</a>
                <a href="https://www.facebook.com/p/Xaviph-61565396845921/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Facebook</a>
                <a href="https://www.tiktok.com/@xavi.phvp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">TikTok</a>
                <a href="https://api.whatsapp.com/send?phone=5215615567863" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">WhatsApp</a>
            </div>
        </div>
    </footer>
  );

  // Render Logic based on View
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <Home key={homeKey} />;
      
      case 'admin-login':
        return (
          <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded shadow-sm border border-zinc-800">
                <div className="text-center mb-8">
                    <Lock className="w-10 h-10 mx-auto text-gray-500 mb-4" />
                    <h2 className="text-2xl font-serif text-white">Acceso Administrativo</h2>
                    <p className="text-gray-400 text-sm mt-2">Ingresa tus credenciales maestras.</p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div>
                        <input 
                            type="email" 
                            placeholder="Usuario" 
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:ring-1 focus:ring-white outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:ring-1 focus:ring-white outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors">
                        Entrar al Portal
                    </button>
                </form>
                <button onClick={() => setCurrentView('home')} className="mt-6 text-sm text-gray-400 w-full text-center hover:text-white hover:underline">
                    Regresar al Inicio
                </button>
            </div>
          </div>
        );

      case 'admin-dashboard':
        return <AdminDashboard onLogout={handleAdminLogout} />;

      case 'client-login':
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded shadow-sm border border-zinc-800">
                <div className="text-center mb-8">
                    <Camera className="w-10 h-10 mx-auto text-gray-500 mb-4" />
                    <h2 className="text-2xl font-serif text-white">Área de Clientes</h2>
                    <p className="text-gray-400 text-sm mt-2">Accede a tu galería privada para seleccionar fotos.</p>
                </div>
                <form onSubmit={handleClientLogin} className="space-y-6">
                    <div>
                        <input 
                            type="email" 
                            placeholder="Correo registrado" 
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:ring-1 focus:ring-white outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Contraseña de galería" 
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:ring-1 focus:ring-white outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors">
                        Ver Galería
                    </button>
                </form>
                <button onClick={() => setCurrentView('home')} className="mt-6 text-sm text-gray-400 w-full text-center hover:text-white hover:underline">
                    Regresar al Inicio
                </button>
            </div>
          </div>
        );

      case 'client-gallery':
        return <ClientGallery clientEmail={clientEmail} onLogout={() => setCurrentView('home')} />;
        
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white bg-black">
      {currentView === 'home' && <Navbar />}
      
      <div className={`${currentView === 'home' ? 'pt-20' : ''} flex-grow`}>
        {renderContent()}
      </div>

      {currentView === 'home' && <Footer />}
    </div>
  );
};

export default App;