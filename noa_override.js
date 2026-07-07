// NOA Override - Version Final
// Controla carga y borrado de datos con Supabase

(function() {
  console.log('NOA Override cargando...');
  
  // Variable global para controlar si los datos fueron borrados en esta sesión
  window.NOA_DATOS_BORRADOS = false;
  
  window.addEventListener('load', async function() {
    console.log('NOA Supabase iniciado');
    
    // Verificar si hay un flag de borrado pendiente
    if (sessionStorage.getItem('noa_datos_borrados') === 'true') {
      window.NOA_DATOS_BORRADOS = true;
      sessionStorage.removeItem('noa_datos_borrados');
      console.log('Flag de borrado detectado - no se recargarán datos');
    }
    
    // GUARDAR DATOS
    window.guardarDatos = async function() {
      try {
        if (!window.datosReales || window.datosReales.length === 0) {
          console.log('No hay datos para guardar');
          return { success: false };
        }
        
        if (typeof guardarClientesSupabase === 'function') {
          var result = await guardarClientesSupabase(window.datosReales);
          if (result && result.success) {
            console.log('Datos guardados en Supabase');
            var reload = await cargarClientesSupabase();
            if (reload && reload.success && reload.clientes.length > 0) {
              // Si hay filtro activo, actualizar backup y mantener filtro
              if (window._datosRealesBackup) {
                window._datosRealesBackup = reload.clientes;
              } else {
                window.datosReales = reload.clientes;
              }
              console.log('IDs sincronizados desde Supabase:', reload.clientes.length);
              if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
              if (typeof window.NOA_RENDER_CARTERA === 'function') window.NOA_RENDER_CARTERA({ cols: Object.keys(reload.clientes[0]), data: reload.clientes });
            }
            return { success: true };
          }
        }
        return { success: false };
      } catch (error) {
        console.error('Error guardando:', error);
        return { success: false, error: error.message };
      }
    };
    
    // CARGAR DATOS
    window.cargarDatos = async function() {
      try {
        // Si los datos fueron borrados, no recargar
        if (window.NOA_DATOS_BORRADOS) {
          console.log('Datos borrados - no se recargan');
          window.datosReales = [];
          return { success: true, clientes: [] };
        }
        
        if (typeof cargarClientesSupabase === 'function') {
          var result = await cargarClientesSupabase();
          if (result && result.success && result.clientes && result.clientes.length > 0) {
            // Eliminar duplicados por ID
            var seen = {};
            var uniqueClientes = [];
            for (var i = 0; i < result.clientes.length; i++) {
              var c = result.clientes[i];
              if (c.id && !seen[c.id]) {
                seen[c.id] = true;
                uniqueClientes.push(c);
              }
            }
            
            window.datosReales = normalizarLote(uniqueClientes);
            window.archivoCargado = true;
            
            console.log('Cargados ' + uniqueClientes.length + ' clientes únicos');
            
            // Actualizar UI
            if (typeof window.NOA_RENDER_CARTERA === 'function') {
              window.NOA_RENDER_CARTERA({
                cols: Object.keys(uniqueClientes[0] || {}),
                data: window.datosReales
              });
            }
            if (typeof window.actualizarEstadisticas === 'function') {
              window.actualizarEstadisticas();
              if (typeof window.actualizarComparativoCobros === "function") { window.actualizarComparativoCobros(); }
            }
            if (typeof window.actualizarSemaforo === 'function') {
              window.actualizarSemaforo();
            }
            if (typeof window.identificarClientesConProblemas === 'function') {
              window.identificarClientesConProblemas();
            }
            if (typeof window.actualizarTodosLosIndicadores === 'function') {
              window.actualizarTodosLosIndicadores();
            }
            
            return { success: true, clientes: uniqueClientes };
          }
        }
        
        console.log('No hay datos en Supabase');
        return { success: true, clientes: [] };
      } catch (error) {
        console.error('Error cargando:', error);
        return { success: false, error: error.message };
      }
    };
    
    // LIMPIAR TODO
    window.limpiarTodo = async function() {
      try {
        console.log('Iniciando borrado de datos...');
        
        // Marcar como borrado ANTES de hacer nada
        window.NOA_DATOS_BORRADOS = true;
        sessionStorage.setItem('noa_datos_borrados', 'true');
        
        // Limpiar variables locales
        window.datosReales = [];
        window.archivoCargado = false;
        
        // Limpiar localStorage
        localStorage.removeItem('sistemaV5_datos');
        localStorage.removeItem('sistemaV5_archivoCargado');
        localStorage.removeItem('sistemaV5_iaActiva');
        
        // Limpiar en Supabase
        if (typeof limpiarClientesSupabase === 'function') {
          var result = await limpiarClientesSupabase();
          console.log('Resultado borrado Supabase:', result);
        }
        
        // Actualizar UI
        if (typeof window.actualizarEstadisticas === 'function') {
          window.actualizarEstadisticas();
              if (typeof window.actualizarComparativoCobros === "function") { window.actualizarComparativoCobros(); }
        if (typeof window.actualizarSemaforo === 'function') {
          window.actualizarSemaforo();
        }
        if (typeof window.identificarClientesConProblemas === 'function') {
          window.identificarClientesConProblemas();
        }
        }
        if (typeof window.actualizarTodosLosIndicadores === 'function') {
          window.actualizarTodosLosIndicadores();
        }
        if (typeof window.NOA_RENDER_CARTERA === 'function') {
          window.NOA_RENDER_CARTERA({ cols: [], data: [] });
        }
        
        console.log('Datos borrados correctamente');
        alert('Datos borrados correctamente');
        
        return { success: true };
      } catch (error) {
        console.error('Error borrando:', error);
        alert('Error al borrar: ' + error.message);
        return { success: false, error: error.message };
      }
    };
    
    // AUTO-CARGAR después de 2 segundos
    setTimeout(async function() {
      try {
        if (typeof getUserNOA === 'function') {
          var user = await getUserNOA();
          if (user && !window.NOA_DATOS_BORRADOS) {
            console.log('Usuario autenticado, cargando datos...');
            await window.cargarDatos();
          } else if (window.NOA_DATOS_BORRADOS) {
            console.log('Datos fueron borrados - no se recargan automáticamente');
          }
        }
      } catch (e) {
        console.error('Error en auto-carga:', e);
      }
    }, 2000);
  });
  
  console.log('NOA Override configurado');
})();
