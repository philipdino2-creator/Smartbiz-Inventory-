import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { ProductService, ProductType } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  Search,
  Plus,
  Package,
  Layers,
  Trash2,
  Edit2,
  SlidersHorizontal,
  X,
  AlertTriangle,
  CheckCircle2,
  Check,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Software Training',
  'Graphic & UI Design',
  'Hardware & Supplies',
  'Cabling & Networking',
  'Repairs & Technical',
  'Office Stationery',
];

export const ProductsView: React.FC = () => {
  const { business, products, addProduct, updateProduct, deleteProduct, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ProductService | null>(null);
  const [itemToAdjustStock, setItemToAdjustStock] = useState<ProductService | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductService | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Success Feedback Toast
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for New Product / Service
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('product');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [openingStock, setOpeningStock] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number | ''>(5);

  // Stock Adjustment Form State
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('Restock shipment from supplier');

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, typeFilter, searchTerm]);

  const resetForm = () => {
    setName('');
    setType('product');
    setSellingPrice('');
    setCostPrice('');
    setCategory('');
    setSku('');
    setDescription('');
    setOpeningStock('');
    setMinStockLevel(5);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const numSell = typeof sellingPrice === 'number' ? sellingPrice : parseFloat(sellingPrice);
    if (!name.trim() || numSell === undefined || isNaN(numSell) || numSell < 0) {
      triggerToast('Please provide an item name and a valid selling price.');
      return;
    }

    const numCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
    const numOpenStock = type === 'product' ? (typeof openingStock === 'number' ? openingStock : parseInt(openingStock) || 0) : undefined;
    const numMinStock = type === 'product' ? (typeof minStockLevel === 'number' ? minStockLevel : parseInt(minStockLevel) || 5) : undefined;

    const newCreated = addProduct({
      name: name.trim(),
      type,
      sellingPrice: numSell,
      costPrice: numCost,
      category: category.trim() || (type === 'service' ? 'Course / Service' : 'Hardware & Supplies'),
      sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      openingStock: numOpenStock,
      currentStock: numOpenStock,
      minStockLevel: numMinStock,
      active: true,
    });

    triggerToast(`Added ${newCreated.type === 'product' ? 'product' : 'service'}: "${newCreated.name}"!`);
    resetForm();
    setIsAddingItem(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;

    if (!itemToEdit.name.trim() || itemToEdit.sellingPrice < 0) {
      triggerToast('Please provide an item name and a valid selling price.');
      return;
    }

    updateProduct(itemToEdit.id, {
      name: itemToEdit.name.trim(),
      sellingPrice: Number(itemToEdit.sellingPrice) || 0,
      costPrice: Number(itemToEdit.costPrice) || 0,
      category: itemToEdit.category,
      sku: itemToEdit.sku?.trim() || undefined,
      description: itemToEdit.description?.trim() || undefined,
      minStockLevel: itemToEdit.minStockLevel ? Number(itemToEdit.minStockLevel) : 5,
    });

    triggerToast(`Updated "${itemToEdit.name}" successfully.`);
    setItemToEdit(null);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToAdjustStock) return;

    const qty = typeof adjustQuantity === 'number' ? adjustQuantity : parseInt(adjustQuantity);
    if (isNaN(qty) || qty < 0) {
      triggerToast('Please enter a valid stock quantity.');
      return;
    }

    const current = itemToAdjustStock.currentStock ?? itemToAdjustStock.openingStock ?? 0;
    let newStock = current;

    if (adjustMode === 'add') {
      newStock = current + qty;
    } else if (adjustMode === 'remove') {
      newStock = Math.max(0, current - qty);
    } else if (adjustMode === 'set') {
      newStock = qty;
    }

    updateProduct(itemToAdjustStock.id, {
      currentStock: newStock,
    });

    triggerToast(`Stock updated for "${itemToAdjustStock.name}": now ${newStock} units.`);
    setItemToAdjustStock(null);
    setAdjustQuantity('');
  };

  const confirmDeleteSingle = () => {
    if (!itemToDelete) return;
    const targetName = itemToDelete.name;
    const targetId = itemToDelete.id;
    deleteProduct(targetId);
    setSelectedProductIds(prev => prev.filter(id => id !== targetId));
    setItemToDelete(null);
    triggerToast(`Deleted "${targetName}" from catalog.`);
  };

  const confirmDeleteBatch = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    selectedProductIds.forEach(id => deleteProduct(id));
    setSelectedProductIds([]);
    setIsBatchDeleting(false);
    triggerToast(`Deleted ${count} selected item(s).`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  // Export handlers
  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_products_${typeFilter}_${dateStamp}`;
  const exportHeaders = ['Name', 'Type', 'Category', 'Selling Price', 'Cost Price', 'Stock Level', 'SKU'];
  const exportRows = filteredProducts.map(p => [
    p.name,
    p.type === 'service' ? 'Service/Course' : 'Product',
    p.category,
    p.sellingPrice,
    p.costPrice || 0,
    p.type === 'product' ? (p.currentStock ?? p.openingStock ?? 0) : 'Unlimited',
    p.sku || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, exportHeaders, exportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'Products',
      exportHeaders,
      exportRows,
      `${business.name} — Products & Inventory Catalog (${filteredProducts.length} items)`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      exportFilename,
      'PRODUCTS & INVENTORY CATALOG',
      `${business.name} · ${filteredProducts.length} items`,
      ['Name', 'Type', 'Category', 'Selling Price', 'Cost Price', 'Stock'],
      filteredProducts.map(p => [
        p.name,
        p.type === 'service' ? 'Service' : 'Product',
        p.category,
        formatCurrency(p.sellingPrice, business.currencySymbol),
        p.costPrice ? formatCurrency(p.costPrice, business.currencySymbol) : '—',
        p.type === 'product' ? String(p.currentStock ?? p.openingStock ?? 0) : 'Service',
      ]),
      [],
      {
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
      }
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Products &amp; Inventory
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-[#4C0196] dark:text-purple-300">
              {products.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your courses, training fees, and physical shop inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedProductIds.length > 0 && (
            <button
              onClick={() => setIsBatchDeleting(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedProductIds.length})</span>
            </button>
          )}

          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export"
            disabled={filteredProducts.length === 0}
          />

          <button
            onClick={() => {
              resetForm();
              setIsAddingItem(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, category, or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] dark:bg-slate-800 dark:text-white outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          {(['all', 'product', 'service'] as const).map(f => {
            const count = products.filter(p => f === 'all' || p.type === f).length;
            return (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize flex items-center gap-1.5 ${
                  typeFilter === f
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{f === 'all' ? 'All' : f === 'product' ? 'Products' : 'Services'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        {filteredProducts.length === 0 ? (
          /* Empty State compliant with MVP instructions */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No matching products found' : 'No products yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `No items match "${searchTerm}". Try another search term.`
                  : 'Add your first product to start tracking inventory.'}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsAddingItem(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (block sm:hidden) for high usability on phones */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map(item => {
                const isProduct = item.type === 'product';
                const isLowStock = isProduct && typeof item.currentStock === 'number' && item.currentStock <= (item.minStockLevel || 5);
                const currentStockCount = item.currentStock ?? item.openingStock ?? 0;

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{item.category}</span>
                          {item.sku && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-400">SKU: {item.sku}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          item.type === 'service'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {item.type === 'service' ? 'Service' : 'Product'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Selling Price</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.sellingPrice, business.currencySymbol)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Stock Status</span>
                        {isProduct ? (
                          <span
                            className={`font-semibold inline-flex items-center gap-1 ${
                              isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                            {currentStockCount} units left
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">Course / Service</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isProduct && (
                        <button
                          onClick={() => {
                            setItemToAdjustStock(item);
                            setAdjustMode('add');
                            setAdjustQuantity('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Adjust Stock
                        </button>
                      )}

                      <button
                        onClick={() => setItemToEdit(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setItemToDelete(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-[#4C0196] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Product / Service Name</th>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-center">Stock Level</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map(item => {
                    const isProduct = item.type === 'product';
                    const isLowStock = isProduct && typeof item.currentStock === 'number' && item.currentStock <= (item.minStockLevel || 5);
                    const isSelected = selectedProductIds.includes(item.id);
                    const currentStockCount = item.currentStock ?? item.openingStock ?? 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-purple-50/40 dark:bg-purple-950/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-[#4C0196] cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{item.category}</span>
                            {item.description && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-xs">{item.description}</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {item.sku || '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(item.sellingPrice, business.currencySymbol)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {item.costPrice > 0 ? formatCurrency(item.costPrice, business.currencySymbol) : '—'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isProduct ? (
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold ${
                                  isLowStock
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {currentStockCount} units
                              </span>
                              {isLowStock && (
                                <span title="Low stock alert">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Service / Course
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isProduct && (
                              <button
                                type="button"
                                onClick={() => {
                                  setItemToAdjustStock(item);
                                  setAdjustMode('add');
                                  setAdjustQuantity('');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Adjust inventory stock quantity"
                              >
                                Adjust Stock
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setItemToEdit(item)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#4C0196] dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: ADD PRODUCT / SERVICE */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#4C0196] dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Add to Catalog</h3>
              </div>
              <button
                onClick={() => setIsAddingItem(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('product')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    type === 'product'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Physical Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('service')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    type === 'service'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Training / Service</span>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === 'product' ? 'e.g. 64GB USB Flash Drive' : 'e.g. Python for Data Analysis'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 15000"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price ({business.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 9000 (for profit calc)"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>
              </div>

              {/* Stock Fields (Only for physical products) */}
              {type === 'product' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opening Stock (Units)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 20"
                      value={openingStock}
                      onChange={e => setOpeningStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Low-Stock Alert Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={minStockLevel}
                      onChange={e => setMinStockLevel(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                    />
                  </div>
                </div>
              )}

              {/* Category & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="e.g. Software Training"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                  <datalist id="category-suggestions">
                    {COMMON_CATEGORIES.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU / Item Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. USB-64G"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT */}
      {itemToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#4C0196] dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Product</h3>
              </div>
              <button
                onClick={() => setItemToEdit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemToEdit.name}
                  onChange={e => setItemToEdit({ ...itemToEdit, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={itemToEdit.sellingPrice}
                    onChange={e => setItemToEdit({ ...itemToEdit, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price ({business.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemToEdit.costPrice || ''}
                    onChange={e => setItemToEdit({ ...itemToEdit, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={itemToEdit.category}
                    onChange={e => setItemToEdit({ ...itemToEdit, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU / Code
                  </label>
                  <input
                    type="text"
                    value={itemToEdit.sku || ''}
                    onChange={e => setItemToEdit({ ...itemToEdit, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST STOCK (Clear, intuitive inventory stock control) */}
      {itemToAdjustStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#4C0196] dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Adjust Stock Level</h3>
              </div>
              <button
                onClick={() => setItemToAdjustStock(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {itemToAdjustStock.name}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Current Stock in Hand:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {itemToAdjustStock.currentStock ?? itemToAdjustStock.openingStock ?? 0} units
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustMode('add')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    adjustMode === 'add'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('remove')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    adjustMode === 'remove'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  - Deduct
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('set')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    adjustMode === 'set'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Set Count
                </button>
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {adjustMode === 'add' ? 'Units to Add *' : adjustMode === 'remove' ? 'Units to Deduct *' : 'Exact Count *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 10"
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono text-base border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                />
              </div>

              {/* Live Preview of New Quantity */}
              {adjustQuantity !== '' && !isNaN(Number(adjustQuantity)) && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-900 dark:text-purple-300">New Resulting Stock:</span>
                  <span className="font-mono font-bold text-purple-900 dark:text-purple-200 text-sm">
                    {adjustMode === 'add'
                      ? (itemToAdjustStock.currentStock ?? 0) + Number(adjustQuantity)
                      : adjustMode === 'remove'
                      ? Math.max(0, (itemToAdjustStock.currentStock ?? 0) - Number(adjustQuantity))
                      : Number(adjustQuantity)}{' '}
                    units
                  </span>
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white outline-hidden"
                >
                  <option value="Restock shipment from supplier">Restock shipment from supplier</option>
                  <option value="Physical inventory recount / audit">Physical inventory recount / audit</option>
                  <option value="Damaged / defective stock written off">Damaged / defective stock written off</option>
                  <option value="Returned by customer in good shape">Returned by customer in good shape</option>
                  <option value="Internal academy workshop use">Internal academy workshop use</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemToAdjustStock(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION (Replaces window.confirm completely) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Item?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{itemToDelete.name}"</strong>? This will remove it from the catalog.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSingle}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: BATCH DELETE CONFIRMATION */}
      {isBatchDeleting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Batch Delete Items?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently delete all <strong>{selectedProductIds.length}</strong> selected catalog item(s)?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsBatchDeleting(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBatch}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete All Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
