import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Settings as SettingsIcon, Plus, Trash2, PawPrint, Tag } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { t, language, changeLanguage } = useLanguage();
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speciesDialogOpen, setSpeciesDialogOpen] = useState(false);
  const [breedDialogOpen, setBreedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ type: '', id: '', name: '' });
  const [speciesForm, setSpeciesForm] = useState({ name: '', name_en: '' });
  const [breedForm, setBreedForm] = useState({ name: '', name_en: '', species_id: '' });

  const fetchData = async () => {
    try {
      const [speciesRes, breedsRes] = await Promise.all([
        fetch(`${API_URL}/api/species`, { credentials: 'include' }),
        fetch(`${API_URL}/api/breeds`, { credentials: 'include' })
      ]);
      
      if (speciesRes.ok) setSpecies(await speciesRes.json());
      if (breedsRes.ok) setBreeds(await breedsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSpecies = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/species`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(speciesForm)
      });
      if (response.ok) {
        toast.success('Especie creada');
        setSpeciesDialogOpen(false);
        setSpeciesForm({ name: '', name_en: '' });
        fetchData();
      } else {
        toast.error('Error al crear');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear');
    }
  };

  const handleCreateBreed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/breeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(breedForm)
      });
      if (response.ok) {
        toast.success('Raza creada');
        setBreedDialogOpen(false);
        setBreedForm({ name: '', name_en: '', species_id: '' });
        fetchData();
      } else {
        toast.error('Error al crear');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear');
    }
  };

  const handleDelete = async () => {
    try {
      const endpoint = deleteItem.type === 'species' ? 'species' : 'breeds';
      const response = await fetch(`${API_URL}/api/${endpoint}/${deleteItem.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast.success('Eliminado correctamente');
        setDeleteDialogOpen(false);
        fetchData();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const getSpeciesName = (speciesId) => {
    const sp = species.find(s => s.species_id === speciesId);
    return sp ? (language === 'en' && sp.name_en ? sp.name_en : sp.name) : '-';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-orange-500" />
          {t('settings')}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {t('speciesAndBreeds')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species */}
        <Card className="card-surface">
          <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white font-['Manrope'] flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-orange-500" />
              {t('species')}
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setSpeciesDialogOpen(true)}
              className="btn-primary"
              data-testid="add-species-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('add')}
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : species.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">{t('noResults')}</p>
            ) : (
              <div className="space-y-2">
                {species.map((sp) => (
                  <div 
                    key={sp.species_id}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    data-testid={`species-item-${sp.species_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <PawPrint className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{sp.name}</p>
                        {sp.name_en && <p className="text-zinc-500 text-sm">{sp.name_en}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteItem({ type: 'species', id: sp.species_id, name: sp.name });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-testid={`delete-species-${sp.species_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breeds */}
        <Card className="card-surface">
          <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white font-['Manrope'] flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" />
              {t('breed')}s
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setBreedDialogOpen(true)}
              className="btn-primary"
              data-testid="add-breed-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('add')}
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : breeds.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">{t('noResults')}</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {breeds.map((br) => (
                  <div 
                    key={br.breed_id}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    data-testid={`breed-item-${br.breed_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-medium">{br.name}</p>
                        <p className="text-zinc-500 text-sm">{getSpeciesName(br.species_id)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteItem({ type: 'breed', id: br.breed_id, name: br.name });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-testid={`delete-breed-${br.breed_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Species Dialog */}
      <Dialog open={speciesDialogOpen} onOpenChange={setSpeciesDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {t('newSpecies')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSpecies} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="species-name">{t('name')} (Español) *</Label>
              <Input
                id="species-name"
                value={speciesForm.name}
                onChange={(e) => setSpeciesForm({ ...speciesForm, name: e.target.value })}
                className="input-field"
                required
                placeholder="Perro, Gato, Ave..."
                data-testid="species-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="species-name-en">{t('name')} (English)</Label>
              <Input
                id="species-name-en"
                value={speciesForm.name_en}
                onChange={(e) => setSpeciesForm({ ...speciesForm, name_en: e.target.value })}
                className="input-field"
                placeholder="Dog, Cat, Bird..."
                data-testid="species-name-en-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpeciesDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-species-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Breed Dialog */}
      <Dialog open={breedDialogOpen} onOpenChange={setBreedDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {t('newBreed')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBreed} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('species')} *</Label>
              <Select
                value={breedForm.species_id}
                onValueChange={(value) => setBreedForm({ ...breedForm, species_id: value })}
              >
                <SelectTrigger className="input-field" data-testid="breed-species-select">
                  <SelectValue placeholder={t('species')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {species.map((sp) => (
                    <SelectItem key={sp.species_id} value={sp.species_id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed-name">{t('name')} (Español) *</Label>
              <Input
                id="breed-name"
                value={breedForm.name}
                onChange={(e) => setBreedForm({ ...breedForm, name: e.target.value })}
                className="input-field"
                required
                placeholder="Labrador, Persa..."
                data-testid="breed-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed-name-en">{t('name')} (English)</Label>
              <Input
                id="breed-name-en"
                value={breedForm.name_en}
                onChange={(e) => setBreedForm({ ...breedForm, name_en: e.target.value })}
                className="input-field"
                placeholder="Labrador, Persian..."
                data-testid="breed-name-en-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBreedDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-breed-btn">
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
              ¿Estás seguro de eliminar "{deleteItem.name}"?
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

export default Settings;
