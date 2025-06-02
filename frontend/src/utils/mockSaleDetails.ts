// src/utils/mockSaleDetails.ts
// Temporary utility to generate realistic sale details until backend is updated

import type { DetailedSale, Sale, SaleItemDetail } from '../services/salesService';

// Sample products database for mock generation
const sampleProducts = [
  { id: 1, name: 'Air Max 90', brand: 'Nike', size: '40', color: 'Black', retail_price: 3500, wholesale_price: 2800 },
  { id: 2, name: 'Suede Classic', brand: 'Puma', size: '41', color: 'Blue', retail_price: 3200, wholesale_price: 2600 },
  { id: 3, name: 'Stan Smith', brand: 'Adidas', size: '42', color: 'White', retail_price: 3800, wholesale_price: 3000 },
  { id: 4, name: 'Chuck Taylor', brand: 'Converse', size: '39', color: 'Red', retail_price: 2900, wholesale_price: 2300 },
  { id: 5, name: 'Samoa', brand: 'Puma', size: '40', color: 'Black', retail_price: 3500, wholesale_price: 2800 },
  { id: 6, name: 'Air Force 1', brand: 'Nike', size: '43', color: 'White', retail_price: 4200, wholesale_price: 3400 },
  { id: 7, name: 'Gazelle', brand: 'Adidas', size: '41', color: 'Navy', retail_price: 3300, wholesale_price: 2650 },
  { id: 8, name: 'Old Skool', brand: 'Vans', size: '42', color: 'Black', retail_price: 3100, wholesale_price: 2500 },
];

/**
 * Generate realistic mock sale details based on actual sale data
 * This is a temporary solution until the backend provides detailed sale items
 */
export function generateMockSaleDetails(sale: Sale): DetailedSale {
  // Seed random number generator with sale ID for consistent results
  const seedRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const random = (min: number, max: number, seed: number) => {
    return Math.floor(seedRandom(seed) * (max - min + 1)) + min;
  };

  // Generate 1-4 items per sale based on items_count or random
  const itemCount = sale.items_count || random(1, 3, sale.id);
  const items: SaleItemDetail[] = [];
  let totalAllocated = 0;

  // Determine price type based on sale_type
  const priceKey = sale.sale_type === 'retail' ? 'retail_price' : 'wholesale_price';

  for (let i = 0; i < itemCount; i++) {
    // Select a random product based on sale ID + index for consistency
    const productIndex = random(0, sampleProducts.length - 1, sale.id + i);
    const product = sampleProducts[productIndex];
    
    // Generate quantity (1-3 per item)
    const quantity = random(1, 2, sale.id + i + 100);
    
    // Use the product's actual price
    const unitPrice = product[priceKey];
    const subtotal = unitPrice * quantity;
    
    items.push({
      id: i + 1,
      product_id: product.id,
      product_name: product.name,
      product_brand: product.brand,
      product_size: product.size,
      product_color: product.color,
      quantity,
      unit_price: unitPrice,
      subtotal,
    });
    
    totalAllocated += subtotal;
  }

  // Adjust the last item's price to match the actual sale total
  if (items.length > 0 && totalAllocated !== sale.total_amount) {
    const lastItem = items[items.length - 1];
    const difference = sale.total_amount - (totalAllocated - lastItem.subtotal);
    lastItem.unit_price = Math.round(difference / lastItem.quantity);
    lastItem.subtotal = difference;
  }

  return {
    ...sale,
    items,
    customer_name: generateCustomerName(sale.id),
  };
}

/**
 * Generate a realistic customer name based on sale ID
 */
function generateCustomerName(saleId: number): string {
  const firstNames = ['John', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa', 'James', 'Jennifer', 'Robert', 'Michelle'];
  const lastNames = ['Kamau', 'Wanjiku', 'Ochieng', 'Akinyi', 'Mwangi', 'Njeri', 'Otieno', 'Wambui', 'Kiprotich', 'Chebet'];
  
  const seedRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const firstIndex = Math.floor(seedRandom(saleId) * firstNames.length);
  const lastIndex = Math.floor(seedRandom(saleId + 1000) * lastNames.length);
  
  // Sometimes return "Walk-in Customer" for variety
  if (seedRandom(saleId + 2000) < 0.3) {
    return 'Walk-in Customer';
  }
  
  return `${firstNames[firstIndex]} ${lastNames[lastIndex]}`;
}