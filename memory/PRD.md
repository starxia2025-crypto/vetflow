# VetFlow CRM - Product Requirements Document

## Original Problem Statement
Sistema web tipo CRM online, responsive, moderno minimalista con dashboard, especializado exclusivamente a clínicas veterinarias, que pueda manejar varios doctores, varios gabinetes/consultas, maestro de clientes y mascotas, seguimiento histórico de análisis que deben hacerse las mascotas, avisos de vacunas por vencer, inventario de medicinas y otros productos, gestión de facturas y cobros, gestión de razas y especies. Debe tener un tipo de agente de IA que se alimente de todo el sistema y pueda crear, buscar, enviar email pacientes etc, que pueda ayudar en todo sentido al usuario.

## User Choices
- **AI Provider**: OpenAI GPT-5.2
- **Email Service**: Gmail (preparado pero desactivado por ahora)
- **Authentication**: Google Auth via Emergent
- **Language**: Multiidioma (Español / English)
- **Design**: Naranja y negro, moderno minimalista, con imágenes de mascotas

## User Personas
1. **Veterinario/Doctor**: Necesita acceso rápido a historiales médicos, registrar consultas y tratamientos
2. **Administrador de Clínica**: Gestiona facturas, inventario, doctores y gabinetes
3. **Recepcionista**: Registra clientes, programa citas, gestiona vacunas

## Core Requirements
- [x] Dashboard con métricas principales
- [x] Gestión de Clientes (CRUD)
- [x] Gestión de Mascotas con historial médico y vacunas
- [x] Gestión de Doctores/Veterinarios
- [x] Gestión de Gabinetes/Consultas
- [x] Gestión de Inventario (medicinas, insumos, equipos)
- [x] Sistema de Facturación con IVA
- [x] Gestión de Especies y Razas
- [x] Alertas de vacunas próximas a vencer
- [x] Alertas de stock bajo
- [x] Asistente IA integrado (GPT-5.2)
- [x] Multiidioma (ES/EN)
- [x] Google Auth

## Architecture
- **Frontend**: React 19, TailwindCSS, shadcn/UI
- **Backend**: FastAPI, Python 3.12
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via emergentintegrations
- **Auth**: Emergent Google OAuth

## What's Been Implemented (March 22, 2026)
1. ✅ Landing page con hero, features y Google Auth
2. ✅ Sistema de autenticación con cookies httpOnly
3. ✅ Dashboard con estadísticas en tiempo real
4. ✅ CRUD completo de Clientes
5. ✅ CRUD completo de Mascotas con historial médico
6. ✅ CRUD completo de Doctores
7. ✅ CRUD completo de Gabinetes
8. ✅ CRUD completo de Inventario con filtros
9. ✅ Sistema de Facturación con cálculo de IVA
10. ✅ Gestión de Especies y Razas
11. ✅ Alertas de vacunas próximas
12. ✅ Asistente IA funcional
13. ✅ Cambio de idioma ES/EN
14. ✅ Diseño responsive

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Integración de envío de emails (Gmail/SendGrid) para recordatorios de vacunas
- [ ] Sistema de citas/agenda de consultas

### P1 - High Priority
- [ ] Historial de análisis clínicos con adjuntos
- [ ] Reportes y estadísticas avanzadas
- [ ] Búsqueda global en el sistema
- [ ] Notificaciones push/email automáticas

### P2 - Medium Priority
- [ ] Módulo de caja y cobros parciales
- [ ] Gestión de múltiples clínicas/sucursales
- [ ] Roles y permisos (admin, doctor, recepcionista)
- [ ] Exportación a PDF de facturas e historiales

### P3 - Nice to Have
- [ ] Integración con laboratorios externos
- [ ] App móvil nativa
- [ ] Portal para clientes (ver historial de su mascota)
- [ ] Integración con pasarelas de pago (Stripe)

## Next Tasks
1. Implementar sistema de citas con calendario
2. Integrar envío de emails para recordatorios
3. Añadir análisis clínicos con archivos adjuntos
