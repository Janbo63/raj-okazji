
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { TRANSLATIONS } from '../constants';
import ProductCard from '../components/ProductCard';
import { getShoppingAdvice } from '../services/geminiService';

const Home: React.FC = () => {
  const { lang, items, loading } = useAppContext();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const response = await getShoppingAdvice(aiQuery, lang);
    setAiResponse(response);
    setAiLoading(false);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] sm:h-[600px] rounded-[3rem] overflow-hidden bg-gray-900 group shadow-2xl">
        <img 
          src="https://images.rajokazji.com/hero_store.jpg" 
          onError={(e) => {
             (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=2000&auto=format&fit=crop";
          }}
          alt="Raj Okazji Store Interior"
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/30 sm:to-transparent flex flex-col justify-end sm:justify-center px-8 sm:px-16 pb-12 sm:pb-0 text-white max-w-5xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-brand-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg">
              {TRANSLATIONS.ukOutlet[lang]}
            </span>
            <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/20">
              {TRANSLATIONS.conditionChecked[lang]}
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
            {TRANSLATIONS.heroTitle[lang]}
          </h1>
          <p className="text-xl sm:text-2xl opacity-90 mb-10 max-w-xl leading-relaxed font-medium">
            {TRANSLATIONS.heroSubtitle[lang]}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/catalog" 
              className="bg-brand-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-900/40 active:scale-95 flex items-center gap-2"
            >
              {TRANSLATIONS.shopNow[lang]}
              <i data-lucide="arrow-right" className="w-5 h-5"></i>
            </Link>
            <div className="flex items-center gap-4 text-sm font-bold border border-white/20 px-6 py-5 rounded-2xl bg-white/5 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <i data-lucide="shield-check" className="w-6 h-6"></i>
              </div>
              <div>
                <p className="text-white">{TRANSLATIONS.qualityGuarantee[lang]}</p>
                <p className="text-xs opacity-60 font-medium">{TRANSLATIONS.manuallyVerified[lang]}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-brand-600 rounded-full"></span>
          {TRANSLATIONS.popularCategories[lang]}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Tools & DIY', pl: 'Narzędzia', icon: 'hammer', color: 'bg-orange-100 text-orange-600' },
            { name: 'Home & Kitchen', pl: 'Dom i Kuchnia', icon: 'home', color: 'bg-blue-100 text-blue-600' },
            { name: 'Electronics', pl: 'Elektronika', icon: 'cpu', color: 'bg-brand-100 text-brand-600' },
            { name: 'Garden', pl: 'Ogród', icon: 'leaf', color: 'bg-green-100 text-green-600' },
            { name: 'Clothes', pl: 'Odzież', icon: 'shirt', color: 'bg-pink-100 text-pink-600' }
          ].map(cat => (
            <Link 
              key={cat.name}
              to={`/catalog?category=${cat.name}`}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all text-center group"
            >
              <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <i data-lucide={cat.icon} className="w-8 h-8"></i>
              </div>
              <span className="font-bold text-gray-900">{lang === 'pl' ? cat.pl : cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">{TRANSLATIONS.newInStock[lang]}</h2>
            <p className="text-gray-500 font-medium mt-1">{TRANSLATIONS.latestDelivery[lang]}</p>
          </div>
          <Link to="/catalog" className="text-brand-600 font-black text-sm uppercase tracking-widest hover:underline hidden sm:block">
            {TRANSLATIONS.viewAll[lang]} &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 animate-pulse h-96 rounded-3xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {items.slice(0, 4).map(item => (
              <ProductCard key={item.item_id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* AI Assistant Banner */}
      <section className="bg-brand-900 rounded-[3rem] p-8 sm:p-16 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-400 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="flex items-center gap-2 text-brand-300 font-black uppercase text-xs tracking-widest mb-6">
              <i data-lucide="sparkles" className="w-5 h-5"></i>
              {TRANSLATIONS.aiExpertTitle[lang]}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">{TRANSLATIONS.aiQuestionPrompt[lang]}</h2>
            <p className="text-brand-100 text-lg mb-10 leading-relaxed font-medium">
              {TRANSLATIONS.aiQuestionDescription[lang]}
            </p>
            <form onSubmit={handleAiAsk} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder={TRANSLATIONS.aiInputPlaceholder[lang]}
                className="flex-grow bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-400 transition-all placeholder:text-white/40 font-medium"
              />
              <button 
                type="submit"
                disabled={aiLoading}
                className="bg-white text-brand-900 px-8 py-4 rounded-2xl font-black hover:bg-brand-50 transition-all disabled:opacity-50 whitespace-nowrap shadow-xl"
              >
                {aiLoading ? TRANSLATIONS.aiButtonLoading[lang] : TRANSLATIONS.aiButtonLabel[lang]}
              </button>
            </form>
            {aiResponse && (
              <div className="mt-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 animate-in fade-in slide-in-from-top-4">
                <p className="text-sm font-bold text-brand-200 mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <i data-lucide="bot" className="w-4 h-4"></i> {TRANSLATIONS.aiAssistantLabel[lang]}:
                </p>
                <p className="text-brand-50 leading-relaxed font-medium italic">"{aiResponse}"</p>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-[2.5rem] border border-white/10 rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0ad3234ee949?q=80&w=1200&auto=format&fit=crop" 
                className="rounded-[2rem] shadow-xl grayscale-[0.2] hover:grayscale-0 transition-all"
                alt="Shopping Expert"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
