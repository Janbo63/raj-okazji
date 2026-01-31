
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Tag, Search, ShoppingCart, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { lang, setLang, cart } = useAppContext();
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 group relative">
          <div className="relative flex items-center bg-brand-50 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border border-brand-100 shadow-sm group-hover:bg-brand-100 transition-all duration-300">
            <div className="absolute -top-2 -left-2 bg-brand-600 text-white p-1.5 rounded-lg rotate-[-15deg] shadow-lg group-hover:rotate-0 transition-transform hidden sm:block">
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-4xl font-script text-brand-700 leading-none pb-1 select-none whitespace-nowrap">
              Raj Okazji
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 font-bold text-gray-500">
          <Link to="/catalog" className="hover:text-brand-600 transition-colors uppercase tracking-widest text-[11px]">
            {TRANSLATIONS.allProducts[lang]}
          </Link>
          <Link to="/catalog?category=Home & Kitchen" className="hover:text-brand-600 transition-colors uppercase tracking-widest text-[11px] whitespace-nowrap">
            Dom i Kuchnia
          </Link>
          <Link to="/catalog?category=Tools & DIY" className="hover:text-brand-600 transition-colors uppercase tracking-widest text-[11px] whitespace-nowrap">
            Narzędzia
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
            <button
              onClick={() => setLang(Language.PL)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${lang === Language.PL ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}
            >
              PL
            </button>
            <button
              onClick={() => setLang(Language.EN)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${lang === Language.EN ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => navigate('/catalog')}
            className="p-3 text-gray-500 hover:bg-brand-50 hover:text-brand-600 rounded-2xl transition-all"
            aria-label="Search"
          >
            <Search className="w-6 h-6" />
          </button>

          <Link to="/checkout" className="relative p-3 text-gray-500 hover:bg-brand-50 hover:text-brand-600 rounded-2xl transition-all">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center border-2 border-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>

          <Link to="/account" className="p-3 text-gray-500 hover:bg-brand-50 hover:text-brand-600 rounded-2xl transition-all hidden sm:block">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
