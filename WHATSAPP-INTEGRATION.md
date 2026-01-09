# 💱 Integración de WhatsApp - Guía de Implementación

## 🌟 Estado Actual

Tu sistema ya tiene los archivos listos para enviar mensajes de WhatsApp personalizados:

- ✅ **public/config/wa-templates.json** - Plantilla de mensaje configurada
- ✅ **whatsapp-personalizador.js** - Funciones JavaScript para personalizar mensajes

## 🚀 Pasos para Implementar

### Paso 1: Mover el archivo de utilidades

Mueve el archivo `whatsapp-personalizador.js` a la carpeta `src/utils/`:

```bash
mv whatsapp-personalizador.js src/utils/whatsapp-personalizador.js
```

### Paso 2: Importar en tu componente Cartera

En el archivo donde tienes el botón 📱 de WhatsApp (probablemente `src/components/Cartera.jsx` o similar):

```javascript
import { enviarWhatsApp } from '../utils/whatsapp-personalizador.js';
```

### Paso 3: Agregar al evento del botón

Busca donde está el botón de WhatsApp 📱 en la tabla de Cartera y agrega:

```javascript
// Cuando hagas clic en el botón 📱
async function handleWhatsAppClick(cliente) {
  const resultado = await enviarWhatsApp(cliente, 'primer_recordatorio');
  
  if (resultado) {
    console.log('Mensaje enviado a WhatsApp');
    // Opcional: mostrar notificación de éxito
  } else {
    console.error('Error al enviar mensaje');
    // Mostrar error al usuario
  }
}
```

### Paso 4: Asegurar que el cliente tiene número de teléfono

Cada cliente en tu Supabase/Cartera debe tener uno de estos campos:
- `telefono` - Número en formato internacional (ej: 50683575608)
- `whatsapp` - Número en formato internacional

## 📝 Campos de Supabase que se utilizan

El sistema mapea automáticamente estos campos de tu BD:

| Campo de BD | Placeholder en Mensaje |
|-------------|------------------------|
| `nombre` o `asegurado` | `{nombre}` |
| `poliza` | `{poliza}` |
| `prima` o `monto` | `{monto}` |
| `hasta` o `vencimiento` | `{vencimiento}` |
| `empresa` | `{empresa}` |
| `telefono` o `whatsapp` | Para enviar el mensaje |

## 📄 Estructura del Mensaje

El primer template (`primer_recordatorio`) genera un mensaje así:

```
Hola *Juan Pérez*,

*Herman Solera Esquivel* le recuerda:

Póliza: *POL-ABC123*
Monto: *$1500*
Vencimiento: *15/10/2026* (enviado el 09/01/2026)

Realice el pago aquí: https://tuapp.com/pagar/POL-ABC123

Mantenga su cobertura activa. Si ya pagó, ignore.

¡Gracias!
```

## 🗄 Cómo Editar el Template

Para cambiar el mensaje, edita `public/config/wa-templates.json`:

```json
{
  "templates": {
    "primer_recordatorio": "Tu nuevo mensaje aquí con placeholders como {nombre}, {poliza}, etc."
  }
}
```

## 📖 Ejemplo de Integración Completa

En tu componente Cartera, busca donde está el botón de WhatsApp:

```jsx
import { enviarWhatsApp } from '../utils/whatsapp-personalizador.js';

function Cartera() {
  // ... otro código ...

  const handleWhatsAppButton = async (cliente) => {
    try {
      const exito = await enviarWhatsApp(cliente);
      if (exito) {
        // Mostrar notificación o actualizar UI
        console.log('WhatsApp abierto correctamente');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // En tu tabla o lista de clientes
    <button onClick={() => handleWhatsAppButton(cliente)}>
      📱 WhatsApp
    </button>
  );
}
```

## ⚠️ Requisitos

1. El cliente debe tener WhatsApp instalado o acceso a WhatsApp Web
2. El cliente debe tener un número de teléfono válido en la BD
3. El navegador debe permitir abrir ventanas emergentes (pop-ups)

## 🚧 Troubleshooting

### El mensaje no se envía
- Verifica que el cliente tenga un número de teléfono
- Asegúrate de que el formato sea internacional (50683575608)
- Verifica que `public/config/wa-templates.json` exista

### El mensaje se ve cortado en WhatsApp
- WhatsApp tiene límite de caracteres
- Acorta el template si es necesario

### No se abre la ventana de WhatsApp
- Verifica que el navegador no tiene bloqueado pop-ups
- Intenta desde un navegador diferente

## 📈 Siguientes Pasos

1. Prueba el envio con un cliente real
2. Agrega más templates en `wa-templates.json` para otros casos:
   - `segundo_recordatorio` - Recordatorio a los 3 días
   - `tercer_recordatorio` - Recordatorio urgente
   - `confirmacion_pago` - Confirmación de pago recibido
   - `pago_atrasado` - Pago atrasado

3. Considera automatizar el envío de mensajes según la fecha

## 📁 Archivos en este Repositorio

- **public/config/wa-templates.json** - Plantillas de mensajes
- **whatsapp-personalizador.js** - Lógica de personalización (mover a `src/utils/`)
- **WHATSAPP-INTEGRATION.md** - Este archivo

---

**Creado:** 09/01/2026
**Versión:** 1.0
**Estado:** Listo para pruebas
