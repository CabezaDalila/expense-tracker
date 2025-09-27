# 💰 Expense Tracker

Una aplicación moderna de control de gastos construida con Next.js, TypeScript y Tailwind CSS.

## ✨ Características

- 📱 **Diseño responsivo** con tipografía fluida
- 🎨 **Interfaz moderna** con tema oscuro
- 📊 **Dashboard completo** con estadísticas
- 💳 **Gestión de categorías**: Gastos fijos, variables y tarjetas de crédito
- 📅 **Filtros por fecha** (año y mes)
- 🔄 **Propagación automática** para gastos fijos
- 💾 **Códigos de pago** con función de copia
- 🗄️ **Base de datos** con Neon (PostgreSQL)

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS con tipografía fluida
- **UI Components**: shadcn/ui
- **Base de datos**: Neon (PostgreSQL)
- **Deployment**: Vercel (recomendado)

## 🛠️ Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/TU_USUARIO/expense-tracker.git
cd expense-tracker
```

2. **Instala las dependencias**:
```bash
npm install
# o
pnpm install
```

3. **Configura las variables de entorno**:
Crea un archivo `.env.local`:
```env
DATABASE_URL=tu_url_de_neon_aqui
```

4. **Ejecuta la aplicación**:
```bash
npm run dev
# o
pnpm dev
```

5. **Abre tu navegador**:
Visita [http://localhost:3000](http://localhost:3000)

## 📱 Características móviles

- **Tipografía fluida** que se adapta a cualquier pantalla
- **Layout optimizado** para móviles
- **Formularios centrados** perfectamente
- **Navegación por tabs** en una sola fila

## 🎨 Diseño

- **Tema oscuro** elegante y moderno
- **Gradientes** y efectos visuales
- **Iconos** de Lucide React
- **Animaciones** suaves con Tailwind CSS

## 📊 Funcionalidades

### Dashboard
- Resumen de gastos totales
- Gastos pagados vs pendientes
- Próximos vencimientos
- Desglose por categorías

### Gestión de gastos
- Crear, editar y eliminar gastos
- Categorización automática
- Estados (pagado/pendiente)
- Notas y códigos de pago

### Filtros
- Por año y mes
- Por categoría
- Por estado
- Búsqueda por descripción

## 🔧 Scripts disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construcción
npm run start        # Producción
npm run lint         # Linting
```

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

Desarrollado con ❤️ usando Next.js y Tailwind CSS

