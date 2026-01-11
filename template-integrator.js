// ARCHIVO DE INTEGRACIÓN DE TEMPLATES DE WHATSAPP
// Este archivo reemplaza la función enviarWhatsAppIA del sitio principal
// para usar los templates configurables desde wa-templates.json

(async function() {
  // Cargar templates
  let templates = {};
  
  try {
    const response = await fetch('/config/wa-templates.json');
    const config = await response.json();
    templates = config.templates;
    console.log('✅ Templates de WhatsApp cargados:', templates);
  } catch (error) {
    console.error('❌ Error cargando templates:', error);
    return;
  }

  // Reemplazar función enviarWhatsAppIA
  window.enviarWhatsAppIA = async function(nombre, telefono, index, score) {
    if (!telefono) {
      mostrarNotificacion('❌ Cliente sin teléfono registrado', 'error');
      return;
    }

    const cliente = window.datosReales[index];
    const nombreCorrector = document.getElementById('nombreCorrector')?.value || 'Su Corredor';
    const agencia = document.getElementById('agenciaCorrector')?.value || 'Seguros XYZ';
    
    // Obtener datos del cliente
    const poliza = cliente['# Póliza'] || cliente.poliza || 'N/A';
    const monto = cliente['Prima Aseguradora'] || cliente.monto || '0';
    const fechaVencimiento = cliente['Vigencia hasta'] || cliente.hasta || 'N/A';
    const fechaEnvio = new Date().toLocaleDateString('es-CR');
    const urlPago = `https://tuapp.com/pagar/${poliza}`;

    // Usar template primer_recordatorio
    let mensaje = templates.primer_recordatorio || 'Template no encontrado';
    
    // Reemplazar placeholders
    mensaje = mensaje
      .replace(/{nombre}/g, nombre)
      .replace(/{empresa}/g, agencia)
      .replace(/{poliza}/g, poliza)
      .replace(/{monto}/g, monto)
      .replace(/{vencimiento}/g, fechaVencimiento)
      .replace(/{fecha_envio}/g, fechaEnvio)
      .replace(/{link_pago}/g, urlPago);

    try {
      mostrarNotificacion(`📱 Enviando WhatsApp a ${nombre}...`, 'info');
      
      const response = await fetch('/.netlify/functions/send-whatsapp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          to: telefono,
          message: mensaje
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        mostrarNotificacion(`✅ WhatsApp enviado a ${nombre}`, 'success');
      } else {
        mostrarNotificacion(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(`❌ Error de conexión: ${error.message}`, 'error');
    }
  };

  console.log('🔄 Función enviarWhatsAppIA reemplazada con templates');
  mostrarNotificacion('✅ Templates de WhatsApp activados', 'success');
})();
