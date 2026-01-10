
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { createSalesOrder } from '../services/zohoService';

const Checkout: React.FC = () => {
  const { lang, cart, updateQuantity, clearCart } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderDone, setOrderDone] = useState<{ order_number: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    paczkomatId: '',
    paymentMethod: 'cash_on_delivery'
  });

  const subtotal = cart.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  const shipping = formData.paymentMethod === 'cash_on_delivery' ? 19.99 : 14.99;
  const total = subtotal + shipping;

  const handleCreateOrder = async () => {
    if (!formData.email || !formData.firstName || !formData.phone) {
      alert(lang === 'pl' ? 'Wypełnij wymagane dane' : 'Please fill required data');
      return;
    }
    
    setLoading(true);
    try {
      const res = await createSalesOrder({ ...formData, items: cart, total, lang });
      setOrderDone(res);
      clearCart();
    } catch (err) {
      alert(lang === 'pl' ? 'Błąd zamówienia' : 'Order error');
    } finally {
      setLoading(false);
    }
  };

  if (orderDone) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <i data-lucide="check-circle-2" className="w-12 h-12"></i>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">{TRANSLATIONS.orderSuccessTitle[lang]}</h1>
        <p className="text-xl text-gray-500 mb-10 leading-relaxed">
          {TRANSLATIONS.orderSuccessText[lang]} <br/>
          Order: <span className="font-black text-brand-600">#{orderDone.order_number}</span>
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/" className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-brand-700 transition-all">
            {TRANSLATIONS.backToStore[lang]}
          </a>
          <button className="bg-white border-2 border-brand-600 text-brand-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-brand-50 transition-all">
            {TRANSLATIONS.trackPackage[lang]}
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <i data-lucide="shopping-basket" className="w-10 h-10"></i>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{TRANSLATIONS.emptyCart[lang]}</h2>
        <a href="#/catalog" className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-brand-700 transition-all">
          {TRANSLATIONS.viewAll[lang]}
        </a>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step >= 1 ? 'bg-brand-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>1</div>
          <div className={`h-1 flex-grow rounded-full ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step >= 2 ? 'bg-brand-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>2</div>
        </div>

        {step === 1 && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <i data-lucide="user" className="w-6 h-6 text-brand-600"></i>
              {TRANSLATIONS.customerData[lang]}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{TRANSLATIONS.firstName[lang]}</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{TRANSLATIONS.lastName[lang]}</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{TRANSLATIONS.phone[lang]}</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full mt-10 bg-brand-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-100"
            >
              {TRANSLATIONS.deliveryAndPayment[lang]} &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <i data-lucide="truck" className="w-6 h-6 text-brand-600"></i>
              {TRANSLATIONS.deliveryMethod[lang]}
            </h2>
            
            <div className="grid gap-4 mb-10">
              <div className="bg-brand-50 border-2 border-brand-600 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <i data-lucide="package" className="w-8 h-8 text-brand-600"></i>
                  <div>
                    <h4 className="font-black text-brand-950">InPost Paczkomat 24/7</h4>
                    <p className="text-xs text-brand-600 font-bold uppercase tracking-wider">{TRANSLATIONS.selectPointOnMap[lang]}</p>
                  </div>
                </div>
                <span className="text-lg font-black text-brand-700">14.99 zł</span>
              </div>
              
              <div className="border-2 border-dashed border-gray-200 p-8 rounded-2xl cursor-pointer hover:border-brand-300 transition-all text-center group">
                 <div className="flex flex-col items-center justify-center gap-3">
                   <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                     <i data-lucide="map-pin" className="w-6 h-6"></i>
                   </div>
                   <div className="text-sm font-bold text-gray-400 group-hover:text-brand-600">
                     {formData.paczkomatId ? `Wybrany punkt: ${formData.paczkomatId}` : TRANSLATIONS.paczkomatLabel[lang]}
                   </div>
                   <span className="font-black text-brand-600 underline text-sm">{TRANSLATIONS.openGeowidget[lang]}</span>
                 </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <i data-lucide="credit-card" className="w-6 h-6 text-brand-600"></i>
              {TRANSLATIONS.paymentMethod[lang]}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <label className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.paymentMethod === 'cash_on_delivery' ? 'border-brand-600 bg-brand-50 shadow-md shadow-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" checked={formData.paymentMethod === 'cash_on_delivery'} onChange={() => setFormData({...formData, paymentMethod: 'cash_on_delivery'})} className="w-5 h-5 accent-brand-600" />
                <div>
                  <div className="font-black text-gray-900">{TRANSLATIONS.cashOnDelivery[lang]}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">+5.00 PLN</div>
                </div>
              </label>
              <label className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.paymentMethod === 'transfer' ? 'border-brand-600 bg-brand-50 shadow-md shadow-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" checked={formData.paymentMethod === 'transfer'} onChange={() => setFormData({...formData, paymentMethod: 'transfer'})} className="w-5 h-5 accent-brand-600" />
                <div className="font-black text-gray-900">{TRANSLATIONS.bankTransfer[lang]}</div>
              </label>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-8 py-5 rounded-2xl font-black text-gray-400 hover:text-gray-600 transition-colors">
                {lang === 'pl' ? 'Wstecz' : 'Back'}
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={loading}
                className="flex-grow bg-brand-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-brand-700 shadow-xl shadow-brand-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <i data-lucide="lock" className="w-6 h-6"></i>}
                {loading ? TRANSLATIONS.processing[lang] : TRANSLATIONS.buyAndPay[lang]}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 sticky top-24">
          <h2 className="text-2xl font-black text-gray-900 mb-8">{TRANSLATIONS.orderSummary[lang]}</h2>
          <div className="space-y-6 mb-8 border-b pb-8 max-h-[400px] overflow-y-auto no-scrollbar">
            {cart.map(item => (
              <div key={item.item_id} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={`https://picsum.photos/seed/${item.item_id}/200/200`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-900 line-clamp-1 text-sm">{lang === Language.PL ? item.cf_item_name_pl : item.cf_item_name_en}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">x{item.quantity}</span>
                    <span className="font-black text-brand-600">{(item.rate * item.quantity).toFixed(2)} zł</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-gray-500 font-bold text-sm uppercase tracking-widest">
              <span>{TRANSLATIONS.cartValue[lang]}</span>
              <span>{subtotal.toFixed(2)} zł</span>
            </div>
            <div className="flex justify-between text-gray-500 font-bold text-sm uppercase tracking-widest">
              <span>{TRANSLATIONS.deliveryCost[lang]}</span>
              <span>{shipping.toFixed(2)} zł</span>
            </div>
            <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
              <span className="text-xl font-black text-gray-900 tracking-tight">{TRANSLATIONS.totalToPay[lang]}</span>
              <span className="text-4xl font-black text-brand-700 tracking-tighter">{total.toFixed(2)} <span className="text-lg">zł</span></span>
            </div>
          </div>

          <div className="mt-8 p-5 bg-brand-50 rounded-2xl flex items-start gap-4 border border-brand-100">
             <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
               <i data-lucide="zap" className="w-5 h-5"></i>
             </div>
             <div>
               <p className="text-xs text-brand-900 font-black uppercase tracking-widest mb-1">Flash Reservation</p>
               <p className="text-xs text-brand-700 font-medium leading-relaxed">{TRANSLATIONS.reservedText[lang]}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
