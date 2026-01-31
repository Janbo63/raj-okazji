
export enum Language {
  PL = 'pl',
  EN = 'en'
}

export interface ZohoItem {
  item_id: string;
  sku: string;
  rate: number;
  available_stock: number;
  status: 'active' | 'inactive';
  item_images: { image_id: string; image_name: string; image_type: string }[];
  image_urls: string[]; // Add direct URLs support
  cf_item_name_pl: string;
  cf_item_name_en: string;
  cf_description_pl: string;
  cf_description_en: string;
  cf_category_pl: string;
  cf_category_en: string;
  cf_retail_price?: number; // Retail price for discount calculation
  cf_shipping_class?: 'S' | 'M' | 'L';
}

export interface CartItem extends ZohoItem {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Order {
  order_id: string;
  order_number: string;
  status: string;
  date: string;
  total: number;
  items: CartItem[];
}

export interface TranslationDict {
  [key: string]: {
    [Language.PL]: string;
    [Language.EN]: string;
  };
}
