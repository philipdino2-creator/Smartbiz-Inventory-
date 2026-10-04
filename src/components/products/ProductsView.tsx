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
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { business, products, addProduct, updateProduct, deleteProduct, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('service');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [openingStock, setOpeningStock] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number | ''>('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, typeFilter, searchTerm]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const numSell = typeof sellingPrice === 'number' ? sellingPrice : parseFloat(sellingPrice);
    if (!name.trim() || !numSell || numSell < 0) return;

    const numCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
    const numOpenStock = type === 'product' ? (typeof openingStock === 'number' ? openingStock : parseInt(openingStock) || 0) : undefined;
    const numMinStock = type === 'product' ? (typeof minStockLevel === 'number' ? minStockLevel : parseInt(minStockLevel) || 5) : undefined;

    addProduct({
      name: name.trim(),
      type,
      sellingPrice: numSell,
      costPrice: numCost,
      category: category.trim() || (type === 'service' ? 'Course / Service' : 'Hardware & Supplies'),
      sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      openingStock: numOpenStock,
      minStockLevel: numMinStock,
      active: true,
    });

    setName('');
    setType('service');
    setSellingPrice('');
    setCostPrice('');
    setCategory('');
    setSku('');
    setDescription('');
    setOpeningStock('');
    setMinStockLevel('');
    setIsAddingItem(false);
  };

  const handleDelete = (prod: ProductService) => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete catalog items.');
      return;
    }
    if (window.confirm(`Delete ${prod.type} "${prod.name}"?`)) {
      deleteProduct(prod.id);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products &amp; Training Courses</h1>
          <p className="text-xs text-slate-500">Manage course catalogue, training programs, accessories, and inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export"
            disabled={filteredProducts.length === 0}
          />
          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Course or Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses, software, hardware, or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
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

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          {(['all', 'service', 'product'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                typeFilter === f ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? 'All Items' : f === 'service' ? 'Courses & Services' : 'Physical Products'}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No catalogue items found</p>
            <p className="text-xs text-slate-400 mt-1">Add courses or physical items to use when recording sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Item Name &amp; Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price (COGS)</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(item => {
                  const marginPct = item.sellingPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 : 0;
                  const isProduct = item.type === 'product';
                  const isLowStock = isProduct && typeof item.currentStock === 'number' && item.currentStock <= (item.minStockLevel || 5);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-500 max-w-sm truncate">{item.description}</div>
                        )}
                        {item.sku && <div className="text-[9px] font-mono text-slate-400">SKU: {item.sku}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.type === 'service' ? 'bg-purple-50 text-[#4C0196]' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {item.type === 'service' ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          <span className="capitalize">{item.type}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{item.category}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.sellingPrice, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                        {formatCurrency(item.costPrice, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-700 tabular-nums">
                        {marginPct.toFixed(0)}%
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isProduct ? (
                          <div className="inline-flex items-center gap-1 font-mono text-xs">
                            <span className={isLowStock ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                              {item.currentStock ?? 0}
                            </span>
                            {isLowStock && (
                              <span title="Low Stock Warning">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unlimited (Service)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {currentUser.role !== 'staff' && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">+ Add Course or Product</h3>
              <button
                onClick={() => setIsAddingItem(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Item Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="service">Training Course / Service</option>
                    <option value="product">Physical Product / Accessory</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Training"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Course Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Python Programming for Beginners"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ({business.currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price / Direct Cost ({business.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {type === 'product' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Opening Stock (Units)</label>
                    <input
                      type="number"
                      min="0"
                      value={openingStock}
                      onChange={e => setOpeningStock(parseInt(e.target.value) || '')}
                      className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={minStockLevel}
                      onChange={e => setMinStockLevel(parseInt(e.target.value) || '')}
                      className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg bg-white"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Curriculum / Product Description</label>
                <textarea
                  placeholder="Outline syllabus, key topics, or hardware warranty specifications"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4C0196] text-white font-bold rounded-lg hover:bg-[#3b0075]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
