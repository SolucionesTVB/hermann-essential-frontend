window.exportarSemaforoExcel = function(color) {
  const datos = window.datosReales || [];
  if (datos.length === 0) { alert('No hay datos para exportar'); return; }
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const filtrados = datos.filter(cliente => {
    if (!cliente.hasta) return false;
    let fechaHasta;
    if (cliente.hasta.includes('-')) { fechaHasta = new Date(cliente.hasta); }
    else if (cliente.hasta.includes('/')) { const [dia, mes, año] = cliente.hasta.split('/'); fechaHasta = new Date(año, mes - 1, dia); }
    if (!fechaHasta || isNaN(fechaHasta)) return false;
    const diffDays = Math.floor((fechaHasta - hoy) / (1000 * 60 * 60 * 24));
    if (color === 'verde') return diffDays > 10;
    if (color === 'amarillo') return diffDays >= 0 && diffDays <= 10;
    if (color === 'rojo') return diffDays < 0;
    return false;
  });
  if (filtrados.length === 0) { alert('No hay clientes en estado ' + color.toUpperCase()); return; }
  
  const headers = ['Asegurado', 'Cédula', 'Póliza', 'Prima', 'Moneda', 'Periodicidad', 'Desde', 'Hasta', 'Celular', 'Email', 'Aseguradora', 'Placa', 'Estado Póliza', 'Objeto Asegurado'];
  
  const wsData = [headers];
  filtrados.forEach(c => {
    wsData.push([
      c.asegurado || '',
      c.identificacion || '',
      c.poliza || '',
      c.prima || '',
      c.moneda || '',
      c.periodicidad || '',
      c.desde || '',
      c.hasta || '',
      c.telefono || '',
      c.correo || '',
      c.aseguradora || '',
      c.placa || '',
      c.estado || '',
      c.objeto_asegurado || ''
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, color.toUpperCase());
  
  const fecha = new Date().toISOString().split('T')[0];
  const filename = 'NOA_' + color.toUpperCase() + '_' + fecha + '.xlsx';
  
  XLSX.writeFile(wb, filename);
  
  console.log('📥 Exportados ' + filtrados.length + ' clientes en estado ' + color + ' a formato XLSX');
};
console.log('✅ noa_export_excel.js cargado');

window.exportarProblemaExcel = function(tipo) {
  const datos = window.datosReales || [];
  if (datos.length === 0) { alert('No hay datos para exportar'); return; }
  
  let filtrados = [];
  let nombreArchivo = '';
  
  if (tipo === 'sin_contacto' || tipo === 'contacto_erroneo') {
    filtrados = datos.filter(c => !c.correo && !c.telefono);
    nombreArchivo = 'Sin_Contacto';
  } else if (tipo === 'saldo_invalido' || tipo === 'saldo_incorrecto') {
    filtrados = datos.filter(c => !c.prima || c.prima <= 0 || isNaN(c.prima));
    nombreArchivo = 'Saldo_Invalido';
  } else if (tipo === 'no_responde') {
    filtrados = datos.filter(c => c.no_responde || c.intentos_fallidos > 2);
    nombreArchivo = 'No_Responde';
  }
  
  if (filtrados.length === 0) {
    alert('No hay clientes con este problema');
    return;
  }
  
  const headers = ['Asegurado', 'Cédula', 'Póliza', 'Prima', 'Moneda', 'Periodicidad', 'Desde', 'Hasta', 'Celular', 'Email', 'Aseguradora', 'Problema'];
  
  const wsData = [headers];
  filtrados.forEach(c => {
    let problema = '';
    if (!c.correo && !c.telefono) problema = 'Sin contacto';
    else if (!c.prima || c.prima <= 0) problema = 'Saldo inválido';
    else if (c.no_responde) problema = 'No responde';
    
    wsData.push([
      c.asegurado || '',
      c.identificacion || '',
      c.poliza || '',
      c.prima || '',
      c.moneda || '',
      c.periodicidad || '',
      c.desde || '',
      c.hasta || '',
      c.telefono || '',
      c.correo || '',
      c.aseguradora || '',
      problema
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombreArchivo);
  
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, 'NOA_' + nombreArchivo + '_' + fecha + '.xlsx');
  
  console.log('📥 Exportados ' + filtrados.length + ' clientes con problema: ' + nombreArchivo);
};

// Función para exportar cartera completa a Excel
window.exportarExcelGeneral = function() {
    if (!window.datosReales || window.datosReales.length === 0) {
        alert('❌ No hay datos para exportar. Carga la cartera primero.');
        return;
    }
    
    const datos = window.datosReales.map(c => ({
        'Asegurado': c.asegurado || '',
        'Póliza': c.poliza || '',
        'Teléfono': c.telefono || '',
        'Correo': c.correo || '',
        'Prima': c.prima || 0,
        'Moneda': c.moneda || 'CRC',
        'Periodicidad': c.periodicidad || '',
        'Desde': c.desde || '',
        'Hasta': c.hasta || '',
        'Aseguradora': c.aseguradora || '',
        'Estado': c._pagado ? 'Pagado' : 'Pendiente'
    }));
    
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cartera');
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `cartera_${fecha}.xlsx`);
    
    console.log('✅ Cartera exportada');
};

console.log('✅ exportarExcelGeneral cargado');
