import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Stethoscope, Plus, Edit2, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Doctors = () => {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: ''
  });

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/doctors?active_only=false`, { credentials: 'include' });
      if (response.ok) {
        setDoctors(await response.json());
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setSelectedDoctor(doctor);
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialty: doctor.specialty || '',
        license_number: doctor.license_number || ''
      });
    } else {
      setSelectedDoctor(null);
      setFormData({ name: '', email: '', phone: '', specialty: '', license_number: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = selectedDoctor 
        ? `${API_URL}/api/doctors/${selectedDoctor.doctor_id}`
        : `${API_URL}/api/doctors`;
      
      const response = await fetch(url, {
        method: selectedDoctor ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedDoctor ? 'Doctor actualizado' : 'Doctor creado');
        setDialogOpen(false);
        fetchDoctors();
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
      const response = await fetch(`${API_URL}/api/doctors/${selectedDoctor.doctor_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Doctor desactivado');
        setDeleteDialogOpen(false);
        fetchDoctors();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="doctors-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-orange-500" />
            {t('doctors')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {doctors.filter(d => d.active !== false).length} {t('activeDoctors').toLowerCase()}
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="btn-primary"
          data-testid="add-doctor-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newDoctor')}
        </Button>
      </div>

      {/* Table */}
      <Card className="card-surface">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t('name')}</TableHead>
                  <TableHead className="text-zinc-400">{t('specialty')}</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">{t('licenseNumber')}</TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">{t('phone')}</TableHead>
                  <TableHead className="text-zinc-400">{t('status')}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow 
                    key={doctor.doctor_id} 
                    className="table-row"
                    data-testid={`doctor-row-${doctor.doctor_id}`}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p>{doctor.name}</p>
                          <p className="text-zinc-500 text-xs">{doctor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{doctor.specialty || '-'}</TableCell>
                    <TableCell className="text-zinc-400 hidden md:table-cell">{doctor.license_number || '-'}</TableCell>
                    <TableCell className="text-zinc-400 hidden lg:table-cell">{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={doctor.active !== false ? 'badge-success' : 'badge-error'}>
                        {doctor.active !== false ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(doctor)}
                          className="btn-ghost"
                          data-testid={`edit-doctor-${doctor.doctor_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {doctor.active !== false && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            data-testid={`delete-doctor-${doctor.doctor_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {selectedDoctor ? t('editDoctor') : t('newDoctor')}
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
                data-testid="doctor-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">{t('specialty')}</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="input-field"
                placeholder="Medicina General, Cirugía, etc."
                data-testid="doctor-specialty-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">{t('licenseNumber')}</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="input-field"
                data-testid="doctor-license-input"
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
                data-testid="doctor-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                data-testid="doctor-phone-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="btn-secondary">
                {t('cancel')}
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-doctor-btn">
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
              ¿Estás seguro de desactivar a {selectedDoctor?.name}?
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

export default Doctors;
