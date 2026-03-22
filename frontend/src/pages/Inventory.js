import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Inventory = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    min_stock: '',
    price: '',
    cost: '',
    expiry_date: '',
    supplier: '',
    notes: ''
  });

  const fetchItems = async () => {
    try {
      let url = `${API_URL}/api/inventory`;
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockFilter) params.append('low_stock', 'true');
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        let data = await response.json();
        if (search) {
          data = data.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter, lowStockFilter, search]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name || '',
        category: item.category || '',
        quantity: item.quantity?.toString() || '',
        unit: item.unit || '',
        min_stock: item.min_stock?.toString() || '',
        price: item.price?.toString() || '',
        cost: item.cost?.toString() || '',
        expiry_date: item.expiry_date || '',
        supplier: item.supplier || '',
        notes: item.notes || ''
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        category: 'medicine',
        quantity: '',
        unit: 'unidad',
        min_stock: '5',
        price: '',
        cost: '',
        expiry_date: '',
        supplier: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      quantity: parseInt(formData.quantity) || 0,
      min_stock: parseInt(formData.min_stock) || 0,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0
    };

    try {
      const url = selectedItem 
        ? `${API_URL}/api/inventory/${selectedItem.item_id}`
        : `${API_URL}/api/inventory`;
      
      const response = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(selectedItem ? 'Producto actualizado' : 'Producto creado');
        setDialogOpen(false);
        fetchItems();
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/api/inventory/${selectedItem.item_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Producto eliminado');
        setDeleteDialogOpen(false);
        fetchItems();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      medicine: t('medicine'),
      supply: t('supply'),
      equipment: t('equipmentCat')
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="inventory-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <Package className="w-7 h-7 text-orange-500" />
            {t('inventory')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {items.length} productos
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="btn-primary"
          data-testid="add-item-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newItem')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-field"
            data-testid="search-input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 input-field" data-testid="category-filter">
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="medicine">{t('medicine')}</SelectItem>
            <SelectItem value="supply">{t('supply')}</SelectItem>
            <SelectItem value="equipment">{t('equipmentCat')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={lowStockFilter ? 'default' : 'outline'}
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={lowStockFilter ? 'bg-red-600 hover:bg-red-700' : 'btn-secondary'}
          data-testid="low-stock-filter"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Stock Bajo
        </Button>
      </div>

      {/* Table */}
      <Card className="card-surface">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t('name')}</TableHead>
                  <TableHead className="text-zinc-400">{t('category')}</TableHead>
                  <TableHead className="text-zinc-400">{t('quantity')}</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">{t('price')}</TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">{t('expiryDate')}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLowStock = item.quantity <= item.min_stock;
                  return (
                    <TableRow 
                      key={item.item_id} 
                      className="table-row"
                      data-testid={`inventory-row-${item.item_id}`}
                    >
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-zinc-800">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={isLowStock ? 'text-red-400 font-semibold' : 'text-zinc-300'}>
                          {item.quantity} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-400 hidden md:table-cell">
                        ${item.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-zinc-400 hidden lg:table-cell">
                        {item.expiry_date || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            className="btn-ghost"
                            data-testid={`edit-item-${item.item_id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItem(item);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            data-testid={`delete-item-${item.item_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {selectedItem ? t('editItem') : t('newItem')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  data-testid="item-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="input-field" data-testid="item-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="medicine">{t('medicine')}</SelectItem>
                    <SelectItem value="supply">{t('supply')}</SelectItem>
                    <SelectItem value="equipment">{t('equipmentCat')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('unit')} *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input-field"
                  required
                  placeholder="unidad, ml, mg, etc."
                  data-testid="item-unit-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  required
                  data-testid="item-quantity-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">{t('minStock')}</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="input-field"
                  data-testid="item-minstock-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('price')} ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  data-testid="item-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">{t('cost')} ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input-field"
                  data-testid="item-cost-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">{t('expiryDate')}</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="input-field"
                  data-testid="item-expiry-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">{t('supplier')}</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="input-field"
                  data-testid="item-supplier-input"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[60px]"
                  data-testid="item-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-item-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('confirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de eliminar {selectedItem?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
