# Guía de Workspaces y Features

## Índice
- [Introducción](#introducción)
- [Conceptos Clave](#conceptos-clave)
- [Dos Modos de Trabajo](#dos-modos-de-trabajo)
- [Cuándo Usar Cada Modo](#cuándo-usar-cada-modo)
- [Guía de Uso - Modo Software Factory](#guía-de-uso---modo-software-factory)
- [Guía de Uso - Modo Producto](#guía-de-uso---modo-producto)
- [Configuración](#configuración)
- [Casos de Uso](#casos-de-uso)

## Introducción

El sistema ahora soporta dos casos de uso principales:

1. **Modo Software Factory**: Para proyectos completos desde cero
2. **Modo Producto**: Para añadir features/PRDs a proyectos existentes

Esta flexibilidad permite que tanto empresas de producto como software factories puedan utilizar el sistema de la forma que mejor se adapte a sus necesidades.

## Conceptos Clave

### Workspace (Proyecto)
Un **Workspace** es un contenedor para un proyecto completo. Representa un sistema o aplicación completa que se está desarrollando desde cero.

**Características:**
- Contiene múltiples documentos iniciales (brief, especificaciones, referencias)
- Se analiza de forma comprehensiva con AI
- Genera recomendaciones de módulos, stack tecnológico, y estimaciones
- Puede contener múltiples Features/PRDs dentro

### Feature/PRD
Un **Feature** o **PRD** es una funcionalidad específica o mejora dentro de un proyecto.

**Características:**
- Puede ser standalone (independiente) o pertenecer a un Workspace
- Se enfoca en una funcionalidad específica
- Genera PRD detallado, backlog, y plan de trabajo

## Dos Modos de Trabajo

### Modo Software Factory (Proyectos desde 0)

**¿Para quién?**
- Software factories que desarrollan proyectos completos para clientes
- Empresas que inician nuevos productos desde cero
- Equipos que necesitan análisis completo de proyectos

**¿Qué ofrece?**
- Análisis comprehensivo del proyecto
- Sugerencias de módulos necesarios (auth, pagos, etc.)
- Recomendaciones de stack tecnológico
- Estimaciones de recursos y tiempos
- Gestión de múltiples features dentro del proyecto

**Flujo:**
1. Crear Workspace (proyecto)
2. Cargar documentación inicial (brief, specs, referencias)
3. Analizar con AI
4. Revisar recomendaciones y análisis
5. Crear Features/PRDs específicos dentro del workspace
6. Desarrollar cada feature

### Modo Producto (Features Standalone)

**¿Para quién?**
- Empresas de producto con proyectos ya en marcha
- Equipos que añaden nuevas funcionalidades
- PMs que gestionan roadmap de features

**¿Qué ofrece?**
- PRD detallado de la feature
- Análisis de gaps
- Preguntas interactivas para completar información
- Backlog generado automáticamente
- Insights y métricas del proyecto

**Flujo:**
1. Crear Feature/PRD
2. Cargar documentación de la feature
3. Procesar inputs
4. Analizar gaps
5. Responder preguntas (opcional)
6. Generar PRD
7. Generar backlog

## Cuándo Usar Cada Modo

### Usa Modo Software Factory cuando:

✅ Estás iniciando un proyecto completamente nuevo
✅ Necesitas análisis de arquitectura y stack tecnológico
✅ Quieres que AI sugiera módulos necesarios
✅ Requieres estimaciones de recursos
✅ Tienes múltiples documentos iniciales del cliente
✅ El proyecto tendrá múltiples features a desarrollar

### Usa Modo Producto cuando:

✅ Ya tienes un proyecto en marcha
✅ Quieres añadir una feature específica
✅ Necesitas un PRD detallado de una funcionalidad
✅ Quieres generar backlog para la feature
✅ Gestionas un roadmap de features

## Guía de Uso - Modo Software Factory

### Paso 1: Crear Workspace

1. Ve al Dashboard
2. Click en "Nuevo" → "Crear Proyecto desde 0"
3. Completa la información:
   - **Nombre**: Nombre descriptivo del proyecto
   - **Descripción**: Objetivos y alcance general
   - **Tipo**: Software Factory o Producto
4. Carga documentos iniciales:
   - Brief del cliente
   - Especificaciones técnicas
   - Referencias y documentación existente
   - Formatos: PDF, DOCX, MD, TXT

### Paso 2: Analizar Proyecto

1. Ve al workspace recién creado
2. Click en "Analizar Proyecto"
3. El sistema procesará todos los documentos con AI
4. Generará un análisis completo que incluye:
   - **Resumen Ejecutivo**: Visión general del proyecto
   - **Módulos Identificados**: Features extraídas de la documentación
   - **Módulos Sugeridos**: Funcionalidades recomendadas (auth, pagos, etc.)
   - **Stack Tecnológico**: Recomendaciones tecnológicas
   - **Arquitectura**: Visión de alto nivel
   - **Estimaciones**: Recursos y tiempos
   - **Riesgos**: Técnicos y de negocio

### Paso 3: Crear Features dentro del Workspace

1. Desde el workspace, click en "Nueva Feature"
2. Carga documentación específica de la feature
3. Sigue el flujo normal de generación de PRD

### Paso 4: Gestión Continua

- Todas las features del workspace están centralizadas
- Puedes ver el progreso general del proyecto
- Cada feature mantiene su propio PRD, backlog, e insights

## Guía de Uso - Modo Producto

### Flujo de Trabajo

El flujo es el existente, sin cambios:

1. **Crear Feature/PRD**
   - Dashboard → Nuevo → Añadir Feature/PRD
   - Nombre y archivos

2. **Procesar Inputs**
   - Genera contexto unificado
   - Detecta idioma

3. **Analizar Gaps**
   - Identifica información faltante

4. **Generar Preguntas** (opcional pero recomendado)
   - Preguntas interactivas para completar gaps

5. **Construir PRD**
   - PRD completo siguiendo template enterprise

6. **Generar Backlog**
   - Historias de usuario y tareas

7. **Revisar Insights**
   - Riesgos, timeline, decisiones

## Configuración

### Configurar Modos Disponibles

Puedes controlar qué modos están disponibles en tu instalación:

1. Ve a **Settings**
2. Sección **Configuración de Modos**
3. Activa/desactiva:
   - **Modo Software Factory**: Crear proyectos desde 0
   - **Modo Producto**: Añadir features standalone
4. Selecciona el **Modo por Defecto**
5. Click en "Guardar Configuración"

### Casos de Uso de Configuración

**Solo Modo Producto** (Empresa de producto)
```
✅ Modo Producto: Activado
❌ Modo Software Factory: Desactivado
```
El botón "Nuevo" creará directamente una Feature/PRD.

**Solo Modo Software Factory**
```
❌ Modo Producto: Desactivado
✅ Modo Software Factory: Activado
```
El botón "Nuevo" creará directamente un Workspace.

**Ambos Modos** (Uso flexible)
```
✅ Modo Producto: Activado
✅ Modo Software Factory: Activado
```
El botón "Nuevo" mostrará un selector para elegir qué crear.

## Casos de Uso

### Caso 1: Software Factory recibe nuevo cliente

**Situación**: Una factory recibe un brief de un cliente para desarrollar un sistema de inventario completo.

**Solución con Workspace:**
1. Crear Workspace "Sistema de Inventario - Cliente X"
2. Cargar: brief del cliente, especificaciones, referencias
3. Analizar proyecto con AI
4. Revisar módulos sugeridos (auth, reportes, notificaciones)
5. Crear features individuales:
   - Feature 1: "Gestión de Productos"
   - Feature 2: "Control de Stock"
   - Feature 3: "Reportes y Analytics"
   - etc.

**Beneficio**: Visión completa del proyecto, todas las features centralizadas, estimaciones globales.

### Caso 2: Empresa de producto añade funcionalidad

**Situación**: Una empresa con producto existente quiere añadir "Exportación de datos a Excel".

**Solución con Feature Standalone:**
1. Crear Feature "Exportación Excel"
2. Cargar especificaciones de la feature
3. Seguir flujo normal de PRD
4. Generar backlog

**Beneficio**: Rápido y enfocado, sin complejidad innecesaria.

### Caso 3: Uso híbrido

**Situación**: Software factory con múltiples proyectos cliente.

**Solución:**
- Crear un Workspace por cada cliente
- Dentro de cada workspace, crear features específicas
- También pueden tener features standalone para R&D interno

**Beneficio**: Organización clara por cliente, flexibilidad para proyectos internos.

## Preguntas Frecuentes

### ¿Puedo migrar features standalone a un workspace?

Actualmente no automáticamente, pero está en el roadmap. Por ahora, puedes crear un workspace y luego crear nuevas features dentro referenciando las existentes.

### ¿Qué diferencia hay en el análisis AI?

**Workspace**: Análisis macro del proyecto completo, recomendaciones estratégicas, estimaciones globales.

**Feature**: Análisis micro de funcionalidad específica, PRD detallado, backlog táctico.

### ¿Puedo desactivar un modo después de usarlo?

Sí, pero los workspaces/features existentes seguirán siendo accesibles. Solo afecta la creación de nuevos elementos.

### ¿Cómo se relacionan workspaces y versioning?

Cada feature dentro de un workspace tiene su propio versionado independiente. El workspace en sí no se versiona, solo organiza las features.

## Próximas Funcionalidades

Funcionalidades preparadas en la arquitectura para futuras versiones:

1. **Sugerencias de Stack Tecnológico** - Recomendaciones contextualizadas
2. **Estimaciones de Recursos** - Dado equipo → estimar tiempo, o dado deadline → estimar equipo
3. **Generación de Módulos Sugeridos** - Crear automáticamente PRDs para módulos recomendados
4. **Análisis de Viabilidad** - Evaluación técnica y económica del proyecto
5. **Migración de Features** - Mover features standalone a workspaces

## Soporte

Para más información o soporte:
- Consulta la documentación técnica en `WORKSPACE_ARCHITECTURE.md`
- Revisa los ejemplos en los tests
- Contacta al equipo de desarrollo
