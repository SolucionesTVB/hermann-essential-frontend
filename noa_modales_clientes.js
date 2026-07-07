// Modal para agregar telefono/email a clientes
window.abrirModalListaClientes = function(tipo) {
  if (!window.datosReales || window.datosReales.length === 0) {
    alert('No hay datos cargados');
    return;
  }
  var clientesFiltrados = [];
  var titulo = '';
  var campo = '';
  if (tipo === 'corregir') {
    clientesFiltrados = window.datosReales.filter(function(c) { return !c.telefono || c.telefono === ''; });
    titulo = 'Agregar Telefono';
    campo = 'telefono';
  } else if (tipo === 'llamar') {
    clientesFiltrados = window.datosReales.filter(function(c) { return !c.correo || c.correo === ''; });
    titulo = 'Agregar Email';
    campo = 'correo';
  } else if (tipo === 'borrar') {
    window.abrirModalBorrarCliente();
    return;
  }
  if (clientesFiltrados.length === 0) {
    alert('No hay clientes pendientes');
    return;
  }
  var modal = document.createElement('div');
  modal.id = 'modal-lista-clientes';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;';
  var html = '<div style="background:#1F2937;border-radius:16px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;padding:30px;">';
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:20px;"><h2 style="color:#fff;margin:0;">' + titulo + '</h2>';
  html += '<button onclick="document.getElementById(\'modal-lista-clientes\').remove()" style="background:#EF4444;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">X</button></div>';
  html += '<div style="color:#94A3B8;margin-bottom:15px;">Mostrando ' + Math.min(50, clientesFiltrados.length) + ' de ' + clientesFiltrados.length + '</div>';
  clientesFiltrados.slice(0, 50).forEach(function(c, i) {
    html += '<div style="background:#111827;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">';
    html += '<div><div style="color:#fff;font-weight:600;">' + (c.asegurado || 'Sin nombre') + '</div>';
    html += '<div style="color:#94A3B8;font-size:12px;">Poliza: ' + (c.poliza || 'N/A') + '</div></div>';
    html += '<div style="display:flex;gap:8px;align-items:center;">';
    html += '<input type="text" id="input-' + i + '" data-id="' + c.id + '" data-campo="' + campo + '" placeholder="Ingrese valor" style="padding:8px;border:1px solid #334155;border-radius:6px;background:#1F2937;color:#fff;width:150px;">';
    html += '<button onclick="guardarCampoCliente(\'' + c.id + '\', \'' + campo + '\', document.getElementById(\'input-' + i + '\').value)" style="background:#10B981;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Guardar</button>';
    html += '</div></div>';
  });
  html += '</div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
};

window.guardarCampoCliente = async function(clienteId, campo, valor) {
  if (!valor || valor.trim() === '') { alert('Ingresa un valor'); return; }
  try {
    var cambios = {};
    cambios[campo] = valor.trim();
    var result = await window.supabaseClient.from('clientes').update(cambios).eq('id', clienteId);
    if (result.error) throw result.error;
    alert('Guardado correctamente');
    var cliente = window.datosReales.find(function(c) { return c.id === clienteId; });
    if (cliente) cliente[campo] = valor.trim();
  } catch (error) {
    alert('Error al guardar: ' + error.message);
  }
};

window.abrirModalBorrarCliente = function() {
  if (!window.datosReales || window.datosReales.length === 0) {
    alert('No hay datos cargados');
    return;
  }
  var modal = document.createElement('div');
  modal.id = 'modal-borrar-cliente';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;justify-content:center;align-items:center;';
  var html = '<div style="background:#1F2937;border-radius:16px;width:90%;max-width:640px;max-height:85vh;overflow-y:auto;padding:30px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html += '<h2 style="color:#fff;margin:0;">🗑️ Archivar Asegurado</h2>';
  html += '<button onclick="document.getElementById(\'modal-borrar-cliente\').remove()" style="background:#EF4444;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">X</button></div>';
  html += '<div style="color:#F59E0B;font-size:13px;margin-bottom:16px;background:#451a03;padding:10px;border-radius:8px;">⚠️ El asegurado pasa a la papelera. No se borra permanentemente.</div>';
  html += '<input type="text" id="buscador-borrar" oninput="window.filtrarListaBorrar()" placeholder="🔍 Buscar por nombre o póliza..." style="width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#111827;color:#fff;margin-bottom:16px;box-sizing:border-box;">';
  html += '<div id="lista-borrar">';
  window.datosReales.slice(0, 50).forEach(function(c) {
    html += window._renderFilaBorrar(c);
  });
  html += '</div>';
  html += '<div style="margin-top:20px;border-top:1px solid #334155;padding-top:16px;">';
  html += '<button onclick="window.abrirPapelera()" style="background:#64748B;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">📦 Ver Papelera</button>';
  html += '</div></div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
};

window._renderFilaBorrar = function(c) {
  return '<div id="fila-' + c.id + '" style="background:#111827;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
    '<div><div style="color:#fff;font-weight:600;">' + (c.asegurado || 'Sin nombre') + '</div>' +
    '<div style="color:#94A3B8;font-size:12px;">Póliza: ' + (c.poliza || 'N/A') + ' · ' + (c.aseguradora || '') + '</div></div>' +
    '<button onclick="window.confirmarBorrar(\'' + c.id + '\', \'' + (c.asegurado || 'Sin nombre').replace(/'/g, '') + '\')" style="background:#EF4444;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;">Archivar</button>' +
    '</div>';
};

window.filtrarListaBorrar = function() {
  var txt = (document.getElementById('buscador-borrar').value || '').toLowerCase();
  var lista = document.getElementById('lista-borrar');
  if (!lista) return;
  var filtrados = window.datosReales.filter(function(c) {
    return (c.asegurado || '').toLowerCase().includes(txt) || (c.poliza || '').toLowerCase().includes(txt);
  });
  lista.innerHTML = filtrados.slice(0, 50).map(window._renderFilaBorrar).join('');
};

window.confirmarBorrar = function(clienteId, nombre) {
  if (!confirm('¿Archivar a ' + nombre + '?\n\nPodrás recuperarlo desde la Papelera.')) return;
  window.borrarClienteSupabase(clienteId).then(function(res) {
    if (res.success) {
      var fila = document.getElementById('fila-' + clienteId);
      if (fila) fila.remove();
      if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
      if (typeof window.actualizarDashboard === 'function') window.actualizarDashboard();
    } else {
      alert('Error al archivar: ' + res.error);
    }
  });
};

window.abrirPapelera = async function() {
  var modal = document.createElement('div');
  modal.id = 'modal-papelera';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10001;display:flex;justify-content:center;align-items:center;';
  modal.innerHTML = '<div style="background:#1F2937;border-radius:16px;width:90%;max-width:640px;padding:30px;"><div style="color:#fff;text-align:center;">Cargando papelera...</div></div>';
  document.body.appendChild(modal);
  var res = await window.cargarClientesBorrados();
  var borrados = (res.success ? res.clientes : []);
  var html = '<div style="background:#1F2937;border-radius:16px;width:90%;max-width:640px;max-height:85vh;overflow-y:auto;padding:30px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
  html += '<h2 style="color:#fff;margin:0;">📦 Papelera (' + borrados.length + ')</h2>';
  html += '<button onclick="document.getElementById(\'modal-papelera\').remove()" style="background:#EF4444;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">X</button></div>';
  if (borrados.length === 0) {
    html += '<div style="color:#94A3B8;text-align:center;padding:40px;">La papelera está vacía</div>';
  } else {
    borrados.forEach(function(c) {
      html += '<div id="papelera-fila-' + c.id + '" style="background:#111827;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">';
      html += '<div><div style="color:#fff;font-weight:600;">' + (c.asegurado || 'Sin nombre') + '</div>';
      html += '<div style="color:#94A3B8;font-size:12px;">Póliza: ' + (c.poliza || 'N/A') + ' · ' + (c.aseguradora || '') + '</div></div>';
      html += '<button onclick="window.confirmarRestaurar(\'' + c.id + '\', \'' + (c.asegurado || 'Sin nombre').replace(/'/g, '') + '\')" style="background:#10B981;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;">Restaurar</button>';
      html += '</div>';
    });
  }
  html += '</div>';
  modal.innerHTML = html;
};

window.confirmarRestaurar = function(clienteId, nombre) {
  if (!confirm('¿Restaurar a ' + nombre + ' a la cartera activa?')) return;
  window.restaurarClienteSupabase(clienteId).then(async function(res) {
    if (res.success) {
      var fila = document.getElementById('papelera-fila-' + clienteId);
      if (fila) fila.remove();
      var resultado = await window.cargarClientesSupabase();
      if (resultado.success) {
        window.datosReales = resultado.clientes;
        if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
        if (typeof window.actualizarDashboard === 'function') window.actualizarDashboard();
      }
      alert('✅ ' + nombre + ' restaurado a la cartera.');
    } else {
      alert('Error al restaurar: ' + res.error);
    }
  });
};

console.log('noa_modales_clientes.js cargado');
