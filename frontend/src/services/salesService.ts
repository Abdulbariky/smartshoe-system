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

export interface Sale {
  id: number;
  invoice_number: string;
  sale_type: 'retail' | 'wholesale';
  total_amount: number;
  payment_method: string;
  created_at: string;
  items_count: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api/sales';

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

  getSaleById: async (id: number): Promise<Sale> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load sale');
    }

    return await response.json();
  },
};