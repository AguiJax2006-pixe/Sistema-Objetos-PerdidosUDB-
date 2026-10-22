# BackToMe — objetos perdidos y encontrados UDB

Prototipo de la aplicación para ayudar a la comunidad universitaria a reportar, buscar y recuperar objetos.

## Ejecutar el prototipo

1. Copia la carpeta `BackToMe` dentro de `htdocs` de XAMPP.
2. Inicia Apache desde el panel de XAMPP.
3. Abre `http://localhost/BackToMe/` y entra a **Iniciar sesión** o crea una cuenta.
4. Después de iniciar sesión, la aplicación abre `dashboard.html`.

También se puede abrir `dashboard.html` desde un servidor web local si ya existe una sesión en ese navegador.

El escudo transparente de la Universidad Don Bosco se muestra sin letras en las pantallas de acceso y navegación, usando el archivo `imagenes.img/logo-udb.png`. El selector de tema está disponible en el inicio de sesión, registro y aplicación principal.

## Funciones disponibles en esta versión

- Inicio con publicaciones de objetos perdidos y encontrados.
- Búsqueda por nombre, descripción, categoría y ubicación, además de filtro por estado.
- Publicación con foto, descripción, categoría, lugar y fecha.
- Perfil con el nombre, correo y publicaciones del usuario que inició sesión.
- Solicitudes recibidas y enviadas, con opción de aceptar o rechazar las recibidas.
- Conversaciones locales asociadas a una publicación para coordinar la entrega.
- Navegación adaptable a móvil, tablet y computadora.
- Modo claro y oscuro con preferencia guardada en el navegador.

## Base de datos preparada

El esquema inicial está en `database/schema.sql`. Incluye perfiles, confirmación de correo, categorías, objetos, rutas de imágenes, solicitudes, conversaciones, participantes, mensajes y recuperación de contraseña. Ejecuta el archivo desde MySQL Workbench conectado al servidor MySQL 8.0.

Las fotos se almacenan como archivos; MySQL guarda su ruta y metadatos. La contraseña debe guardarse como hash desde el backend, y los tokens de correo solo como hash. El esquema todavía no conecta el prototipo ni envía correos.
## Estado técnico

Esta versión mantiene el inicio de sesión y los datos del avance anterior en `localStorage`. Las publicaciones, solicitudes, fotos comprimidas y mensajes se guardan en el navegador que está usando la aplicación. Sirve como prototipo funcional de interfaz, pero los datos no se comparten entre dispositivos ni usuarios que usan navegadores distintos.

MySQL, una API/backend, verificación real de correo, un proveedor de mapas y React todavía no están conectados en este paquete. La navegación nueva se implementó con los archivos HTML, CSS y JavaScript que ya traía el avance para que pueda ejecutarse con XAMPP sin instalar herramientas adicionales.

El flujo principal se abre en `dashboard.html`, que conserva el nombre de la página principal del proyecto anterior.

## Integrantes

- Andrea Michelle Jiménez Aguilar — JA262091
- Kimberly Alexandra Rivera López — RL261989







