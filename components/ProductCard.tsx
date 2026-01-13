
import React from 'react';
import { Link } from 'react-router-dom';
import { ZohoItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAppContext } from '../App';

interface ProductCardProps {
  item: ZohoItem;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { lang, addToCart } = useAppContext();

  const name = lang === Language.PL ? item.cf_item_name_pl : item.cf_item_name_en;
  const category = lang === Language.PL ? item.cf_category_pl : item.cf_category_en;

  const discountPercent = item.cf_retail_price
    ? Math.round(((item.cf_retail_price - item.rate) / item.cf_retail_price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <Link to={`/product/${item.item_id}`} className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">

        <img
          src={
            item.image_urls && item.image_urls.length > 0
              ? item.image_urls[0]
              : item.item_images.length > 0
                ? `/api/zoho/images/${item.item_id}/${item.item_images[0].image_id}`
                : `https://placehold.co/600x600/e5e7eb/9ca3af?text=No+Image`
          }
          onError={(e) => {
            // Fallback chain: Public URL -> Proxy -> No Image placeholder
            const target = e.target as HTMLImageElement;
            if (item.item_images.length > 0 && !target.src.includes('/api/zoho')) {
              target.src = `/api/zoho/images/${item.item_id}/${item.item_images[0].image_id}`;
            } else {
              target.src = `https://placehold.co/600x600/e5e7eb/9ca3af?text=No+Image`;
            }
          }}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {discountPercent > 0 && (
          <div className="absolute top-4 left-4 bg-red-600 text-white font-black px-3 py-1 rounded-lg shadow-lg text-sm z-10">
            -{discountPercent}%
          </div>
        )}
        {item.available_stock <= 3 && item.available_stock > 0 && (
          <div className="absolute bottom-4 left-4 bg-orange-500 text-white font-bold px-2 py-0.5 rounded text-[10px] z-10 uppercase tracking-wider">
            {TRANSLATIONS.lowStock[lang]}
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500 px-2 py-0.5 bg-brand-50 rounded-full">
            {category}
          </span>
        </div>

        <Link to={`/product/${item.item_id}`}>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-brand-600 transition-colors h-14 mb-2">
            {name}
          </h3>
        </Link>

        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            {item.cf_retail_price && (
              <p className="text-sm text-gray-400 line-through font-medium">
                {item.cf_retail_price.toFixed(2)} zł
              </p>
            )}
            <p className="text-2xl font-black text-brand-700">
              {item.rate.toFixed(2)} <span className="text-sm font-bold">zł</span>
            </p>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(item);
            }}
            disabled={item.available_stock <= 0}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.available_stock > 0
              ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 shadow-md shadow-brand-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            title={TRANSLATIONS.addToCart[lang]}
          >
            <i data-lucide="plus" className="w-6 h-6"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
