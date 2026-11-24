# Avatares

El avatar se guarda en el campo `avatar` del perfil (texto). No cambia el contrato con la API.

| Valor guardado | Qué es |
| --- | --- |
| `avatar1` a `avatar4` | Avatares disponibles: gato con moño, gato amarillo, pingüino sabio y yuca asada (imágenes en `public/avatares/`). |
| `avatar5`, `avatar6` | Perfiles antiguos: se siguen mostrando, ya no se ofrecen. |

Se elige al registrarse, al completar el perfil con Google y al editar el perfil.

## En la sala
El servidor de tiempo real (`backend-realtime`) incluye el `avatar` de cada participante en la presencia, así todos ven el avatar de los demás en los recuadros. Si el servidor aún no está actualizado, la sala muestra la inicial (y tu propio avatar siempre se ve).
