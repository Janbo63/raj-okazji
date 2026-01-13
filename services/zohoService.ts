import { ZohoItem } from '../types';

/**
 * ARCHITECTURE NOTE:
 * Zoho Inventory API does not support CORS for direct browser calls.
 * This service points to our local backend proxy /api/zoho.
 */

// Use an absolute-relative path to ensure it hits the current origin's API
const API_BASE = '/api/zoho';

const mapZohoItem = (raw: any): ZohoItem => {
  if (!raw) return {} as ZohoItem;

  const getCustomField = (label: string) =>
    raw.custom_fields?.find((f: any) => f.label === label || f.placeholder === label)?.value || '';

  return {
    item_id: raw.item_id,
    sku: raw.sku || 'NO-SKU',
    rate: raw.rate || 0,
    available_stock: raw.available_stock || 0,
    status: raw.status === 'active' ? 'active' : 'inactive',
    item_images: Array.isArray(raw.item_images) ? raw.item_images : [],
    image_urls: getCustomField('cf_image_urls') ? getCustomField('cf_image_urls').split(' ') : [],
    cf_item_name_pl: getCustomField('cf_polish_name') || raw.name || '',
    cf_item_name_en: raw.name || '',
    cf_description_pl: getCustomField('cf_product_description') || raw.description || '',
    cf_description_en: raw.description || '', // Fallback for EN description
    cf_category_pl: getCustomField('cf_category') || 'Inne', // Assuming category is same for both or needs translation map elsewhere
    cf_category_en: getCustomField('cf_category') || 'Other',
    cf_retail_price: parseFloat(getCustomField('cf_retail_recommended_price')) || (raw.rate ? Math.ceil(raw.rate * 1.5) : 0), // Default logic if RRP missing
  };
};

export const fetchItems = async (): Promise<ZohoItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/items`);
    if (!response.ok) {
      // Log the actual text if JSON parsing fails to see if it's a 404 HTML page
      const text = await response.text();
      console.error('Zoho Proxy Error Body:', text.substring(0, 200));
      throw new Error(`Failed to fetch from Zoho: ${response.status}`);
    }
    const data = await response.json();
    return (data.items || [])
      .filter((i: any) => i.status === 'active')
      .map(mapZohoItem);
  } catch (error) {
    console.error('Zoho Service List Error:', error);
    throw error;
  }
};

export const fetchItemById = async (id: string): Promise<ZohoItem | undefined> => {
  try {
    const response = await fetch(`${API_BASE}/items/${id}`);
    if (!response.ok) {
      throw new Error(`Product not found (Status: ${response.status})`);
    }
    const data = await response.json();
    if (!data.item) throw new Error('Item object missing in response');
    return mapZohoItem(data.item);
  } catch (error) {
    console.error('Zoho Service Item Detail Error:', error);
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

    const response = await fetch(`${API_BASE}/salesorders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zohoOrder),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Order failed: ${JSON.stringify(errData)}`);
    }
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