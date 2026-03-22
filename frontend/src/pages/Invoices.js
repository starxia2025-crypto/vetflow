import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { FileText, Plus, Eye, Check, X, DollarSign } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Invoices = () => {
  const { t, language } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    pet_id: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    notes: ''
  });

  const fetchInvoices = async () => {
    try {
      let url = `${API_URL}/api/invoices`;
      if (statusFilter) url += `?status=${statusFilter}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        setInvoices(await response.json());
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clients`, { credentials: 'include' });
      if (response.ok) {
        setClients(await response.json());
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchPets = async (clientId = null) => {
    try {
      let url = `${API_URL}/api/pets`;
      if (clientId) url += `?client_id=${clientId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        setPets(await response.json());
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchPets();
  }, [statusFilter]);

  const handleOpenDialog = () => {
    setFormData({
      client_id: '',
      pet_id: '',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleViewDetails = async (invoice) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoice.invoice_id}`, { credentials: 'include' });
      if (response.ok) {
        setSelectedInvoice(await response.json());
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0
      }))
    };

    try {
      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Factura creada');
        setDialogOpen(false);
        fetchInvoices();
      } else {
        toast.error('Error al crear factura');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear factura');
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pay`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Factura marcada como pagada');
        fetchInvoices();
        if (selectedInvoice?.invoice_id === invoiceId) {
          setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
        }
      } else {
        toast.error('Error al actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleCancelInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Factura cancelada');
        fetchInvoices();
        if (selectedInvoice?.invoice_id === invoiceId) {
          setSelectedInvoice({ ...selectedInvoice, status: 'cancelled' });
        }
      } else {
        toast.error('Error al cancelar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cancelar');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      paid: 'badge-success',
      cancelled: 'badge-error'
    };
    const labels = {
      pending: t('pending'),
      paid: t('paid'),
      cancelled: t('cancelled')
    };
    return <Badge className={styles[status] || 'badge-info'}>{labels[status] || status}</Badge>;
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const tax = subtotal * 0.16;
    return { subtotal, tax, total: subtotal + tax };
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="invoices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <FileText className="w-7 h-7 text-orange-500" />
            {t('invoices')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {invoices.length} facturas
          </p>
        </div>
        <Button 
          onClick={handleOpenDialog} 
          className="btn-primary"
          data-testid="add-invoice-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newInvoice')}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 input-field" data-testid="status-filter">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="paid">{t('paid')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>
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
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t('invoiceNumber')}</TableHead>
                  <TableHead className="text-zinc-400">{t('client')}</TableHead>
                  <TableHead className="text-zinc-400">{t('total')}</TableHead>
                  <TableHead className="text-zinc-400">{t('status')}</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">{t('date')}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.invoice_id} 
                    className="table-row"
                    data-testid={`invoice-row-${invoice.invoice_id}`}
                  >
                    <TableCell className="font-medium text-white font-mono">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className="text-zinc-300">{invoice.client_name || '-'}</TableCell>
                    <TableCell className="text-white font-semibold">
                      ${invoice.total?.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-zinc-400 hidden md:table-cell">
                      {invoice.created_at?.split('T')[0]}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(invoice)}
                          className="btn-ghost"
                          data-testid={`view-invoice-${invoice.invoice_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePayInvoice(invoice.invoice_id)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              data-testid={`pay-invoice-${invoice.invoice_id}`}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelInvoice(invoice.invoice_id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              data-testid={`cancel-invoice-${invoice.invoice_id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {t('newInvoice')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('client')} *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, client_id: value, pet_id: '' });
                    fetchPets(value);
                  }}
                >
                  <SelectTrigger className="input-field" data-testid="invoice-client-select">
                    <SelectValue placeholder={t('client')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {clients.map((c) => (
                      <SelectItem key={c.client_id} value={c.client_id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('pet')}</Label>
                <Select
                  value={formData.pet_id}
                  onValueChange={(value) => setFormData({ ...formData, pet_id: value })}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger className="input-field" data-testid="invoice-pet-select">
                    <SelectValue placeholder={t('pet')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {pets.filter(p => p.client_id === formData.client_id).map((p) => (
                      <SelectItem key={p.pet_id} value={p.pet_id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('items')}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="btn-secondary">
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder={language === 'es' ? 'Descripción' : 'Description'}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="input-field"
                      required
                      data-testid={`item-description-${index}`}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="input-field"
                      min="1"
                      data-testid={`item-quantity-${index}`}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="input-field"
                      step="0.01"
                      data-testid={`item-price-${index}`}
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>{t('subtotal')}</span>
                <span>${calculateTotal().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t('tax')} (16%)</span>
                <span>${calculateTotal().tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg border-t border-zinc-700 pt-2">
                <span>{t('total')}</span>
                <span>${calculateTotal().total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field min-h-[60px]"
                data-testid="invoice-notes-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-invoice-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope'] flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              {selectedInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedInvoice.status)}
                <span className="text-zinc-400 text-sm">
                  {selectedInvoice.created_at?.split('T')[0]}
                </span>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-zinc-500 text-sm">{t('client')}</p>
                <p className="text-white font-medium">{selectedInvoice.client?.name}</p>
                <p className="text-zinc-400 text-sm">{selectedInvoice.client?.phone}</p>
                {selectedInvoice.pet && (
                  <p className="text-zinc-400 text-sm mt-2">🐾 {selectedInvoice.pet.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-zinc-500 text-sm">{t('items')}</p>
                {selectedInvoice.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-zinc-800">
                    <div>
                      <p className="text-white">{item.description}</p>
                      <p className="text-zinc-500 text-sm">
                        {item.quantity} x ${item.unit_price?.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-white font-medium">${item.total?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>{t('subtotal')}</span>
                  <span>${selectedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('tax')}</span>
                  <span>${selectedInvoice.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg border-t border-zinc-700 pt-2">
                  <span>{t('total')}</span>
                  <span>${selectedInvoice.total?.toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handlePayInvoice(selectedInvoice.invoice_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="dialog-pay-btn"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {t('markAsPaid')}
                  </Button>
                  <Button 
                    onClick={() => handleCancelInvoice(selectedInvoice.invoice_id)}
                    variant="outline"
                    className="flex-1 btn-secondary border-red-500/50 text-red-400"
                    data-testid="dialog-cancel-btn"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('cancel')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
