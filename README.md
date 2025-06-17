# Exactas Wiki

> **Nota sobre la generación de código**  
> El 99% del código de este proyecto fue generado automáticamente por Cascade, un asistente de IA desarrollado por Windsurf AI. Este modelo está basado en GPT-4 con capacidades mejoradas para desarrollo de software.

---

Visualizador de apuntes y materiales de estudio organizados por carrera y tipo de examen.

## Características

- Navegación por carpetas
- Vista previa de archivos PDF
- Interfaz responsive
- Búsqueda y filtrado
- Navegación con migas de pan

## Estructura de Carpetas

```
/
└── materias/
    └── [carrera]/
        └── [materia]/
            ├── 1er-parcial/
            ├── 1er-recuperatorio/
            ├── 2do-parcial/
            ├── 2do-recuperatorio/
            └── finales/
```

**Ejemplo de estructura real:**
```
materias/
└── computacion/
    ├── analisis-matematico-i/
    │   ├── 1er-parcial/
    │   │   └── parcial-2023-04-15.pdf
    │   ├── 2do-parcial/
    │   └── finales/
    │       └── final-2023-07-20.pdf
    └── sistemas-digitales/
        ├── 1er-parcial/
        │   ├── parcial-1-2023-05-10.pdf
        │   └── parcial-1-2023-05-15.pdf
        └── 2do-parcial/
            └── parcial-2-2023-07-05.pdf

# Donde:
# - [carrera]: Nombre de la carrera (ej: computacion, fisica, etc.)
# - [materia]: Nombre de la materia (ej: analisis-matematico-i, sistemas-digitales, etc.)
# - Los nombres de carpetas deben ser en minúsculas y usar guiones en lugar de espacios
```

## Cómo usar este proyecto

### Opción 1: Configuración directa (recomendado)

1. Haz clic en "Fork" en la esquina superior derecha de esta página para crear tu copia del repositorio.

2. Clona tu repositorio forkeado localmente:
   ```bash
   git clone https://github.com/tu-usuario/exactaswiki.git
   cd exactaswiki
   ```

3. Configura las variables en `main.js` con tus datos:
   ```javascript
   const REPO_OWNER = 'tu-usuario';  // Tu nombre de usuario de GitHub
   const REPO_NAME = 'exactaswiki';   // El nombre del repositorio
   const BRANCH = 'main';            // Rama principal (generalmente 'main' o 'master')
   ```

4. Sube los cambios a tu repositorio:
   ```bash
   git add .
   git commit -m "Configuración inicial"
   git push origin main
   ```

5. Habilita GitHub Pages en la configuración de tu repositorio (Settings > Pages).

### Opción 2: Contribuir con mejoras

Si deseas contribuir con mejoras al proyecto original:

1. Haz un fork del repositorio (si aún no lo has hecho).

2. Crea una rama para tu característica o corrección:
   ```bash
   git checkout -b mi-mejora
   ```

3. Realiza tus cambios y haz commit:
   ```bash
   git add .
   git commit -m "Descripción de los cambios realizados"
   ```

4. Sube los cambios a tu repositorio:
   ```bash
   git push origin mi-mejora
   ```

5. Crea un Pull Request (PR) al repositorio original:
   - Ve a la página de tu repositorio forkeado en GitHub
   - Haz clic en "Compare & pull request"
   - Describe los cambios realizados y por qué son útiles
   - Haz clic en "Create pull request"

## Despliegue

El sitio se despliega automáticamente en GitHub Pages cuando se hace push a la rama `main`.

## Licencia

MIT
