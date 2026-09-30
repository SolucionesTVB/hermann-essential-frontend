// Módulo de Actualización desde Excel - NOA V5

window.actualizarDesdeExcel = async function(file) {
  if (!file) {
    alert('Por favor selecciona un archivo Excel');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (jsonData.length === 0) {
        alert('El archivo está vacío');
        return;
      }
      
      console.log('📊 Procesando ' + jsonData.length + ' filas del Excel...');
      
      let actualizados = 0;
      let errores = 0;
      
      for (const row of jsonData) {
        try {
          const poliza = row['Número de Póliza'] || row['Póliza'] || row.poliza || row.Poliza;
          
          if (!poliza) {
            console.warn('⚠️ Fila sin póliza, saltando:', row);
            errores++;
            continue;
          }
          
          const clienteExistente = window.datosReales.find(c => c.poliza === poliza);
          
          if (!clienteExistente) {
            console.warn('⚠️ Póliza no encontrada:', poliza);
            errores++;
            continue;
          }
          
          const cambios = {};
          
          if (row['Correo Cliente'] || row['Email'] || row.correo || row.email) {
            cambios.correo = row['Correo Cliente'] || row['Email'] || row.correo || row.email;
          }
          
          if (row['Celular'] || row.celular || row.Celular) {
            cambios.telefono = row['Celular'] || row.celular || row.Celular;
          }
          
          if (row['Prima'] || row.prima || row.Prima) {
            cambios.prima = parseFloat(row['Prima'] || row.prima || row.Prima);
          }
          
          if (row['Desde'] || row.desde) {
            cambios.desde = row['Desde'] || row.desde;
          }
          
          if (row['Fecha Hasta'] || row['Hasta'] || row.hasta) {

          if (row['Moneda'] || row.moneda) {
            cambios.moneda = row['Moneda'] || row.moneda;
          }

          if (row['Período Pago'] || row['Periodicidad'] || row.periodicidad) {
            cambios.periodicidad = row['Período Pago'] || row['Periodicidad'] || row.periodicidad;
          }

          if (row['Aseguradora'] || row.aseguradora) {
            cambios.aseguradora = row['Aseguradora'] || row.aseguradora;
          }

          if (row['Placa/Folio'] || row['Placa'] || row.placa) {
            cambios.placa = row['Placa/Folio'] || row['Placa'] || row.placa;
          }

          if (row['Nombre del Tomador'] || row['Asegurado'] || row.asegurado) {
            cambios.asegurado = row['Nombre del Tomador'] || row['Asegurado'] || row.asegurado;
          }
            cambios.hasta = row['Fecha Hasta'] || row['Hasta'] || row.hasta;
          }
          
          if (Object.keys(cambios).length === 0) {
            console.warn('⚠️ Sin cambios para póliza:', poliza);
            continue;
          }
          
          const { error } = await window.supabaseClient
            .from('clientes')
            .update(cambios)
            .eq('id', clienteExistente.id);
          
          if (error) {
            console.error('❌ Error actualizando póliza ' + poliza + ':', error);
            errores++;
          } else {
            actualizados++;
            Object.assign(clienteExistente, cambios);
          }
          
        } catch (err) {
          console.error('❌ Error procesando fila:', err);
          errores++;
        }
      }
      
      await window.cargarDatos();
      
      alert('✅ Actualización completada\n\n' + 
            'Actualizados: ' + actualizados + '\n' +
            'Errores: ' + errores + '\n' +
            'Total procesado: ' + jsonData.length);
      
      console.log('✅ Actualización completada:', { actualizados, errores, total: jsonData.length });
      
    } catch (error) {
      console.error('❌ Error procesando Excel:', error);
      alert('Error procesando el archivo: ' + error.message);
    }
  };
  
  reader.readAsArrayBuffer(file);
};

window.mostrarDialogoActualizarExcel = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      if (confirm('¿Actualizar clientes desde el archivo:\n' + file.name + '?')) {
        window.actualizarDesdeExcel(file);
      }
    }
  };
  input.click();
};

console.log('✅ noa_update_excel.js cargado');
