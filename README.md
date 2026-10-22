# BackToMe — objetos perdidos y encontrados UDB

BackToMe es un prototipo para que la comunidad de la Universidad Don Bosco pueda reportar, buscar y recuperar objetos perdidos o encontrados.

## Contexto del avance

Tomé como base el avance visual que Andrea había preparado en la etapa anterior: la identidad de BackToMe, las pantallas de acceso, la navegación, la adaptación a móvil, tablet y computadora, el logo institucional y los temas claro y oscuro. En esta parte me enfoqué en conectar esa interfaz con el backend y en hacer funcionales las principales interacciones de la aplicación.

## Lo que implementé

- **Conexión con el backend:** implementé un servidor con Node.js y Express, conectado a MySQL/MariaDB mediante `mysql2`. Desde el cliente conecté las pantallas con la API para gestionar cuentas, perfiles, publicaciones, solicitudes y mensajes.
- **Registro e inicio de sesión:** integré el registro con nombre, apellido, carnet, carrera, correo y contraseña. Al crear una cuenta, el sistema envía un enlace de verificación por Gmail mediante Nodemailer. El enlace se puede usar una vez y vence en 24 horas; para iniciar sesión, la cuenta debe estar verificada.
- **Seguridad de las cuentas:** incorporé el hash de contraseñas con `scrypt` y sesiones temporales. El servidor almacena el hash del token de sesión y valida los permisos antes de permitir operaciones sobre el perfil o las publicaciones.
- **Reportes de objetos:** conecté el formulario para publicar objetos perdidos o encontrados con nombre, descripción, categoría, foto, fecha aproximada y una ubicación que la persona puede escribir libremente. La foto se comprime en el cliente y se guarda con el reporte.
- **Perfil y publicaciones propias:** añadí una ventana para cambiar el nombre del perfil y administrar las publicaciones propias. Desde allí se puede editar el nombre de una publicación o eliminarla.
- **Solicitudes y chat:** integré el envío de solicitudes sobre publicaciones, la vista de solicitudes enviadas y recibidas, y las acciones para aceptar o rechazar las recibidas. También conecté el chat para que las personas puedan coordinar la entrega. El backend limita los mensajes a 500 caracteres y comprueba que quien escribe participe en esa conversación.
- **Búsqueda:** conecté los filtros por texto, categoría, ubicación y estado del objeto.

## Organización técnica

- `server.js`: servidor Express, conexión a MySQL/MariaDB, autenticación, verificación de correo, sesiones y endpoints de la API.
- `js/`: lógica del cliente para autenticación, navegación, búsqueda, publicaciones, solicitudes, chat, perfil y tema visual.
- `css/`: estilos de las pantallas de acceso y de la aplicación.
- `database/`: migraciones para los datos adicionales del registro, las sesiones y el almacenamiento de fotos.
- `dashboard.html`, `login.html`, `registro.html` y las demás páginas HTML: estructura de las pantallas.
- `imagenes.img/`: recursos gráficos, incluido el logo de la Universidad Don Bosco.

## Persistencia de datos

Integré la aplicación con la base `backtome` y las tablas del proyecto para usuarios, objetos, verificaciones, solicitudes, conversaciones, participantes y mensajes. Añadí las migraciones `database/auth-migration.sql` y `database/contenido-migration.sql`: la primera incorpora apellido, carnet y carrera al registro y configura permisos; la segunda agrega sesiones y amplía `objetos.foto_url` para guardar imágenes comprimidas. Estas migraciones parten del esquema inicial que creó el equipo; no lo reemplazan.

## Alcance actual

Las páginas HTML y CSS se sirven por separado del backend Express. En la configuración local, el cliente usa `localhost:3000`, por lo que esta versión está preparada para funcionar en el mismo equipo. Para acceder desde otros dispositivos habría que configurar una dirección de API que ellos puedan alcanzar.
