# BackToMe — objetos perdidos y encontrados UDB

Prototipo de la aplicación para ayudar a la comunidad universitaria a reportar, buscar y recuperar objetos.

## Ejecutar el prototipo

1. Copia la carpeta BackToMe dentro de htdocs de XAMPP.
2. Inicia Apache desde el panel de XAMPP.
3. Abre http://localhost/BackToMe/ y entra a Iniciar sesión o crea una cuenta.
4. Después de iniciar sesión, la aplicación abre dashboard.html.

También se puede abrir dashboard.html desde un servidor web local si ya existe una sesión en ese navegador.

El escudo transparente de la Universidad Don Bosco se muestra sin letras en las pantallas de acceso y navegación, usando imagenes.img/logo-udb.png. El selector de tema está disponible en el inicio de sesión, registro y aplicación principal.

## Funciones disponibles en esta versión

- Inicio con publicaciones de objetos perdidos y encontrados.
- Búsqueda por nombre, descripción, categoría y ubicación, además de filtro por estado.
- Publicación con foto, descripción, categoría, lugar y fecha.
- Perfil con el nombre, correo y publicaciones del usuario que inició sesión.
- Solicitudes recibidas y enviadas, con opción de aceptar o rechazar las recibidas.
- Conversaciones locales asociadas a una publicación para coordinar la entrega.
- Navegación adaptable a móvil, tablet y computadora.
- Modo claro y oscuro con preferencia guardada en el navegador.

## Backend, registro e inicio de sesión

El servidor Express se inicia desde la carpeta del proyecto con node server.js. La conexión de MySQL y las credenciales SMTP se configuran en .env; usa .env.example como referencia y no subas .env a GitHub.

Antes de usar el registro, ejecuta una sola vez database/auth-migration.sql desde phpMyAdmin con permisos de administrador. La migración agrega apellido, carnet y carrera a usuarios, crea el índice único del carnet y corrige los permisos del usuario backtome.

El registro crea una cuenta pendiente, guarda la contraseña como hash y envía un enlace de verificación de un solo uso que vence en 24 horas. El inicio de sesión rechaza cuentas que no han verificado el correo. Para enviar mensajes con Gmail, configura SMTP_USER, SMTP_APP_PASSWORD y APP_BASE_URL en .env. Usa una contraseña de aplicación de Google, no la contraseña normal de Gmail.

Para desarrollo local, deja el servidor Node.js activo en el puerto 3000 mientras registras la cuenta y abres el enlace de verificación. El enlace local no servirá a otras personas o dispositivos hasta que el backend esté publicado en una dirección accesible.

## Publicaciones, solicitudes y chat en MySQL

Después de la migración de autenticación, ejecuta una sola vez `database/contenido-migration.sql` en phpMyAdmin, con la base `backtome` seleccionada. Crea sesiones de servidor y amplía el campo de foto de objetos para almacenar las imágenes comprimidas. Reinicia Node.js después de aplicar la migración.

El inicio de sesión entrega una sesión temporal de siete días; el servidor guarda solo su hash. La API verifica esa sesión y los permisos del propietario para publicar, archivar objetos, responder solicitudes y enviar mensajes. Publicaciones, solicitudes, conversaciones, participantes y mensajes se leen y guardan en las tablas existentes. El chat consulta mensajes nuevos cada cinco segundos mientras está abierto. La foto comprimida queda en la tabla de objetos.

Abre la aplicación principal en `dashboard.html`. Para usarla en otra computadora, el servidor Node.js y MariaDB deben estar en una dirección que esa computadora pueda alcanzar; `localhost` solo apunta al equipo donde se abre el navegador.

## Estado técnico

Registro, verificación de correo, inicio de sesión, publicaciones, solicitudes y chat utilizan la API Node.js y MySQL/MariaDB. La interfaz mantiene localmente solo la sesión temporal y la conversación seleccionada. XAMPP puede servir las páginas HTML y Node.js atiende la API en el puerto 3000.

El flujo principal se abre en dashboard.html, que conserva el nombre de la página principal del proyecto anterior.

## Integrantes

- Andrea Michelle Jiménez Aguilar — JA262091
- Kimberly Alexandra Rivera López — RL261989
