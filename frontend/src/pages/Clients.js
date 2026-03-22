import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Users, Plus, Search, Edit2, Trash2, PawPrint } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Clients = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const fetchClients = async () => {
    try {
      const url = search 
        ? `${API_URL}/api/clients?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/clients`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        setClients(await response.json());
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || ''
      });
    } else {
      setSelectedClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = selectedClient 
        ? `${API_URL}/api/clients/${selectedClient.client_id}`
        : `${API_URL}/api/clients`;
      
      const response = await fetch(url, {
        method: selectedClient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedClient ? 'Cliente actualizado' : 'Cliente creado');
        setDialogOpen(false);
        fetchClients();
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
      const response = await fetch(`${API_URL}/api/clients/${selectedClient.client_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Cliente eliminado');
        setDeleteDialogOpen(false);
        fetchClients();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="clients-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-500" />
            {t('clients')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {clients.length} {t('clients').toLowerCase()}
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="btn-primary"
          data-testid="add-client-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newClient')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 input-field"
          data-testid="search-input"
        />
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
          ) : clients.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t('name')}</TableHead>
                  <TableHead className="text-zinc-400">{t('phone')}</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">{t('email')}</TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">{t('address')}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow 
                    key={client.client_id} 
                    className="table-row"
                    data-testid={`client-row-${client.client_id}`}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <span className="text-orange-500 text-sm font-semibold">
                            {client.name?.charAt(0)}
                          </span>
                        </div>
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{client.phone}</TableCell>
                    <TableCell className="text-zinc-400 hidden md:table-cell">{client.email || '-'}</TableCell>
                    <TableCell className="text-zinc-400 hidden lg:table-cell truncate max-w-[200px]">
                      {client.address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(client)}
                          className="btn-ghost"
                          data-testid={`edit-client-${client.client_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedClient(client);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`delete-client-${client.client_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {selectedClient ? t('editClient') : t('newClient')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
                data-testid="client-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')} *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                required
                data-testid="client-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                data-testid="client-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                data-testid="client-address-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field min-h-[80px]"
                data-testid="client-notes-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-client-btn">
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
              ¿Estás seguro de eliminar a {selectedClient?.name}? Esta acción no se puede deshacer.
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

export default Clients;
