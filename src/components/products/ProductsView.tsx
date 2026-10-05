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
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Barcode,
  RefreshCw,
  FolderPlus,
  Info,
} from 'lucide-react';

// Preset templates for quick creation
const PRODUCT_TEMPLATES: Array<{
  name: string;
  type: ProductType;
  category: string;
  sellingPrice: number;
  costPrice: number;
  description: string;
  openingStock?: number;
  minStockLevel?: number;
}> = [
  {
    name: 'Python for Data Analysis Bootcamp',
    type: 'service',
    category: 'Software Training',
    sellingPrice: 75000,
    costPrice: 15000,
    description: 'Comprehensive 8-week Python programming covering NumPy, Pandas, and Matplotlib.',
  },
  {
    name: 'Web Development (React & Node.js)',
    type: 'service',
    category: 'Software Training',
    sellingPrice: 120000,
    costPrice: 25000,
    description: 'Fullstack frontend and backend development with modern industry practices.',
  },
  {
    name: 'Computer Hardware & Network Repair',
    type: 'service',
    category: 'Repairs & Technical',
    sellingPrice: 15000,
    costPrice: 3000,
    description: 'System diagnostics, OS reinstall, hardware troubleshooting, and thermal paste renewal.',
  },
  {
    name: 'Kingston 64GB USB 3.2 Flash Drive',
    type: 'product',
    category: 'Hardware & Supplies',
    sellingPrice: 6500,
    costPrice: 4200,
    openingStock: 25,
    minStockLevel: 5,
    description: 'High-speed USB 3.2 Gen 1 thumb drive with metal casing.',
  },
  {
    name: 'Cat6 High-Speed Ethernet Cable (10m)',
    type: 'product',
    category: 'Cabling & Networking',
    sellingPrice: 4500,
    costPrice: 2800,
    openingStock: 40,
    minStockLevel: 8,
    description: 'RJ45 crimped patch cord for Gigabit local area networks.',
  },
  {
    name: 'Universal Laptop Charger Adapter 65W',
    type: 'product',
    category: 'Hardware & Supplies',
    sellingPrice: 18500,
    costPrice: 12000,
    openingStock: 12,
    minStockLevel: 3,
    description: 'Multi-tip laptop AC power brick compatible with HP, Dell, Lenovo, and Asus.',
  },
];

const COMMON_CATEGORIES = [
  'Software Training',
  'Hardware & Supplies',
  'Cabling & Networking',
  'Repairs & Technical',
  'Office Stationery',
  'Graphic & UI Design',
];

export const ProductsView: React.FC = () => {
  const { business, products, addProduct, deleteProduct, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Deletion Modal state (replaces forbidden window.confirm)
  const [itemToDelete, setItemToDelete] = useState<ProductService | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Success Feedback Toast
  const [notification, setNotification] = useState<string | null>(null);

  // New item form state
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('service');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [openingStock, setOpeningStock] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number | ''>('');

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

  // Live profit calculation for modal preview
  const liveSell = typeof sellingPrice === 'number' ? sellingPrice : parseFloat(sellingPrice) || 0;
  const liveCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
  const liveMarginPct = liveSell > 0 ? Math.max(0, ((liveSell - liveCost) / liveSell) * 100) : 0;
  const liveProfitUnit = Math.max(0, liveSell - liveCost);

  const resetForm = () => {
    setName('');
    setType('service');
    setSellingPrice('');
    setCostPrice('');
    setCategory('');
    setSku('');
    setDescription('');
    setOpeningStock('');
    setMinStockLevel('');
  };

  const applyTemplate = (tmpl: typeof PRODUCT_TEMPLATES[0]) => {
    setName(tmpl.name);
    setType(tmpl.type);
    setCategory(tmpl.category);
    setSellingPrice(tmpl.sellingPrice);
    setCostPrice(tmpl.costPrice);
    setDescription(tmpl.description);
    setOpeningStock(tmpl.openingStock ?? '');
    setMinStockLevel(tmpl.minStockLevel ?? '');
    setSku(`SKU-${tmpl.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const generateSku = () => {
    const prefix = type === 'product' ? 'PRD' : 'SRV';
    const catCode = category ? category.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'GEN';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${catCode}-${rand}`);
  };

  const handleSaveProduct = (keepOpenAfterSave: boolean) => {
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

    triggerToast(`Added ${newCreated.type === 'product' ? 'product' : 'service'}: "${newCreated.name}" to catalog!`);

    if (keepOpenAfterSave) {
      // Clear form but keep modal open so user can create MORE products/services
      resetForm();
    } else {
      resetForm();
      setIsAddingItem(false);
    }
  };

  // Single Item Deletion Confirm
  const confirmDeleteSingle = () => {
    if (!itemToDelete) return;
    const targetName = itemToDelete.name;
    const targetId = itemToDelete.id;
    deleteProduct(targetId);
    setSelectedProductIds(prev => prev.filter(id => id !== targetId));
    setItemToDelete(null);
    triggerToast(`Deleted "${targetName}" from the catalog.`);
  };

  // Batch Deletion Confirm
  const confirmDeleteBatch = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    selectedProductIds.forEach(id => deleteProduct(id));
    setSelectedProductIds([]);
    setIsBatchDeleting(false);
    triggerToast(`Successfully deleted ${count} selected item(s) permanently.`);
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

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_catalog_${typeFilter}_${dateStamp}`;

  const productExportHeaders = [
    'Name',
    'Type',
    'Category',
    'Selling Price',
    'Cost Price',
    'Estimated Margin',
    'SKU / Code',
    'Current Stock',
    'Min Alert Stock',
    'Description',
  ];

  const productExportRows = filteredProducts.map(p => [
    p.name,
    p.type.toUpperCase(),
    p.category,
    p.sellingPrice,
    p.costPrice || 0,
    p.costPrice ? `${Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)}%` : 'N/A',
    p.sku || '',
    p.type === 'product' ? (p.currentStock ?? p.openingStock ?? 0) : 'N/A',
    p.type === 'product' ? p.minStockLevel ?? 5 : 'N/A',
    p.description || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, productExportHeaders, productExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'Catalog',
      productExportHeaders,
      productExportRows,
      `${business.name} — Products & Courses Catalog (${filteredProducts.length} items)`
    );
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: ${typeFilter === 'all' ? 'All Catalog Items' : typeFilter === 'service' ? 'Courses & Services' : 'Physical Products'} · ${filteredProducts.length} Items`;
    const totalInventoryValue = filteredProducts
      .filter(p => p.type === 'product')
      .reduce((sum, p) => sum + ((p.currentStock ?? p.openingStock ?? 0) * (p.costPrice || p.sellingPrice)), 0);

    const totalsSummary = [
      {
        label: 'Total Items in Filter:',
        value: `${filteredProducts.length} items`,
      },
      {
        label: 'Physical Stock Valuation:',
        value: formatCurrency(totalInventoryValue, business.currencySymbol),
      },
    ];

    exportToPDF(
      exportFilename,
      'Course & Product Catalog Report',
      subtitle,
      ['Name', 'Type', 'Category', 'Selling Price', 'Cost Price', 'Stock Level'],
      filteredProducts.map(p => [
        p.name,
        p.type === 'service' ? 'Service/Course' : 'Product',
        p.category,
        formatCurrency(p.sellingPrice, business.currencySymbol),
        p.costPrice ? formatCurrency(p.costPrice, business.currencySymbol) : '—',
        p.type === 'product' ? String(p.currentStock ?? p.openingStock ?? 0) : 'Service',
      ]),
      totalsSummary,
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
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-16 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Items &amp; Services</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#4C0196]">
              {products.length} Total Catalog Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage training programs, courses, digital services, physical hardware, and stock pricing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Delete Button */}
          {selectedProductIds.length > 0 && (
            <button
              onClick={() => setIsBatchDeleting(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedProductIds.length}) Selected</span>
            </button>
          )}

          {/* Export Dropdown */}
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export Catalog"
            disabled={filteredProducts.length === 0}
          />

          {/* Create Product or Service Button */}
          <button
            onClick={() => {
              resetForm();
              setIsAddingItem(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Product / Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by name, course syllabus, SKU, or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {(['all', 'service', 'product'] as const).map(f => {
            const count = products.filter(p => f === 'all' || p.type === f).length;
            return (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize flex items-center gap-1.5 ${
                  typeFilter === f
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{f === 'all' ? 'All Items' : f === 'service' ? 'Courses & Services' : 'Physical Products'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 text-[#4C0196] rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No catalog items found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `No products or services match "${searchTerm}". Try adjusting your search query.`
                  : 'Start by creating your first training course or inventory product to use in customer sales.'}
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
              <span>Create Product / Service</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#4C0196] focus:ring-[#4C0196] cursor-pointer"
                      title="Select all items for bulk delete"
                    />
                  </th>
                  <th className="py-3 px-4">Item Name &amp; Syllabus / Specs</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price (COGS)</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-right">Delete Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(item => {
                  const marginPct = item.sellingPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 : 0;
                  const isProduct = item.type === 'product';
                  const isLowStock = isProduct && typeof item.currentStock === 'number' && item.currentStock <= (item.minStockLevel || 5);
                  const isSelected = selectedProductIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-[#4C0196] focus:ring-[#4C0196] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 max-w-md truncate mt-0.5">{item.description}</div>
                        )}
                        {item.sku && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            SKU: <span className="font-semibold text-slate-600">{item.sku}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'service'
                              ? 'bg-purple-100 text-[#4C0196]'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.type === 'service' ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          <span>{item.type === 'service' ? 'Service' : 'Product'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.sellingPrice, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                        {item.costPrice > 0 ? formatCurrency(item.costPrice, business.currencySymbol) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-700 tabular-nums">
                        {marginPct > 0 ? `${marginPct.toFixed(0)}%` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isProduct ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold ${
                                isLowStock ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {item.currentStock ?? item.openingStock ?? 0} units
                            </span>
                            {isLowStock && (
                              <span title="Low stock warning alert">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic bg-slate-50 px-2 py-0.5 rounded">
                            Unlimited (Service)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PRODUCT OR SERVICE MODAL */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#4C0196] flex items-center justify-center font-bold">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Product or Service</h3>
                  <p className="text-[11px] text-slate-500">
                    Add courses, training programs, digital services, or physical stock items
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Section */}
            <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#4C0196]" />
                  <span>Quick Templates (Click to prefill)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-[#4C0196] border border-slate-200 hover:border-purple-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    + {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Catalog Item Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('service');
                      if (!category || category === 'Hardware & Supplies') setCategory('Software Training');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      type === 'service'
                        ? 'border-[#4C0196] bg-purple-50/70 text-purple-950 ring-1 ring-[#4C0196]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Layers className={`w-5 h-5 shrink-0 mt-0.5 ${type === 'service' ? 'text-[#4C0196]' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs">Training Course / Service</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Tuition, ICT workshops, repairs, computer time (Unlimited stock)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('product');
                      if (!category || category === 'Software Training') setCategory('Hardware & Supplies');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      type === 'product'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Package className={`w-5 h-5 shrink-0 mt-0.5 ${type === 'product' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs">Physical Inventory Product</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Hardware, cables, USB drives, accessories (Stock tracked)
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {type === 'service' ? 'Course / Service Title *' : 'Product / Hardware Name *'}
                </label>
                <input
                  type="text"
                  placeholder={type === 'service' ? 'e.g. Python Programming for Beginners' : 'e.g. Kingston 64GB Flash Drive'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden font-medium"
                  required
                  autoFocus
                />
              </div>

              {/* Category & Common Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <span className="text-[10px] text-slate-400">Select or type custom category</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Software Training, Hardware, Cabling"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                  required
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-[#4C0196] text-white border-[#4C0196]'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SKU / Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Item SKU / Reference Code (Optional)</label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-[10px] font-bold text-[#4C0196] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-generate SKU</span>
                  </button>
                </div>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. PRD-HRD-4921"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing & Profit Margin Preview */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Selling Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono font-bold text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#4C0196] outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Cost Price / Direct Cost ({business.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#4C0196] outline-hidden"
                  />
                </div>

                {liveSell > 0 && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Estimated Profit per Unit:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatCurrency(liveProfitUnit, business.currencySymbol)}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Gross Margin:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {liveMarginPct.toFixed(1)}%
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Inputs for Physical Products */}
              {type === 'product' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200">
                  <div>
                    <label className="block font-bold text-blue-950 mb-1">Opening Stock (Units)</label>
                    <input
                      type="number"
                      min="0"
                      value={openingStock}
                      onChange={e => setOpeningStock(parseInt(e.target.value) || '')}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 font-mono border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-950 mb-1">Low Stock Alert Level</label>
                    <input
                      type="number"
                      min="1"
                      value={minStockLevel}
                      onChange={e => setMinStockLevel(parseInt(e.target.value) || '')}
                      className="w-full px-3 py-2 font-mono border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {type === 'service' ? 'Course Syllabus / Service Description' : 'Product Specs & Warranty Info'}
                </label>
                <textarea
                  placeholder={
                    type === 'service'
                      ? 'Outline key modules, prerequisites, duration (e.g. 4 weeks), or certification provided...'
                      : 'Manufacturer specifications, model details, warranty duration, or packaging notes...'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl h-20 outline-hidden focus:ring-2 focus:ring-[#4C0196]"
                />
              </div>
            </div>

            {/* Modal Footer with "Save & Add Another" option */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProduct(true)}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-[#4C0196] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Save this product and keep the window open to create more products/services"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Save &amp; Add Another</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProduct(false)}
                  className="px-5 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ITEM DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete {itemToDelete.type === 'product' ? 'Product' : 'Service'}?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this catalog item? This will remove it from future sales selections.
                </p>
              </div>

              {/* Item Card Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{itemToDelete.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    itemToDelete.type === 'service' ? 'bg-purple-100 text-[#4C0196]' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {itemToDelete.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-slate-600">
                  <div>
                    Category: <span className="font-semibold text-slate-800">{itemToDelete.category}</span>
                  </div>
                  <div className="text-right">
                    Price: <span className="font-bold text-slate-900 font-mono">{formatCurrency(itemToDelete.sellingPrice, business.currencySymbol)}</span>
                  </div>
                  {itemToDelete.type === 'product' && (
                    <div className="col-span-2">
                      Current Stock: <span className="font-bold text-slate-800">{itemToDelete.currentStock ?? 0} units</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSingle}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {isBatchDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete {selectedProductIds.length} Catalog Items?</h3>
                <p className="text-xs text-slate-500">
                  You are about to permanently delete <strong className="text-slate-800">{selectedProductIds.length}</strong> selected products/services from your catalog. This action cannot be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleting(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBatch}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedProductIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
