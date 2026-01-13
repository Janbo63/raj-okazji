
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { ZohoItem, Language } from '../types';
import { fetchItemById } from '../services/zohoService';
import { TRANSLATIONS } from '../constants';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, addToCart } = useAppContext();
  const [item, setItem] = useState<ZohoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Combine public URLs and internal images for gallery
  const allImages = item ? [
    ...(item.image_urls || []),
    ...(item.item_images || []).map(img => `/api/zoho/images/${item.item_id}/${img.image_id}`)
  ] : [];

  // If no images at all, add a placeholder
  if (item && allImages.length === 0) {
    allImages.push(`https://picsum.photos/seed/${item.item_id}/800/800`);
  }

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchItemById(id).then(res => {
        if (res) setItem(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-20 text-center animate-pulse text-brand-600 font-black">...</div>;
  if (!item) return <div className="p-20 text-center">Not found.</div>;

  const name = lang === Language.PL ? item.cf_item_name_pl : item.cf_item_name_en;
  const description = lang === Language.PL ? item.cf_description_pl : item.cf_description_en;
  const discountPercent = item.cf_retail_price ? Math.round(((item.cf_retail_price - item.rate) / item.cf_retail_price) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-brand-600 transition-colors">Raj Okazji</Link>
        <i data-lucide="chevron-right" className="w-4 h-4"></i>
        <Link to="/catalog" className="hover:text-brand-600 transition-colors">{TRANSLATIONS.allProducts[lang]}</Link>
        <i data-lucide="chevron-right" className="w-4 h-4"></i>
        <span className="text-brand-900 truncate max-w-xs">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-12 gap-12 bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-gray-100">
        {/* Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-50 relative">
            <img
              src={item.image_urls && item.image_urls.length > 0 ? item.image_urls[activeImage] || item.image_urls[0] : 'https://placehold.co/800x800/e5e7eb/9ca3af?text=No+Image+Available'}
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x800/e5e7eb/9ca3af?text=Image+Not+Available';
              }}
              alt={name}
            />
            {discountPercent > 0 && (
              <div className="absolute top-6 left-6 bg-red-600 text-white font-black px-5 py-2 rounded-2xl shadow-xl text-xl animate-bounce">
                -{discountPercent}%
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {item.image_urls && item.image_urls.length > 0 ? (
              item.image_urls.map((img, i) => (
                <button
                  key={i}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-2 bg-white ${activeImage === i ? 'border-brand-600 opacity-100 shadow-lg' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img
                    src={img}
                    className="w-full h-full object-contain"
                    alt={`${name} ${i + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/e5e7eb/9ca3af?text=N/A';
                    }}
                  />
                </button>
              ))
            ) : (
              <div className="col-span-4 text-center text-gray-400 text-sm">No images available</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="mb-6">
            <span className="bg-brand-100 text-brand-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest">
              {lang === Language.PL ? item.cf_category_pl : item.cf_category_en}
            </span>
          </div>

          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            {name}
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center text-yellow-400">
              {[1, 2, 3, 4, 5].map(i => <i key={i} data-lucide="star" className="w-4 h-4 fill-current"></i>)}
            </div>
            <span className="text-sm text-gray-400 font-medium">{TRANSLATIONS.noReviews[lang]}</span>
          </div>

          <div className="p-8 rounded-3xl bg-brand-50/50 border border-brand-100 mb-10">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-black text-brand-700">
                {item.rate.toFixed(2)} <span className="text-lg">zł</span>
              </span>
              {item.cf_retail_price && (
                <span className="text-xl text-gray-400 line-through mb-1.5">
                  {item.cf_retail_price.toFixed(2)} zł
                </span>
              )}
            </div>
            {item.cf_retail_price && (
              <p className="text-green-600 font-bold flex items-center gap-2">
                <i data-lucide="sparkles" className="w-4 h-4"></i>
                {TRANSLATIONS.youSave[lang]} {(item.cf_retail_price - item.rate).toFixed(2)} zł
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 mb-10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest">{TRANSLATIONS.stockStatus[lang]}</span>
              <span className={`font-black ${item.available_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.available_stock > 0 ? `${TRANSLATIONS.inStock[lang]} (${item.available_stock})` : TRANSLATIONS.outOfStock[lang]}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${item.available_stock > 5 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(item.available_stock * 10, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <button
              onClick={() => addToCart(item)}
              disabled={item.available_stock <= 0}
              className="w-full bg-brand-600 text-white py-6 rounded-[1.5rem] font-black text-xl hover:bg-brand-700 shadow-xl shadow-brand-100 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              <i data-lucide="shopping-cart" className="w-6 h-6"></i>
              {TRANSLATIONS.addToCart[lang]}
            </button>
            <Link
              to="/checkout"
              className="w-full border-2 border-brand-600 text-brand-600 py-4 rounded-[1.5rem] font-bold text-center hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
            >
              {TRANSLATIONS.quickPayment[lang]} &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 mb-6">{TRANSLATIONS.productDescription[lang]}</h2>
        <div className="prose prose-brand max-w-none text-gray-600 leading-relaxed text-lg">
          <p>{description}</p>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                <i data-lucide="check" className="w-5 h-5 text-green-500"></i>
                {TRANSLATIONS.techSpecs[lang]}
              </h3>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">SKU</span>
                  <span>{item.sku}</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">{TRANSLATIONS.itemCondition[lang]}</span>
                  <span>{TRANSLATIONS.conditionGradeA[lang]}</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">{TRANSLATIONS.itemOrigin[lang]}</span>
                  <span>{TRANSLATIONS.originUK[lang]}</span>
                </li>
              </ul>
            </div>
            <div className="bg-brand-900 text-white p-6 rounded-2xl">
              <h3 className="font-black mb-4 flex items-center gap-2">
                <i data-lucide="shield-check" className="w-5 h-5 text-brand-400"></i>
                {TRANSLATIONS.ourGuaranteeTitle[lang]}
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                {TRANSLATIONS.ourGuaranteeText[lang]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
