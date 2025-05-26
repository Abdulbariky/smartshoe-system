#!/bin/bash

# Fix ErrorBoundary.tsx
sed -i "s/import React, { Component }/import { Component }/" src/components/common/ErrorBoundary.tsx

# Fix unused imports in various files
sed -i "/import { categoryService }/d" src/components/products/AddProductDialog.tsx
sed -i "/import { productService }/d" src/components/products/EditProductDialog.tsx
sed -i "/import { categoryService }/d" src/components/products/EditProductDialog.tsx
sed -i "s/, reset//" src/components/products/EditProductDialog.tsx
sed -i "/Receipt,/d" src/components/sales/SalesHistoryPage.tsx
sed -i "s/(event: unknown/(\_: unknown/" src/components/sales/SalesHistoryPage.tsx
sed -i "/LocalMall,/d" src/pages/auth/RegisterPage.tsx
sed -i "/BarChart,/d" src/pages/dashboard/DashboardPage.tsx
sed -i "/Bar,/d" src/pages/dashboard/DashboardPage.tsx
sed -i "/Remove,/d" src/pages/inventory/InventoryPage.tsx
sed -i "s/(event: React.SyntheticEvent/(\_: React.SyntheticEvent/" src/pages/inventory/InventoryPage.tsx
sed -i "/import { categoryService }/d" src/pages/products/BrandsPage.tsx
sed -i "/import { categoryService }/d" src/pages/products/CategoriesPage.tsx
sed -i "/import { productService }/d" src/pages/products/ProductsPage.tsx
sed -i "s/(event: unknown/(\_: unknown/" src/pages/products/ProductsPage.tsx
sed -i "s/useState, useEffect/useState/" src/pages/reports/ReportsPage.tsx
sed -i "s/(event: React.SyntheticEvent/(\_: React.SyntheticEvent/" src/pages/reports/ReportsPage.tsx
sed -i "/InputAdornment,/d" src/pages/sales/SalesPage.tsx
sed -i "/AttachMoney,/d" src/pages/sales/SalesPage.tsx
sed -i "/import LoadingSpinner/d" src/pages/sales/SalesPage.tsx
sed -i "s/(event: React.SyntheticEvent/(\_: React.SyntheticEvent/" src/pages/sales/SalesPage.tsx

echo "Import fixes applied!"