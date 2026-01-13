
import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../App';
import ProductCard from '../components/ProductCard';
import { TRANSLATIONS, CATEGORY_TRANSLATIONS } from '../constants';
import { Language } from '../types';

const Catalog: React.FC = () => {
  const { lang, items, loading } = useAppContext();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || '';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [sortOrder, setSortOrder] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  // Dynamic categories based on actual items
  const categories = useMemo(() => {
    const uniqueCats = new Set(items.map(i => i.cf_category_en).filter(c => c && c !== 'Other'));
    return Array.from(uniqueCats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const name = (lang === Language.PL ? item.cf_item_name_pl : item.cf_item_name_en).toLowerCase();
      const cat = item.cf_category_en; // Filter by internal EN name for consistency
      const sku = item.sku.toLowerCase();

      const matchesSearch = name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === '' || cat === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    if (sortOrder === 'price-asc') result.sort((a, b) => a.rate - b.rate);
    if (sortOrder === 'price-desc') result.sort((a, b) => b.rate - a.rate);

    return result;
  }, [items, search, categoryFilter, sortOrder, lang]);

  return (
    <div className="flex flex-col gap-10">
      {/* Search & Filtering Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {categoryFilter ? CATEGORY_TRANSLATIONS[categoryFilter][lang] : TRANSLATIONS.allProducts[lang]}
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">
              Znaleziono {filteredItems.length} produktów
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 px-2 uppercase tracking-tighter">
              Sortuj:
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 text-sm font-black text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 appearance-none shadow-sm cursor-pointer"
            >
              <option value="newest">Najnowsze</option>
              <option value="price-asc">Cena: rosnąco</option>
              <option value="price-desc">Cena: malejąco</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative">
            <i data-lucide="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"></i>
            <input
              type="text"
              placeholder={TRANSLATIONS.searchPlaceholder[lang]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-16 pr-8 py-5 outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-lg placeholder:text-gray-300"
            />
          </div>

          <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${categoryFilter === ''
                ? 'bg-brand-600 text-white border-brand-600 shadow-xl shadow-brand-100'
                : 'bg-white text-gray-400 border-gray-100 hover:border-brand-200'
                }`}
            >
              Wszystkie
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${categoryFilter === cat
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xl shadow-brand-100'
                  : 'bg-white text-gray-400 border-gray-100 hover:border-brand-200'
                  }`}
              >
                {CATEGORY_TRANSLATIONS[cat]?.[lang] || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-100 rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <ProductCard key={item.item_id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
            <i data-lucide="package-search" className="w-12 h-12"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Brak wyników</h2>
          <p className="text-gray-500 font-medium">Spróbuj wpisać inną frazę lub zmienić kategorię.</p>
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); }}
            className="mt-6 text-brand-600 font-black text-sm uppercase tracking-widest hover:underline"
          >
            Resetuj filtry
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalog;
