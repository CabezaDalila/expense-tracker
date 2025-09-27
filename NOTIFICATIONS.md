# Sistema de Notificaciones - Expense Tracker

## Descripción

Se ha implementado un sistema completo de notificaciones para recordar a los usuarios sobre gastos que vencen próximamente. El sistema incluye:

1. **Notificaciones visuales en la interfaz**
2. **Notificaciones del navegador (push notifications)**
3. **Configuración personalizable**

## Características Implementadas

### 1. Notificaciones Visuales

- **Banner de notificaciones urgentes**: Muestra gastos que vencen hoy y mañana
- **Tarjetas destacadas**: Diferentes colores para gastos que vencen hoy (rojo) vs mañana (amarillo)
- **Información detallada**: Descripción, categoría, monto y fecha de vencimiento
- **Botón de cerrar**: Permite ocultar las notificaciones temporalmente

### 2. Notificaciones del Navegador

- **Solicitud de permisos**: Solicita automáticamente permisos para notificaciones
- **Notificaciones contextuales**: Diferentes mensajes para gastos que vencen hoy vs mañana
- **Iconos personalizados**: Utiliza el logo de la aplicación
- **Acciones**: Incluye botones de acción en las notificaciones

### 3. Configuración Personalizable

- **Panel de configuración**: Nueva pestaña "Config" en la interfaz
- **Control granular**: Activar/desactivar diferentes tipos de notificaciones
- **Persistencia**: La configuración se guarda en localStorage
- **Estado de permisos**: Muestra el estado actual de los permisos del navegador

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`components/urgent-notifications.tsx`**
   - Componente principal para mostrar notificaciones urgentes
   - Integra notificaciones del navegador
   - Diseño responsivo con colores distintivos

2. **`components/notification-settings.tsx`**
   - Panel de configuración de notificaciones
   - Control de permisos del navegador
   - Configuración de tipos de recordatorios

3. **`hooks/use-notifications.ts`**
   - Hook personalizado para manejar notificaciones del navegador
   - Gestión de permisos
   - Funciones para mostrar diferentes tipos de notificaciones

4. **`app/api/expenses/upcoming/route.ts`**
   - API endpoint para obtener gastos próximos a vencer

5. **`app/api/expenses/today/route.ts`**
   - API endpoint para obtener gastos que vencen hoy

6. **`app/api/expenses/tomorrow/route.ts`**
   - API endpoint para obtener gastos que vencen mañana

### Archivos Modificados

1. **`lib/database.ts`**
   - Agregadas funciones: `getUpcomingExpenses()`, `getExpiringToday()`, `getExpiringTomorrow()`

2. **`app/page.tsx`**
   - Integrado componente de notificaciones urgentes
   - Agregada pestaña de configuración
   - Importaciones actualizadas

## Funcionalidades

### Notificaciones Automáticas

- **Al cargar la página**: Se muestran automáticamente las notificaciones de gastos próximos a vencer
- **Notificaciones del navegador**: Se envían automáticamente cuando se detectan gastos urgentes
- **Actualización en tiempo real**: Las notificaciones se actualizan cuando cambian los datos

### Tipos de Notificaciones

1. **Gastos que vencen HOY**:
   - Color rojo para máxima urgencia
   - Notificaciones del navegador con `requireInteraction: true`
   - Título: "¡Gasto vence HOY!"

2. **Gastos que vencen MAÑANA**:
   - Color amarillo para recordatorio
   - Notificaciones del navegador estándar
   - Título: "Recordatorio: Gasto vence mañana"

### Configuración

- **Notificaciones del navegador**: Activar/desactivar
- **Recordatorios diarios**: Para gastos que vencen mañana
- **Recordatorios urgentes**: Para gastos que vencen hoy
- **Estado de permisos**: Visualización del estado actual

## Uso

### Para el Usuario

1. **Primera vez**: El sistema solicitará permisos para notificaciones del navegador
2. **Configuración**: Ir a la pestaña "Config" para personalizar las notificaciones
3. **Notificaciones**: Las notificaciones aparecen automáticamente en la parte superior de la página

### Para Desarrolladores

```typescript
// Usar el hook de notificaciones
const { showExpenseReminder, requestPermission } = useNotifications()

// Mostrar notificación de gasto
showExpenseReminder("Internet", 25000, true) // true = vence hoy

// Solicitar permisos
const granted = await requestPermission()
```

## Compatibilidad

- **Navegadores soportados**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop y móvil
- **Fallback**: Si no hay soporte para notificaciones del navegador, solo se muestran las notificaciones visuales

## Consideraciones Técnicas

- **Performance**: Las consultas a la base de datos están optimizadas con índices
- **UX**: Las notificaciones no son intrusivas y se pueden cerrar
- **Accesibilidad**: Colores contrastantes y texto descriptivo
- **Responsive**: Funciona correctamente en dispositivos móviles

## Próximas Mejoras

- [ ] Notificaciones por email
- [ ] Recordatorios programados (cron jobs)
- [ ] Integración con calendarios
- [ ] Notificaciones push para móviles
- [ ] Configuración de horarios de notificación
