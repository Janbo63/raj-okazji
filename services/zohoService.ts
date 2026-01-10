
import { ZohoItem } from '../types';

/**
 * ARCHITECTURE NOTE:
 * Zoho Inventory API does not support CORS for direct browser calls.
 * This service points to our local backend proxy /api/zoho.
 */

const API_BASE = '/api/zoho';
const ORG_ID = '866851240'; // Replace with your actual Org ID if different

const mapZohoItem = (raw: any): ZohoItem => {
  const getCustomField = (label: string) => 
    raw.custom_fields?.find((f: any) => f.label === label || f.placeholder === label)?.value || '';

  return {
    item_id: raw.item_id,
    sku: raw.sku || 'NO-SKU',
    rate: raw.rate || 0,
    available_stock: raw.available_stock || 0,
    status: raw.status === 'active' ? 'active' : 'inactive',
    item_images: Array.isArray(raw.item_images) ? raw.item_images : [],
    cf_item_name_pl: getCustomField('cf_item_name_pl') || raw.name,
    cf_item_name_en: getCustomField('cf_item_name_en') || raw.name,
    cf_description_pl: getCustomField('cf_description_pl') || raw.description,
    cf_description_en: getCustomField('cf_description_en') || raw.description,
    cf_category_pl: getCustomField('cf_category_pl') || 'Inne',
    cf_category_en: getCustomField('cf_category_en') || 'Other',
    cf_retail_price: parseFloat(getCustomField('cf_retail_price')) || (raw.rate * 2),
  };
};

export const fetchItems = async (): Promise<ZohoItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/items?organization_id=${ORG_ID}`);
    if (!response.ok) throw new Error('Failed to fetch from Zoho');
    const data = await response.json();
    return (data.items || []).filter((i: any) => i.status === 'active').map(mapZohoItem);
  } catch (error) {
    console.error('Zoho API Error:', error);
    return []; 
  }
};

export const fetchItemById = async (id: string): Promise<ZohoItem | undefined> => {
  try {
    const response = await fetch(`${API_BASE}/items/${id}?organization_id=${ORG_ID}`);
    if (!response.ok) throw new Error('Product not found');
    const data = await response.json();
    return mapZohoItem(data.item);
  } catch (error) {
    console.error('Zoho Detail Error:', error);
    return undefined;
  }
};

export const createSalesOrder = async (orderData: any): Promise<{ order_id: string; order_number: string }> => {
  try {
    const zohoOrder = {
      customer_id: 'GUEST_CUSTOMER_ID',
      date: new Date().toISOString().split('T')[0],
      line_items: orderData.items.map((item: any) => ({
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate
      })),
      notes: `Order from Online Store. Delivery: ${orderData.paczkomatId || 'Standard'}. Phone: ${orderData.phone}`,
    };

    const response = await fetch(`${API_BASE}/salesorders?organization_id=${ORG_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zohoOrder),
    });

    if (!response.ok) throw new Error('Failed to create order');
    const data = await response.json();
    return {
      order_id: data.salesorder.salesorder_id,
      order_number: data.salesorder.salesorder_number
    };
  } catch (error) {
    console.error('Order Creation Error:', error);
    throw error;
  }
};
