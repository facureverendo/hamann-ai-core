```markdown
# PRD: Base de Datos de Propiedades

## Resumen
Creación de una Base de Datos de Propiedades para centralizar y gestionar información relacionada con propiedades, mejorando la eficiencia en la búsqueda y consulta de datos.

## Objetivos
- Centralizar la información sobre propiedades para facilitar el acceso y la gestión.
- Mejorar la eficiencia en la búsqueda y consulta de datos.

## Alcance
### Incluir
- Información básica de propiedades: tamaño, ubicación, precio, cantidad de ambientes, cantidad de baños, forma de pago, aptitud para crédito hipotecario.
- Tipos de propiedades: terrenos, departamentos, comerciales, en venta o alquiler.
- Funcionalidades para administradores: bloquear propiedades, marcarlas como vendidas, bloquear acceso a ciertos usuarios, responder preguntas.
- Funcionalidades para usuarios finales: marcar propiedades como favoritas, generar alertas personalizadas, realizar preguntas al vendedor, dar puntaje a propiedades.
- Implementación de JWT para sesiones de usuarios.
- Réplica anti corrupción de la base de datos.
- Registro de métricas: usuarios registrados, usuarios activos por día, preguntas generadas por usuario, marcados como favoritos, ventas realizadas.

### Excluir
- Integración con sistemas externos.
- Funcionalidades avanzadas de análisis de datos.

## Usuarios / Roles
- **Administradores**: Gestionan y actualizan la base de datos.
- **Usuarios finales**: Consultan información sobre propiedades.
- **Compradores, arrendatarios y agentes inmobiliarios**: Público objetivo.

## Requerimientos funcionales
- CRUD de registros de propiedades.
- Filtrado y búsqueda de propiedades por ubicación, precio, cantidad de ambientes, cantidad de baños, forma de pago, aptitud para crédito hipotecario.
- Funcionalidades para administradores y usuarios finales mencionadas en el alcance.

## Requerimientos no funcionales
- Seguridad: Acceso solo para usuarios autorizados.
- Rendimiento: Tiempo de respuesta rápido en consultas.
- **Tecnología de base de datos**: MySQL.

## Riesgos / Suposiciones
### Riesgos
- Problemas de escalabilidad si la base de datos crece significativamente.

### Suposiciones
- Los usuarios tienen un nivel básico de habilidades tecnológicas para interactuar con la base de datos.

## Métricas de éxito
- Reducción del tiempo de búsqueda de propiedades en un 30%.
- Aumento de la satisfacción del usuario en un 20% en encuestas post-implementación.

## Hitos tentativos
- Revisión de requisitos: [Fecha]
- Diseño de la base de datos: [Fecha]
- Desarrollo inicial: [Fecha]
- Pruebas y validación: [Fecha]
- Lanzamiento: [Fecha]

## Contexto del workspace
- **Nombre del proyecto**: TODO
- **Descripción del proyecto**: TODO
- **Resumen ejecutivo**: TODO
- **Módulos identificados**: []
- **Módulos sugeridos**: []
- **Riesgos técnicos**: []
- **Proyectos en curso**: Ninguno por ahora
```
