// src/services/inventoryService.ts
export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  transaction_type: 'in' | 'out';
  quantity: number;
  batch_number?: string;
  notes?: string;
  created_at: string;
}

export interface StockInRequest {
  product_id: number;
  quantity: number;
  batch_number?: string;
  notes?: string;
}

export interface StockInResponse {
  message: string;
  transaction_id: number;
  product_name: string;
  new_stock: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api/inventory';

export const inventoryService = {
  stockIn: async (data: StockInRequest): Promise<StockInResponse> => {
    const response = await fetch(`${BASE_URL}/stock-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add stock');
    }

    return await response.json();
  },

  getTransactions: async (): Promise<{ transactions: InventoryTransaction[]; count: number }> => {
    const response = await fetch(`${BASE_URL}/transactions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load transactions');
    }

    return await response.json();
  },
};