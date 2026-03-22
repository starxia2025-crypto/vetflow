import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Cabinets = () => {
  const { t } = useLanguage();
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    equipment: ''
  });

  const fetchCabinets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cabinets?active_only=false`, { credentials: 'include' });
      if (response.ok) {
        setCabinets(await response.json());
      }
    } catch (error) {
      console.error('Error fetching cabinets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabinets();
  }, []);

  const handleOpenDialog = (cabinet = null) => {
    if (cabinet) {
      setSelectedCabinet(cabinet);
      setFormData({
        name: cabinet.name || '',
        description: cabinet.description || '',
        equipment: cabinet.equipment?.join(', ') || ''
      });
    } else {
      setSelectedCabinet(null);
      setFormData({ name: '', description: '', equipment: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description,
      equipment: formData.equipment ? formData.equipment.split(',').map(e => e.trim()).filter(e => e) : []
    };

    try {
      const url = selectedCabinet 
        ? `${API_URL}/api/cabinets/${selectedCabinet.cabinet_id}`
        : `${API_URL}/api/cabinets`;
      
      const response = await fetch(url, {
        method: selectedCabinet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(selectedCabinet ? 'Gabinete actualizado' : 'Gabinete creado');
        setDialogOpen(false);
        fetchCabinets();
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
      const response = await fetch(`${API_URL}/api/cabinets/${selectedCabinet.cabinet_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Gabinete desactivado');
        setDeleteDialogOpen(false);
        fetchCabinets();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="cabinets-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <Building2 className="w-7 h-7 text-orange-500" />
            {t('cabinets')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {cabinets.filter(c => c.active !== false).length} gabinetes activos
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="btn-primary"
          data-testid="add-cabinet-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newCabinet')}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : cabinets.length === 0 ? (
        <Card className="card-surface">
          <CardContent className="p-12 text-center text-zinc-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cabinets.map((cabinet) => (
            <Card 
              key={cabinet.cabinet_id} 
              className="card-surface"
              data-testid={`cabinet-card-${cabinet.cabinet_id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{cabinet.name}</h3>
                      <Badge className={cabinet.active !== false ? 'badge-success' : 'badge-error'}>
                        {cabinet.active !== false ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(cabinet)}
                      className="btn-ghost h-8 w-8"
                      data-testid={`edit-cabinet-${cabinet.cabinet_id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {cabinet.active !== false && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCabinet(cabinet);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                        data-testid={`delete-cabinet-${cabinet.cabinet_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {cabinet.description && (
                  <p className="text-zinc-400 text-sm mb-3">{cabinet.description}</p>
                )}
                
                {cabinet.equipment?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {cabinet.equipment.slice(0, 4).map((eq, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-zinc-800">
                        {eq}
                      </Badge>
                    ))}
                    {cabinet.equipment.length > 4 && (
                      <Badge variant="outline" className="text-xs bg-zinc-800">
                        +{cabinet.equipment.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {selectedCabinet ? t('editCabinet') : t('newCabinet')}
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
                placeholder="Consultorio 1, Quirófano, etc."
                data-testid="cabinet-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[80px]"
                data-testid="cabinet-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">{t('equipment')}</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                className="input-field"
                placeholder="Mesa de exploración, Báscula, Microscopio (separados por coma)"
                data-testid="cabinet-equipment-input"
              />
              <p className="text-xs text-zinc-500">Separar equipos con comas</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-cabinet-btn">
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
              ¿Estás seguro de desactivar {selectedCabinet?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cabinets;
