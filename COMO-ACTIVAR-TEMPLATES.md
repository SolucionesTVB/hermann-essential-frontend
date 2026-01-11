# CÓMO ACTIVAR LOS TEMPLATES DE WHATSAPP

## PROBLEMA RESUELTO
El sitio https://hermann-essential.netlify.app tiene código hardcodeado con mensajes genéricos.
Este repo tiene los templates configurables listos.

## SOLUCIÓN INMEDIATA

Agregar 2 líneas AL FINAL del `<body>` del index.html del sitio principal:

```html
<!-- ANTES DE </body> -->
<script src="https://raw.githubusercontent.com/SolucionesTVB/hermann-essential-frontend/main/template-integrator.js"></script>
```

## QUÉ HACE ESTE ARCHIVO

1. Carga el template desde `/public/config/wa-templates.json`
2. REEMPLAZA la función `enviarWhatsAppIA` del sitio
3. Usa el template configurado en lugar de mensajes hardcodeados

## TEMPLATE ACTUAL

El template está en: `public/config/wa-templates.json`

```json
{
  "templates": {
    "primer_recordatorio": "Hola *{nombre}*,\n\n*{empresa}* le recuerda:\n\nPóliza: *{poliza}*\nMonto: *{monto}*\nVencimiento: *{vencimiento}* (enviado el {fecha_envio})\n\nRealice el pago aquí: {link_pago}\n\nMantenga su cobertura activa. Si ya pagó, ignore.\n\n¡Gracias!"
  }
}
```

## VARIABLES DISPONIBLES

- `{nombre}` - Nombre del asegurado
- `{empresa}` - Nombre de la aseguradora/agencia
- `{poliza}` - Número de póliza
- `{monto}` - Monto a pagar
- `{vencimiento}` - Fecha de vencimiento
- `{fecha_envio}` - Fecha de envío del mensaje
- `{link_pago}` - URL para realizar el pago

## CAMBIAR EL TEMPLATE

1. Editar `public/config/wa-templates.json`
2. Guardar cambios
3. Hacer commit y push
4. Netlify redeploy automáticamente
5. El nuevo template se usa AL INSTANTE

## VERIFICAR QUE FUNCIONÓ

1. Abrir https://hermann-essential.netlify.app
2. Abrir consola del navegador (F12)
3. Buscar: `✅ Templates de WhatsApp cargados`
4. Buscar: `🔄 Función enviarWhatsAppIA reemplazada con templates`

Si ves esos mensajes = FUNCIONA.

## AGREGAR MÁS TEMPLATES

En `wa-templates.json`:

```json
{
  "templates": {
    "primer_recordatorio": "...",
    "segundo_recordatorio": "Estimado {nombre}, segundo recordatorio...",
    "tercer_recordatorio": "URGENTE {nombre}..."
  }
}
```

Luego en el código, cambiar qué template usar:
```javascript
let mensaje = templates.segundo_recordatorio; // en lugar de primer_recordatorio
```

## SOPORTE

Si no funciona:
1. Verificar que `/public/config/wa-templates.json` existe
2. Verificar que `template-integrator.js` se cargó
3. Ver errores en consola del navegador
4. Verificar que Netlify redeployó correctamente

---

**Fecha:** 11 de enero de 2026  
**Estado:** LISTO PARA DESPLEGAR
