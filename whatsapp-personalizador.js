// Cargar templates desde archivo JSON
export async function cargarTemplate(nombreTemplate) {
  try {
    const response = await fetch('/config/wa-templates.json');
    if (!response.ok) throw new Error('No se pudo cargar los templates');
    const config = await response.json();
    return config.templates[nombreTemplate] || null;
  } catch (error) {
    console.error('Error cargando templates:', error);
    return null;
  }
}

// Personalizar mensaje con datos de Supabase/Cartera
export function personalizarMensaje(template, datosCliente) {
  if (!template) return null;
  
  let mensaje = template;
  
  // Mapeo de placeholders a campos de la base de datos
  const mapeo = {
    '{nombre}': datosCliente.nombre || datosCliente.asegurado || '',
    '{empresa}': datosCliente.empresa || 'Herman Solera Esquivel',
    '{poliza}': datosCliente.poliza || '',
    '{monto}': datosCliente.prima || datosCliente.monto || '',
    '{vencimiento}': formatearFecha(datosCliente.hasta || datosCliente.vencimiento),
    '{fecha_envio}': new Date().toLocaleDateString('es-CR'),
    '{link_pago}': `https://tuapp.com/pagar/${datosCliente.poliza}`
  };
  
  // Reemplazar cada placeholder
  Object.entries(mapeo).forEach(([placeholder, valor]) => {
    mensaje = mensaje.replace(new RegExp(placeholder, 'g'), valor);
  });
  
  return mensaje;
}

// Formatear fechas de YYYY-MM-DD a DD/MM/YYYY
function formatearFecha(fecha) {
  if (!fecha) return '';
  
  if (typeof fecha === 'string') {
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año}`;
  }
  
  if (fecha instanceof Date) {
    return fecha.toLocaleDateString('es-CR');
  }
  
  return fecha;
}

// Generar mensaje WhatsApp listo para enviar
export async function generarMensajeWhatsApp(datosCliente, nombreTemplate = 'primer_recordatorio') {
  const template = await cargarTemplate(nombreTemplate);
  
  if (!template) {
    console.error(`Template '${nombreTemplate}' no encontrado`);
    return null;
  }
  
  return personalizarMensaje(template, datosCliente);
}

// Enviar mensaje a WhatsApp
export async function enviarWhatsApp(datosCliente, nombreTemplate = 'primer_recordatorio') {
  const mensaje = await generarMensajeWhatsApp(datosCliente, nombreTemplate);
  
  if (!mensaje) {
    console.error('No se pudo generar el mensaje');
    return false;
  }
  
  // Usar el teléfono del cliente o formato de WhatsApp
  const numeroWhatsApp = datosCliente.telefono || datosCliente.whatsapp;
  
  if (!numeroWhatsApp) {
    console.error('Número de WhatsApp no disponible');
    return false;
  }
  
  // Crear URL de WhatsApp Web
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  
  // Abrir en nueva ventana
  window.open(urlWhatsApp, '_blank');
  
  return true;
}
