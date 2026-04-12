# Plan de Corrección para JSX Hardcodeado
## Solución Crítica para el Problema de JSX Transpilado

**Fecha:** 2026-04-02  
**Prioridad:** 🔴 CRÍTICA  
**Archivos Afectados:** 65 archivos

---

## 🚨 Diagnóstico del Problema

### Síntomas
- 65 archivos contienen imports de `jsx as _jsx, jsxs as _jsxs` de `react/jsx-runtime`
- El JSX ha sido transpilado a llamadas de función
- Código ilegible y difícil de mantener
- Posible corrupción del código fuente

### Ejemplo del Problema

```typescript
// ❌ CÓDIGO ACTUAL (Transpilado incorrectamente)
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function Button({ children }) {
  return _jsx("button", {
    className: "bg-blue-500",
    children: children
  });
}
```

### Causas Posibles

1. **Configuración incorrecta de Babel/TypeScript**
2. **Herramientas de minificación aplicadas al código fuente**
3. **Proceso de build que transpila JSX incorrectamente**
4. **Configuración de Next.js incorrecta**

---

## 🔍 Análisis de Archivos Afectados

### Lista Completa de Archivos

```
src/app/layout.tsx
src/app/page.tsx
src/app/template.tsx
src/app/not-found.tsx
src/app/opengraph-image.tsx
src/app/twitter-image.tsx
src/app/login/page.tsx
src/app/login/BackgroundShapes.tsx
src/app/crear-reporte/page.tsx
src/app/crear-reporte/CrearReporteClient.tsx
src/app/create-report/page.tsx
src/app/lista/page.tsx
src/app/monitoreo/page.tsx
src/app/operadores/page.tsx
src/app/operadores/monitoreo/page.tsx
src/app/operadores/monitoreo/MonitoreoClient.tsx
src/app/reportes/page.tsx
src/app/reportes/ReportesClient.tsx
src/app/reports/page.tsx
src/app/configuracion/page.tsx
src/app/tareas/page.tsx
src/app/usuarios/page.tsx
src/app/users/page.tsx
src/app/youtube/page.tsx

src/components/MobileInstallPrompt.tsx
src/components/ThemeTransitionOverlay.tsx
src/components/ThemeToggle.tsx
src/components/AuthWrapper.tsx
src/components/BirthdayWidget.tsx
src/components/ActiveUsersWidget.tsx
src/components/SuccessModal.tsx
src/components/SocialPlayer.tsx
src/components/ConfirmationModal.tsx
src/components/DescriptionCell.tsx
src/components/StreamCharts.tsx
src/components/ProcessingModal.tsx
src/components/StreamList.tsx
src/components/StreamPlayer.tsx
src/components/LoginMap.tsx
src/components/EmailSendModal.tsx
src/components/DateTimePicker.tsx
src/components/ConfirmModal.tsx
src/components/ReportSocials.tsx
src/components/SpecialEventsManager.tsx
src/components/ReportDetailModal.tsx
src/components/VideoJSPlayer.tsx
src/components/TaskCard.tsx
src/components/ScheduleEditor.tsx
src/components/BitcentralWidget.tsx
src/components/CommandPalette.tsx
src/components/Navbar.tsx

src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/textarea.tsx
src/components/ui/select.tsx
src/components/ui/checkbox.tsx
src/components/ui/table.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/popover.tsx
src/components/ui/tooltip.tsx
src/components/ui/calendar.tsx
src/components/ui/tabs.tsx
src/components/ui/scroll-area.tsx
src/components/ui/skeleton.tsx
src/components/ui/sonner.tsx
src/components/ui/alert.tsx
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/label.tsx
src/components/theme-provider.tsx
```

---

## 🛠️ Solución Propuesta

### Estrategia General

1. **Identificar la causa raíz** del problema de transpilación
2. **Corregir la configuración** de Next.js/TypeScript
3. **Restaurar el código JSX** a su forma original
4. **Validar** que la aplicación funcione correctamente

### Opción A: Restauración desde Git (RECOMENDADA)

Si el código original con JSX está disponible en el historial de Git:

```bash
# 1. Identificar el commit donde el JSX era correcto
git log --oneline --all | head -20

# 2. Comparar para ver cuándo cambió
git diff <commit-antes> <commit-despues> -- src/app/layout.tsx

# 3. Si es posible, restaurar desde un commit anterior
git checkout <commit-con-jsx-correcto> -- src/

# 4. Verificar que la aplicación funcione
npm run dev
```

### Opción B: Corrección Manual con Script

Si no hay acceso al código original, crear un script para transformar el código:

```typescript
// scripts/fix-jsx-hardcode.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface JSXCall {
  type: 'jsx' | 'jsxs';
  props: string;
  children: string;
}

function parseJSXCall(content: string): string {
  // Patrón para encontrar llamadas a _jsx y _jsxs
  const jsxPattern = /_(jsx|jsxs)\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}([^)]*)\)/g;
  
  return content.replace(jsxPattern, (match, type, tag, props, rest) => {
    const propsStr = props.trim();
    const restStr = rest.trim();
    
    // Si hay children en rest
    if (restStr.includes('children:')) {
      const childrenMatch = restStr.match(/children:\s*(.+?)(?:,\s*)?$/);
      if (childrenMatch) {
        const children = childrenMatch[1];
        const cleanProps = propsStr ? ` ${propsStr}` : '';
        return `<${tag}${cleanProps}>${children}</${tag}>`;
      }
    }
    
    // Si no hay children
    const cleanProps = propsStr ? ` ${propsStr}` : '';
    return `<${tag}${cleanProps} />`;
  });
}

function processFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Solo procesar archivos que importen react/jsx-runtime
    if (!content.includes('react/jsx-runtime')) {
      return;
    }
    
    const fixedContent = parseJSXCall(content);
    
    // Eliminar el import de react/jsx-runtime
    const cleanedContent = fixedContent.replace(
      /import\s*\{[^}]*jsx[^}]*\}\s*from\s*["']react\/jsx-runtime["'];?\s*/g,
      ''
    );
    
    writeFileSync(filePath, cleanedContent, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

function processDirectory(dir: string): void {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);
    
    if (stats.isDirectory()) {
      // Ignorar node_modules y .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

// Ejecutar
processDirectory('src');
console.log('\n✨ JSX hardcode fix complete!');
```

### Opción C: Corrección de Configuración

#### 1. Verificar `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegurarse de que no haya transformaciones innecesarias
  swcMinify: true,
  compiler: {
    // No usar transformaciones personalizadas
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Resto de configuración...
};

module.exports = nextConfig;
```

#### 2. Verificar `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,  // IMPORTANTE: Habilitar strict mode
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",  // IMPORTANTE: Next.js maneja esto
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

#### 3. Verificar `.babelrc` o `babel.config.js`

Si existe un archivo de configuración de Babel, puede estar causando el problema:

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['next/babel', {
      'preset-env': {},
      'preset-react': {
        runtime: 'automatic',  // IMPORTANTE
        importSource: 'react',  // IMPORTANTE
      },
    }],
  ],
};
```

---

## 📋 Plan de Ejecución

### Fase 1: Diagnóstico (1 día)

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| 1.1 Revisar historial de Git | Dev | 1h |
| 1.2 Identificar cuándo cambió el JSX | Dev | 1h |
| 1.3 Verificar configuración de Next.js | Dev | 30m |
| 1.4 Verificar configuración de TypeScript | Dev | 30m |
| 1.5 Verificar si hay Babel config | Dev | 30m |
| 1.6 Documentar causa raíz | Dev | 1h |

### Fase 2: Preparación (1 día)

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| 2.1 Hacer backup del código actual | Dev | 15m |
| 2.2 Crear rama de fix | Dev | 15m |
| 2.3 Crear script de transformación | Dev | 2h |
| 2.4 Probar script en archivo de prueba | Dev | 1h |
| 2.5 Plan de rollback | Dev | 30m |

### Fase 3: Ejecución (2-3 días)

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| 3.1 Corregir configuración si es necesario | Dev | 1h |
| 3.2 Ejecutar script de transformación | Dev | 1h |
| 3.3 Revisar archivos transformados manualmente | Dev | 4h |
| 3.4 Corregir errores de transformación | Dev | 4h |
| 3.5 Ejecutar tests (si existen) | Dev | 1h |
| 3.6 Verificar que la app compile | Dev | 30m |
| 3.7 Verificar que la app funcione | Dev | 2h |

### Fase 4: Validación (1 día)

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| 4.1 Probar todas las páginas principales | QA | 2h |
| 4.2 Probar todos los componentes UI | QA | 2h |
| 4.3 Probar funcionalidades críticas | QA | 2h |
| 4.4 Verificar console errors | QA | 1h |
| 4.5 Verificar performance | QA | 1h |

### Fase 5: Despliegue (1 día)

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| 5.1 Code review del fix | Senior Dev | 2h |
| 5.2 Merge a main | Dev | 15m |
| 5.3 Build de producción | Dev | 30m |
| 5.4 Deploy a staging | DevOps | 30m |
| 5.5 Validación en staging | QA | 2h |
| 5.6 Deploy a producción | DevOps | 30m |
| 5.7 Validación en producción | QA | 1h |

---

## 🎯 Ejemplo de Transformación

### Antes (JSX Hardcodeado)

```typescript
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function Card({ children, className }) {
  return _jsx("div", {
    className: "border rounded-lg p-4 " + className,
    children: _jsxs("div", {
      className: "flex justify-between",
      children: [
        _jsx("h2", { children: "Title" }),
        _jsx("button", { children: "Close" })
      ]
    })
  });
}
```

### Después (JSX Normal)

```typescript
export function Card({ children, className }) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex justify-between">
        <h2>Title</h2>
        <button>Close</button>
      </div>
    </div>
  );
}
```

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Pérdida de código original
- **Probabilidad:** Alta si no hay Git
- **Impacto:** Crítico
- **Mitigación:** Hacer backup completo antes de cambios

### Riesgo 2: Transformación incorrecta
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Revisión manual de cada archivo transformado

### Riesgo 3: Romper la aplicación
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Testing exhaustivo antes de deploy

### Riesgo 4: Problemas de performance
- **Probabilidad:** Baja
- **Impacto:** Medio
- **Mitigación:** Benchmarking antes y después

---

## 📊 Métricas de Éxito

### Antes
- **Archivos con JSX hardcodeado:** 65
- **Líneas de código ilegibles:** ~5,000+
- **Imports de react/jsx-runtime:** 65
- **Legibilidad:** 2/10

### Después (Objetivo)
- **Archivos con JSX hardcodeado:** 0
- **Líneas de código ilegibles:** 0
- **Imports de react/jsx-runtime:** 0
- **Legibilidad:** 9/10

---

## 🚀 Próximos Pasos

1. **Inmediato:** Revisar historial de Git para encontrar código original
2. **Hoy:** Identificar causa raíz del problema
3. **Mañana:** Crear script de transformación
4. **Esta semana:** Ejecutar fix completo
5. **Próxima semana:** Validación y despliegue

---

## 📞 Soporte

Si se encuentran problemas durante la ejecución de este plan:

1. Revisar logs de compilación de Next.js
2. Verificar configuración de TypeScript
3. Consultar documentación de Next.js 15
4. Contactar al equipo de desarrollo senior

---

**Fin del Plan de Corrección para JSX Hardcodeado**
