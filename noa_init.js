// NOA INIT v5 - Contadores separados
console.log('🚀 noa_init.js v5');

window.limpiarTodosLosIndicadores = function() {
  ['count-sin-telefono','count-sin-email','count-saldo-incorrecto','count-sin-contacto','count-saldo-invalido','count-no-responde','count-no-responde-mora','count-contacto-erroneo'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '(0)';
  });
  var v = document.querySelector('.tag-semaforo.verde');
  var a = document.querySelector('.tag-semaforo.amarillo');
  var r = document.querySelector('.tag-semaforo.rojo');
  if (v) v.textContent = 'Verde: 0';
  if (a) a.textContent = 'Amarillo: 0';
  if (r) r.textContent = 'Rojo: 0';
};

window.actualizarTodosLosIndicadores = function() {
  if (!window.datosReales || window.datosReales.length === 0) {
    window.limpiarTodosLosIndicadores();
    return;
  }
  
  var datos = window.datosReales;
  var sinContacto = 0, sinEmail = 0, sinTelefono = 0, saldoInvalido = 0;
  
  for (var i = 0; i < datos.length; i++) {
    var c = datos[i];
    var tel = (c.telefono || '').toString().trim();
    var email = (c.correo || '').toString().trim();
    var monto = parseFloat(c.prima || 0);
    
    if (!tel && !email) sinContacto++;
    if (!email) sinEmail++;
    if (!tel) sinTelefono++;
    if (isNaN(monto) || monto <= 0) saldoInvalido++;
  }
  
  console.log('📊 Contadores:', {sinContacto:sinContacto, sinEmail:sinEmail, sinTelefono:sinTelefono, saldoInvalido:saldoInvalido});
  
  // Actualizar todos los contadores
  var ids = {
    'count-sin-contacto': sinContacto,
    'count-sin-telefono': sinTelefono,
    'count-sin-email': sinEmail,
    'count-contacto-erroneo': sinTelefono,
    'count-saldo-incorrecto': saldoInvalido,
    'count-saldo-invalido': saldoInvalido,
    'count-no-responde': 0,
    'count-no-responde-mora': 0
  };
  
  Object.keys(ids).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '(' + ids[id] + ')';
  });
  
  console.log('✅ Contadores actualizados');
};

console.log('✅ noa_init.js v5 listo');
