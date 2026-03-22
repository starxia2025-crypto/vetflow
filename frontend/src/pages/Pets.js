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
import { PawPrint, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Pets = () => {
  const { t } = useLanguage();
  const [pets, setPets] = useState([]);
  const [clients, setClients] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petDetails, setPetDetails] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    species_id: '',
    breed_id: '',
    client_id: '',
    birth_date: '',
    weight: '',
    gender: '',
    color: '',
    microchip: '',
    notes: ''
  });

  const fetchPets = async () => {
    try {
      const url = search 
        ? `${API_URL}/api/pets?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/pets`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        setPets(await response.json());
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
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

  const fetchSpecies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/species`, { credentials: 'include' });
      if (response.ok) {
        setSpecies(await response.json());
      }
    } catch (error) {
      console.error('Error fetching species:', error);
    }
  };

  const fetchBreeds = async (speciesId = null) => {
    try {
      const url = speciesId 
        ? `${API_URL}/api/breeds?species_id=${speciesId}`
        : `${API_URL}/api/breeds`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        setBreeds(await response.json());
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  useEffect(() => {
    fetchPets();
    fetchClients();
    fetchSpecies();
    fetchBreeds();
  }, [search]);

  const handleOpenDialog = (pet = null) => {
    if (pet) {
      setSelectedPet(pet);
      setFormData({
        name: pet.name || '',
        species_id: pet.species_id || '',
        breed_id: pet.breed_id || '',
        client_id: pet.client_id || '',
        birth_date: pet.birth_date || '',
        weight: pet.weight?.toString() || '',
        gender: pet.gender || '',
        color: pet.color || '',
        microchip: pet.microchip || '',
        notes: pet.notes || ''
      });
      if (pet.species_id) {
        fetchBreeds(pet.species_id);
      }
    } else {
      setSelectedPet(null);
      setFormData({
        name: '',
        species_id: '',
        breed_id: '',
        client_id: '',
        birth_date: '',
        weight: '',
        gender: '',
        color: '',
        microchip: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleViewDetails = async (pet) => {
    try {
      const response = await fetch(`${API_URL}/api/pets/${pet.pet_id}`, { credentials: 'include' });
      if (response.ok) {
        setPetDetails(await response.json());
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching pet details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : null
    };

    try {
      const url = selectedPet 
        ? `${API_URL}/api/pets/${selectedPet.pet_id}`
        : `${API_URL}/api/pets`;
      
      const response = await fetch(url, {
        method: selectedPet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(selectedPet ? 'Mascota actualizada' : 'Mascota registrada');
        setDialogOpen(false);
        fetchPets();
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
      const response = await fetch(`${API_URL}/api/pets/${selectedPet.pet_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Mascota eliminada');
        setDeleteDialogOpen(false);
        fetchPets();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="pets-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-orange-500" />
            {t('pets')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {pets.length} {t('pets').toLowerCase()}
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="btn-primary"
          data-testid="add-pet-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newPet')}
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
          ) : pets.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <PawPrint className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t('name')}</TableHead>
                  <TableHead className="text-zinc-400">{t('species')}</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">{t('breed')}</TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">{t('owner')}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.map((pet) => (
                  <TableRow 
                    key={pet.pet_id} 
                    className="table-row"
                    data-testid={`pet-row-${pet.pet_id}`}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <PawPrint className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          {pet.name}
                          {pet.gender && (
                            <Badge className="ml-2 text-xs" variant="outline">
                              {pet.gender === 'male' ? t('male') : t('female')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{pet.species_name || '-'}</TableCell>
                    <TableCell className="text-zinc-400 hidden md:table-cell">{pet.breed_name || '-'}</TableCell>
                    <TableCell className="text-zinc-400 hidden lg:table-cell">{pet.client_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(pet)}
                          className="btn-ghost"
                          data-testid={`view-pet-${pet.pet_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(pet)}
                          className="btn-ghost"
                          data-testid={`edit-pet-${pet.pet_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPet(pet);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`delete-pet-${pet.pet_id}`}
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
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {selectedPet ? t('editPet') : t('newPet')}
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
                  data-testid="pet-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('species')} *</Label>
                <Select
                  value={formData.species_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, species_id: value, breed_id: '' });
                    fetchBreeds(value);
                  }}
                >
                  <SelectTrigger className="input-field" data-testid="species-select">
                    <SelectValue placeholder={t('species')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {species.map((s) => (
                      <SelectItem key={s.species_id} value={s.species_id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('breed')}</Label>
                <Select
                  value={formData.breed_id}
                  onValueChange={(value) => setFormData({ ...formData, breed_id: value })}
                  disabled={!formData.species_id}
                >
                  <SelectTrigger className="input-field" data-testid="breed-select">
                    <SelectValue placeholder={t('breed')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {breeds.filter(b => b.species_id === formData.species_id).map((b) => (
                      <SelectItem key={b.breed_id} value={b.breed_id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>{t('owner')} *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="input-field" data-testid="client-select">
                    <SelectValue placeholder={t('owner')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {clients.map((c) => (
                      <SelectItem key={c.client_id} value={c.client_id}>
                        {c.name} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">{t('birthDate')}</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="input-field"
                  data-testid="pet-birthdate-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">{t('weight')} (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="input-field"
                  data-testid="pet-weight-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('gender')}</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="input-field" data-testid="gender-select">
                    <SelectValue placeholder={t('gender')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="female">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">{t('color')}</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="input-field"
                  data-testid="pet-color-input"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="microchip">{t('microchip')}</Label>
                <Input
                  id="microchip"
                  value={formData.microchip}
                  onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                  className="input-field"
                  data-testid="pet-microchip-input"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[60px]"
                  data-testid="pet-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-pet-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pet Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {petDetails?.name} - {t('petDetails')}
            </DialogTitle>
          </DialogHeader>
          {petDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-zinc-500 text-sm">{t('species')}</p>
                  <p className="text-white">{petDetails.species_name}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">{t('breed')}</p>
                  <p className="text-white">{petDetails.breed_name || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">{t('gender')}</p>
                  <p className="text-white">{petDetails.gender === 'male' ? t('male') : petDetails.gender === 'female' ? t('female') : '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">{t('birthDate')}</p>
                  <p className="text-white">{petDetails.birth_date || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">{t('weight')}</p>
                  <p className="text-white">{petDetails.weight ? `${petDetails.weight} kg` : '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">{t('microchip')}</p>
                  <p className="text-white">{petDetails.microchip || '-'}</p>
                </div>
              </div>

              {petDetails.client && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <p className="text-zinc-500 text-sm mb-2">{t('owner')}</p>
                  <p className="text-white font-medium">{petDetails.client.name}</p>
                  <p className="text-zinc-400 text-sm">{petDetails.client.phone}</p>
                </div>
              )}

              {/* Vaccines */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  💉 {t('vaccines')}
                </h3>
                {petDetails.vaccines?.length > 0 ? (
                  <div className="space-y-2">
                    {petDetails.vaccines.map((v, i) => (
                      <div key={i} className="p-3 bg-zinc-800/30 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-white">{v.name}</p>
                          <p className="text-zinc-500 text-sm">{v.applied_date}</p>
                        </div>
                        {v.next_due_date && (
                          <Badge className="badge-warning">
                            Próx: {v.next_due_date}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">{t('noResults')}</p>
                )}
              </div>

              {/* Medical History */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  📋 {t('medicalHistory')}
                </h3>
                {petDetails.medical_history?.length > 0 ? (
                  <div className="space-y-2">
                    {petDetails.medical_history.map((h, i) => (
                      <div key={i} className="p-3 bg-zinc-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="badge-info">{h.type}</Badge>
                          <span className="text-zinc-500 text-sm">{h.date}</span>
                        </div>
                        <p className="text-white">{h.description}</p>
                        {h.diagnosis && <p className="text-zinc-400 text-sm mt-1">Dx: {h.diagnosis}</p>}
                        {h.treatment && <p className="text-green-400 text-sm mt-1">Tx: {h.treatment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">{t('noResults')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('confirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de eliminar a {selectedPet?.name}? Esta acción no se puede deshacer.
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

export default Pets;
