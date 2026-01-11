// Cartera Display - Renderiza tabla de cartera desde window.datosReales
(function() {
  if (window.CARTERA_DISPLAY_LOADED) return;
  window.CARTERA_DISPLAY_LOADED = true;

  console.log('📋 Cartera Display: Inicializando...');

  // Función para renderizar la cartera
  function renderCartera() {
    if (!window.datosReales || window.datosReales.length === 0) {
      console.log('⚠️ No hay datos en window.datosReales');
      return false;
    }

    console.log('📊 Renderizando cartera con', window.datosReales.length, 'clientes');

    // Buscar o crear contenedor
    let container = document.querySelector('#cartera-content');
    if (!container) {
      // Buscar el tab de cartera
      const carteraTab = document.querySelector('#cartera');
      if (carteraTab) {
        container = document.createElement('div');
        container.id = 'cartera-content';
        carteraTab.appendChild(container);
      } else {
        console.error('❌ No se encontró tab #cartera');
        return false;
      }
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear tabla
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;';
    
    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#1f2937;color:#e5e7eb;">
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Asegurado</th>
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Póliza</th>
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Teléfono</th>
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Email</th>
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Prima</th>
        <th style="padding:12px;text-align:left;border-bottom:1px solid #374151;">Vencimiento</th>
        <th style="padding:12px;text-align:center;border-bottom:1px solid #374151;">Acciones</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    window.datosReales.forEach(function(cliente, index) {
      const nombre = cliente.nombre || cliente.Nombre || cliente.Asegurado || cliente.asegurado || 'Sin nombre';
      const poliza = cliente.poliza || cliente.pol_original || cliente['# Póliza'] || 'N/A';
      const telefono = cliente.telefono || cliente.Teléfono || '-';
      const email = cliente.correo || cliente['Correo electrónico'] || cliente.email || '-';
      const prima = cliente.prima || cliente['Prima Aseguradora'] || cliente.monto || '0';
      const vencimiento = cliente['Vigencia hasta'] || cliente.hasta || '-';

      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom:1px solid #374151;';
      row.innerHTML = `
        <td style="padding:10px;">${nombre}</td>
        <td style="padding:10px;">${poliza}</td>
        <td style="padding:10px;">${telefono}</td>
        <td style="padding:10px;">${email}</td>
        <td style="padding:10px;">₡${prima}</td>
        <td style="padding:10px;">${vencimiento}</td>
        <td style="padding:10px;text-align:center;">
          <button onclick="window.enviarWhatsAppIA(${index})" style="background:#10b981;color:white;padding:6px 12px;border:none;border-radius:6px;cursor:pointer;margin-right:4px;">
            📱 WhatsApp
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Agregar tabla al contenedor
    container.appendChild(table);

    console.log('✅ Cartera renderizada exitosamente');
    return true;
  }

  // Esperar a que los datos estén disponibles
  function waitForData() {
    let attempts = 0;
    const maxAttempts = 50;
    
    const interval = setInterval(function() {
      attempts++;
      
      if (window.datosReales && window.datosReales.length > 0) {
        clearInterval(interval);
        console.log('✅ Datos encontrados, renderizando cartera');
        setTimeout(renderCartera, 500);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('❌ Timeout esperando datos');
      }
    }, 200);
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForData);
  } else {
    waitForData();
  }

  // También intentar renderizar cuando se haga clic en el tab de Cartera
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && target.textContent && target.textContent.includes('Cartera')) {
      setTimeout(function() {
        if (window.datosReales && window.datosReales.length > 0) {
          renderCartera();
        }
      }, 300);
    }
  });

  console.log('📋 Cartera Display: Configurado');
})();
