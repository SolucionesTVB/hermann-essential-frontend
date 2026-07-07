// Formulario para agregar cliente individual
window.abrirFormularioCliente = function() {
  const modal = document.createElement('div');
  modal.id = 'modal-nuevo-cliente';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;';
  
  modal.innerHTML = `
    <div style="background:#1F2937;border-radius:16px;width:90%;max-width:500px;max-height:90vh;overflow-y:auto;padding:30px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="color:#fff;margin:0;">➕ Nuevo Cliente</h2>
        <button onclick="document.getElementById('modal-nuevo-cliente').remove()" style="background:#EF4444;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">✕</button>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="color:#94A3B8;font-size:13px;">Nombre del Asegurado *</label>
          <input type="text" id="nc-asegurado" placeholder="Nombre completo" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Identificación / Cédula</label>
          <input type="text" id="nc-identificacion" placeholder="Ej: 123456789" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Teléfono / WhatsApp *</label>
          <input type="text" id="nc-telefono" placeholder="8 dígitos" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Correo Electrónico</label>
          <input type="email" id="nc-correo" placeholder="email@ejemplo.com" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Número de Póliza *</label>
          <input type="text" id="nc-poliza" placeholder="Ej: POL-12345" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="color:#94A3B8;font-size:13px;">Prima / Monto *</label>
            <input type="number" id="nc-prima" placeholder="0.00" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
          </div>
          <div>
            <label style="color:#94A3B8;font-size:13px;">Moneda</label>
            <select id="nc-moneda" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
              <option value="CRC">₡ Colones</option>
              <option value="USD">$ Dólares</option>
            </select>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="color:#94A3B8;font-size:13px;">Vigencia Desde</label>
            <input type="date" id="nc-desde" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
          </div>
          <div>
            <label style="color:#94A3B8;font-size:13px;">Vigencia Hasta *</label>
            <input type="date" id="nc-hasta" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
          </div>
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Periodicidad de Pago</label>
          <select id="nc-periodicidad" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
            <option value="Mensual">Mensual</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semestral">Semestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Aseguradora</label>
          <input type="text" id="nc-aseguradora" placeholder="Ej: INS, ASSA, etc." style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <div>
          <label style="color:#94A3B8;font-size:13px;">Placa / Folio (opcional)</label>
          <input type="text" id="nc-placa" placeholder="Ej: ABC-123" style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-top:4px;">
        </div>
        
        <button onclick="guardarNuevoCliente()" style="width:100%;padding:14px;background:#10B981;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:10px;font-size:16px;">
          💾 Guardar Cliente
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

window.guardarNuevoCliente = async function() {
  const asegurado = document.getElementById('nc-asegurado').value.trim();
  const telefono = document.getElementById('nc-telefono').value.trim();
  const poliza = document.getElementById('nc-poliza').value.trim();
  const prima = document.getElementById('nc-prima').value;
  const hasta = document.getElementById('nc-hasta').value;
  
  if (!asegurado) { alert('⚠️ El nombre es obligatorio'); return; }
  if (!telefono) { alert('⚠️ El teléfono es obligatorio'); return; }
  if (!poliza) { alert('⚠️ La póliza es obligatoria'); return; }
  if (!prima) { alert('⚠️ El monto es obligatorio'); return; }
  if (!hasta) { alert('⚠️ La fecha de vencimiento es obligatoria'); return; }
  
  try {
    const user = await getUserNOA();
    if (!user) { alert('⚠️ Debes iniciar sesión'); return; }
    
    const nuevoCliente = {
      user_id: user.id,
      asegurado: asegurado,
      identificacion: document.getElementById('nc-identificacion').value.trim(),
      telefono: telefono.replace(/[^0-9]/g, ''),
      correo: document.getElementById('nc-correo').value.trim(),
      poliza: poliza,
      prima: parseFloat(prima),
      moneda: document.getElementById('nc-moneda').value,
      desde: document.getElementById('nc-desde').value || null,
      hasta: hasta,
      periodicidad: document.getElementById('nc-periodicidad').value,
      aseguradora: document.getElementById('nc-aseguradora').value.trim(),
      placa: document.getElementById('nc-placa').value.trim(),
      pagado: false
    };
    
    const { data, error } = await window.supabaseClient
      .from('clientes')
      .insert([nuevoCliente])
      .select();
    
    if (error) throw error;
    
    alert('✅ Cliente guardado correctamente');
    document.getElementById('modal-nuevo-cliente').remove();
    
    // Recargar datos
    location.reload();
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error al guardar: ' + error.message);
  }
};

console.log('✅ noa_cliente_individual.js cargado');
