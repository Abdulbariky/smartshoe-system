// src/services/salesService.ts
export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreateSaleRequest {
  items: SaleItem[];
  sale_type: 'retail' | 'wholesale';
  payment_method?: string;
}

export interface CreateSaleResponse {
  message: string;
  invoice_number: string;
  total_amount: number;
  sale_id: number;
}

export interface SaleItemDetail {
  id: number;
  product_id: number;
  product_name: string;
  product_brand: string;
  product_size: string;
  product_color: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  sale_type: 'retail' | 'wholesale';
  total_amount: number;
  payment_method: string;
  created_at: string;
  items_count: number;
}

export interface DetailedSale extends Sale {
  items: SaleItemDetail[];
  customer_name?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api/sales';

// Helper function to validate and sanitize sale data
function validateSaleData(data: any): DetailedSale {
  console.log('🧹 Frontend: Validating and sanitizing sale data:', data);
  
  // Ensure all required fields have valid values
  const sanitizedSale: DetailedSale = {
    id: Number(data.id) || 0,
    invoice_number: data.invoice_number || `INV-${data.id || 'UNKNOWN'}`,
    sale_type: data.sale_type || 'retail',
    total_amount: Number(data.total_amount) || 0,
    payment_method: data.payment_method || 'cash',
    created_at: data.created_at || new Date().toISOString(),
    items_count: Number(data.items_count) || 0,
    customer_name: data.customer_name || 'Walk-in Customer',
    items: (data.items || []).map((item: any, index: number) => ({
      id: item.id || index + 1,
      product_id: Number(item.product_id) || 0,
      product_name: item.product_name || 'Unknown Product',
      product_brand: item.product_brand || 'Unknown Brand',
      product_size: item.product_size || 'N/A',
      product_color: item.product_color || 'N/A',
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      subtotal: Number(item.subtotal) || 0,
    })),
  };
  
  console.log('✅ Frontend: Sale data sanitized:', sanitizedSale);
  return sanitizedSale;
}

export const salesService = {
  createSale: async (data: CreateSaleRequest): Promise<CreateSaleResponse> => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create sale');
    }

    return await response.json();
  },

  getSales: async (): Promise<{ sales: Sale[]; count: number }> => {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load sales');
    }

    return await response.json();
  },

  // 🔧 FIXED: Properly handle backend response format
  getSaleById: async (id: number): Promise<DetailedSale> => {
    try {
      console.log(`🔄 Frontend: Fetching sale details for ID: ${id}`);
      
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load sale details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Frontend: Raw API response:', data);
      
      // 🎯 KEY FIX: Backend now returns the correct format directly
      // No need to check for data.sale.items vs data.items - backend sends the right structure
      
      // Check if we have actual items from the backend
      const hasRealItems = data.items && Array.isArray(data.items) && data.items.length > 0;
      
      if (hasRealItems) {
        console.log('✅ Frontend: Using REAL data from backend!');
        console.log(`📊 Frontend: Found ${data.items.length} real items`);
        
        // Validate and return the real data
        return validateSaleData(data);
      } else {
        console.log('⚠️ Frontend: No items found in backend response');
        console.log('🔍 Frontend: Available data keys:', Object.keys(data));
        
        // If no items, still return the sale info but with empty items
        const fallbackSale = validateSaleData({
          ...data,
          items: [],
          customer_name: data.customer_name || 'Walk-in Customer'
        });
        
        console.log('🔄 Frontend: Returning sale with empty items');
        return fallbackSale;
      }
    } catch (error) {
      console.error('❌ Frontend: Error fetching sale details:', error);
      throw error;
    }
  },

  // Enhanced method to get detailed sale information with better error handling
  getSaleWithDetails: async (saleId: number): Promise<DetailedSale> => {
    try {
      console.log(`🔄 Frontend: Fetching detailed sale information for sale ID: ${saleId}`);
      
      const detailedSale = await salesService.getSaleById(saleId);
      
      // Additional validation
      if (!detailedSale) {
        throw new Error('No sale data returned from backend');
      }
      
      if (!detailedSale.items || detailedSale.items.length === 0) {
        console.log('⚠️ Frontend: Sale has no items - this might be a data issue');
        console.log('🔧 Frontend: Check if this sale was created properly in the database');
      } else {
        console.log(`✅ Frontend: Sale has ${detailedSale.items.length} items`);
      }
      
      return detailedSale;
    } catch (error) {
      console.error('❌ Frontend: Failed to fetch detailed sale:', error);
      throw error;
    }
  },

  // 🆕 Debug method to check what the backend is returning
  debugSale: async (saleId: number): Promise<any> => {
    try {
      console.log(`🐛 Frontend: Debug - checking sale ${saleId}`);
      
      const response = await fetch(`${BASE_URL}/debug/${saleId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Debug request failed: ${response.status}`);
      }

      const debugData = await response.json();
      console.log('🐛 Frontend: Debug data:', debugData);
      return debugData;
    } catch (error) {
      console.error('❌ Frontend: Debug request failed:', error);
      throw error;
    }
  },
};