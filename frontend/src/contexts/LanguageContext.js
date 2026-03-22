import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  es: {
    // Navigation
    dashboard: 'Panel Principal',
    clients: 'Clientes',
    pets: 'Mascotas',
    doctors: 'Doctores',
    cabinets: 'Gabinetes',
    inventory: 'Inventario',
    invoices: 'Facturación',
    settings: 'Configuración',
    aiAssistant: 'Asistente IA',
    logout: 'Cerrar Sesión',
    
    // Dashboard
    welcome: 'Bienvenido',
    totalClients: 'Total Clientes',
    totalPets: 'Total Mascotas',
    activeDoctors: 'Doctores Activos',
    pendingInvoices: 'Facturas Pendientes',
    upcomingVaccines: 'Vacunas Próximas',
    lowStockItems: 'Stock Bajo',
    recentActivity: 'Actividad Reciente',
    vaccineAlerts: 'Alertas de Vacunas',
    dueIn: 'Vence en',
    days: 'días',
    
    // Common
    search: 'Buscar',
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    address: 'Dirección',
    notes: 'Notas',
    actions: 'Acciones',
    status: 'Estado',
    date: 'Fecha',
    total: 'Total',
    loading: 'Cargando...',
    noResults: 'No hay resultados',
    
    // Clients
    newClient: 'Nuevo Cliente',
    editClient: 'Editar Cliente',
    clientDetails: 'Detalles del Cliente',
    
    // Pets
    newPet: 'Nueva Mascota',
    editPet: 'Editar Mascota',
    petDetails: 'Detalles de Mascota',
    species: 'Especie',
    breed: 'Raza',
    birthDate: 'Fecha Nacimiento',
    weight: 'Peso',
    gender: 'Género',
    color: 'Color',
    microchip: 'Microchip',
    owner: 'Propietario',
    medicalHistory: 'Historial Médico',
    vaccines: 'Vacunas',
    male: 'Macho',
    female: 'Hembra',
    
    // Doctors
    newDoctor: 'Nuevo Doctor',
    editDoctor: 'Editar Doctor',
    specialty: 'Especialidad',
    licenseNumber: 'Nº Licencia',
    active: 'Activo',
    inactive: 'Inactivo',
    
    // Cabinets
    newCabinet: 'Nuevo Gabinete',
    editCabinet: 'Editar Gabinete',
    equipment: 'Equipamiento',
    description: 'Descripción',
    
    // Inventory
    newItem: 'Nuevo Producto',
    editItem: 'Editar Producto',
    category: 'Categoría',
    quantity: 'Cantidad',
    unit: 'Unidad',
    minStock: 'Stock Mínimo',
    price: 'Precio',
    cost: 'Costo',
    expiryDate: 'Fecha Vencimiento',
    supplier: 'Proveedor',
    medicine: 'Medicamento',
    supply: 'Insumo',
    equipmentCat: 'Equipo',
    
    // Invoices
    newInvoice: 'Nueva Factura',
    invoiceDetails: 'Detalles de Factura',
    invoiceNumber: 'Nº Factura',
    client: 'Cliente',
    pet: 'Mascota',
    items: 'Artículos',
    subtotal: 'Subtotal',
    tax: 'IVA',
    pending: 'Pendiente',
    paid: 'Pagada',
    cancelled: 'Cancelada',
    markAsPaid: 'Marcar como Pagada',
    
    // Settings
    speciesAndBreeds: 'Especies y Razas',
    newSpecies: 'Nueva Especie',
    newBreed: 'Nueva Raza',
    
    // AI Assistant
    askAnything: 'Pregunta lo que necesites...',
    send: 'Enviar',
    aiWelcome: '¡Hola! Soy tu asistente de VetFlow. Puedo ayudarte a buscar información, crear registros y responder preguntas sobre el sistema.',
    
    // Auth
    login: 'Iniciar Sesión',
    loginWithGoogle: 'Continuar con Google',
    welcomeBack: 'Bienvenido de nuevo',
    
    // Landing
    heroTitle: 'Gestión Veterinaria Inteligente',
    heroSubtitle: 'El CRM definitivo para clínicas veterinarias modernas',
    getStarted: 'Comenzar Ahora',
    features: 'Características',
    feature1Title: 'Gestión de Pacientes',
    feature1Desc: 'Historial médico completo, vacunas y tratamientos',
    feature2Title: 'Facturación Integrada',
    feature2Desc: 'Crea y gestiona facturas en segundos',
    feature3Title: 'Inventario Inteligente',
    feature3Desc: 'Control de stock con alertas automáticas',
    feature4Title: 'Asistente IA',
    feature4Desc: 'Tu copiloto para gestionar la clínica',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    clients: 'Clients',
    pets: 'Pets',
    doctors: 'Doctors',
    cabinets: 'Rooms',
    inventory: 'Inventory',
    invoices: 'Billing',
    settings: 'Settings',
    aiAssistant: 'AI Assistant',
    logout: 'Logout',
    
    // Dashboard
    welcome: 'Welcome',
    totalClients: 'Total Clients',
    totalPets: 'Total Pets',
    activeDoctors: 'Active Doctors',
    pendingInvoices: 'Pending Invoices',
    upcomingVaccines: 'Upcoming Vaccines',
    lowStockItems: 'Low Stock',
    recentActivity: 'Recent Activity',
    vaccineAlerts: 'Vaccine Alerts',
    dueIn: 'Due in',
    days: 'days',
    
    // Common
    search: 'Search',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    total: 'Total',
    loading: 'Loading...',
    noResults: 'No results',
    
    // Clients
    newClient: 'New Client',
    editClient: 'Edit Client',
    clientDetails: 'Client Details',
    
    // Pets
    newPet: 'New Pet',
    editPet: 'Edit Pet',
    petDetails: 'Pet Details',
    species: 'Species',
    breed: 'Breed',
    birthDate: 'Birth Date',
    weight: 'Weight',
    gender: 'Gender',
    color: 'Color',
    microchip: 'Microchip',
    owner: 'Owner',
    medicalHistory: 'Medical History',
    vaccines: 'Vaccines',
    male: 'Male',
    female: 'Female',
    
    // Doctors
    newDoctor: 'New Doctor',
    editDoctor: 'Edit Doctor',
    specialty: 'Specialty',
    licenseNumber: 'License #',
    active: 'Active',
    inactive: 'Inactive',
    
    // Cabinets
    newCabinet: 'New Room',
    editCabinet: 'Edit Room',
    equipment: 'Equipment',
    description: 'Description',
    
    // Inventory
    newItem: 'New Item',
    editItem: 'Edit Item',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    minStock: 'Min Stock',
    price: 'Price',
    cost: 'Cost',
    expiryDate: 'Expiry Date',
    supplier: 'Supplier',
    medicine: 'Medicine',
    supply: 'Supply',
    equipmentCat: 'Equipment',
    
    // Invoices
    newInvoice: 'New Invoice',
    invoiceDetails: 'Invoice Details',
    invoiceNumber: 'Invoice #',
    client: 'Client',
    pet: 'Pet',
    items: 'Items',
    subtotal: 'Subtotal',
    tax: 'Tax',
    pending: 'Pending',
    paid: 'Paid',
    cancelled: 'Cancelled',
    markAsPaid: 'Mark as Paid',
    
    // Settings
    speciesAndBreeds: 'Species & Breeds',
    newSpecies: 'New Species',
    newBreed: 'New Breed',
    
    // AI Assistant
    askAnything: 'Ask anything...',
    send: 'Send',
    aiWelcome: 'Hi! I\'m your VetFlow assistant. I can help you search information, create records, and answer questions about the system.',
    
    // Auth
    login: 'Login',
    loginWithGoogle: 'Continue with Google',
    welcomeBack: 'Welcome back',
    
    // Landing
    heroTitle: 'Smart Veterinary Management',
    heroSubtitle: 'The definitive CRM for modern veterinary clinics',
    getStarted: 'Get Started',
    features: 'Features',
    feature1Title: 'Patient Management',
    feature1Desc: 'Complete medical history, vaccines and treatments',
    feature2Title: 'Integrated Billing',
    feature2Desc: 'Create and manage invoices in seconds',
    feature3Title: 'Smart Inventory',
    feature3Desc: 'Stock control with automatic alerts',
    feature4Title: 'AI Assistant',
    feature4Desc: 'Your copilot for clinic management',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('vetflow_language');
    return saved || 'es';
  });

  const t = useCallback((key) => {
    return translations[language]?.[key] || key;
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('vetflow_language', lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
