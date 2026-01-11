import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Language, CartItem, ZohoItem, User } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import { fetchItems } from './services/zohoService';

// Define global interface for Lucide icon library loaded via CDN/Script
declare global {
  interface Window {
    lucide?: {
      createIcons: () => void;
    };
  }
}

// Component to refresh icons on navigation
const IconRefresh: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    // Check if lucide is available on the window object
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [location]);
  return null;
};

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  cart: CartItem[];
  addToCart: (item: ZohoItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
  items: ZohoItem[];
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const App: React.FC = () => {
  console.log("Raj Okazji App v3.1 Initialized");
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('raj_okazji_lang');
    return (saved as Language) || Language.PL;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('raj_okazji_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ZohoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('raj_okazji_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('raj_okazji_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const fetched = await fetchItems();
        setItems(fetched);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const addToCart = (item: ZohoItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.item_id);
      if (existing) {
        return prev.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item_id !== itemId));
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return removeFromCart(itemId);
    setCart(prev => prev.map(i => i.item_id === itemId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const value = useMemo(() => ({
    lang, setLang, cart, addToCart, removeFromCart, updateQuantity, clearCart, user, setUser, items, loading
  }), [lang, cart, user, items, loading]);

  return (
    <AppContext.Provider value={value}>
      <Router>
        <IconRefresh />
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<div className="p-8 text-center text-gray-500">Konto użytkownika - Wkrótce (Faza 2)</div>} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="grid md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-4xl font-script text-brand-600">Raj Okazji</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Twój zaufany dostawca wysokiej jakości zwrotów konsumenckich i nadwyżek magazynowych z UK. Oszczędzaj do 70% na markowych produktach.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 mb-6">Sklep</h4>
                  <ul className="space-y-3 text-sm font-bold text-gray-600">
                    <li><Link to="/catalog" className="hover:text-brand-600">Nowości</Link></li>
                    <li><Link to="/catalog" className="hover:text-brand-600">Kategorie</Link></li>
                    <li><Link to="/catalog" className="hover:text-brand-600">Oferty Dnia</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 mb-6">Pomoc</h4>
                  <ul className="space-y-3 text-sm font-bold text-gray-600">
                    <li><Link to="/returns" className="hover:text-brand-600">Polityka Zwrotów</Link></li>
                    <li><Link to="/contact" className="hover:text-brand-600">Kontakt</Link></li>
                    <li><Link to="/faq" className="hover:text-brand-600">FAQ</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 mb-6">Social Media</h4>
                  <div className="flex gap-4">
                    <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-brand-100 hover:text-brand-600 transition-all">
                      <i data-lucide="facebook" className="w-5 h-5"></i>
                    </button>
                    <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-brand-100 hover:text-brand-600 transition-all">
                      <i data-lucide="instagram" className="w-5 h-5"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-100 text-center">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">
                  &copy; {new Date().getFullYear()} Raj Okazji Sp. z o.o. • Designed for Value (v3.1)
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;