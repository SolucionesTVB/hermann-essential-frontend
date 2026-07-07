window.actualizarSemaforo = function(verdeParam, amarilloParam, rojoParam) {
  let verde, amarillo, rojo;
  
  if (typeof verdeParam === 'number') {
    verde = verdeParam;
    amarillo = amarilloParam || 0;
    rojo = rojoParam || 0;
  } else {
    const datos = window._datosRealesBackup || window.datosReales || [];
    if (datos.length === 0) {
      verde = 0; amarillo = 0; rojo = 0;
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      verde = 0; amarillo = 0; rojo = 0;
      datos.forEach(cliente => {
        if (!cliente.hasta) return;
        let fechaHasta;
        if (cliente.hasta.includes('-')) {
          fechaHasta = new Date(cliente.hasta);
        } else if (cliente.hasta.includes('/')) {
          const [dia, mes, anno] = cliente.hasta.split('/');
          fechaHasta = new Date(anno, mes - 1, dia);
        }
        if (!fechaHasta || isNaN(fechaHasta)) return;
        const diffDays = Math.floor((fechaHasta - hoy) / (1000 * 60 * 60 * 24));
        if (diffDays > 10) verde++;
        else if (diffDays >= 0) amarillo++;
        else rojo++;
      });
    }
  }
  
  const verdeEl = document.querySelector('.tag-semaforo.verde');
  const amarilloEl = document.querySelector('.tag-semaforo.amarillo');
  const rojoEl = document.querySelector('.tag-semaforo.rojo');
  if (verdeEl) verdeEl.textContent = 'Verde: ' + verde;
  if (amarilloEl) amarilloEl.textContent = 'Amarillo: ' + amarillo;
  if (rojoEl) rojoEl.textContent = 'Rojo: ' + rojo;
  console.log('Semaforo actualizado:', {verde, amarillo, rojo});
};

document.addEventListener('DOMContentLoaded', function() {
  actualizarSemaforo(0, 0, 0);
});

console.log('noa_semaforo.js cargado');

window.filtrarCarteraSemaforo = function(color) {
    cambiarTab('cartera');
    setTimeout(function() {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const datosOriginales = window._datosRealesBackup || window.datosReales || [];
        window._datosRealesBackup = datosOriginales;

        const filtrados = datosOriginales.filter(function(c) {
            if (!c.hasta) return false;
            let fecha;
            if (c.hasta.includes('/')) {
                const parts = c.hasta.split('/');
                fecha = new Date(parts[2], parts[1]-1, parts[0]);
            } else {
                fecha = new Date(c.hasta);
            }
            if (!fecha || isNaN(fecha)) return false;
            const dias = Math.floor((fecha - hoy) / 86400000);
            if (color === 'verde') return dias > 10;
            if (color === 'amarillo') return dias >= 0 && dias <= 10;
            if (color === 'rojo') return dias < 0 && c.estado !== 'pagado' && !c._pagado;
            return false;
        });

        window.datosReales = filtrados;
        if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
        else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();

        const label = color === 'verde' ? 'Al dia' : color === 'amarillo' ? 'Por vencer' : 'Vencidos';
        const colores = {verde:'#10b981', amarillo:'#f59e0b', rojo:'#ef4444'};
        // Limpiar banner si existe
        const old = document.getElementById('semaforo-banner');
        if (old) old.remove();
    }, 300);
};

window.filtrarCarteraVencimiento = function(periodo) {
    cambiarTab('cartera');
    setTimeout(function() {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const datosOriginales = window._datosRealesBackup || window.datosReales || [];
        window._datosRealesBackup = datosOriginales;

        const filtrados = datosOriginales.filter(function(c) {
            if (!c.hasta) return false;
            let fecha;
            if (c.hasta.includes('/')) {
                const parts = c.hasta.split('/');
                fecha = new Date(parts[2], parts[1]-1, parts[0]);
            } else {
                fecha = new Date(c.hasta);
            }
            if (!fecha || isNaN(fecha)) return false;
            const dias = Math.floor((fecha - hoy) / 86400000);
            if (periodo === 'hoy') return dias === 0;
            if (periodo === 'semana') return dias >= 0 && dias <= 7;
            return false;
        });

        window.datosReales = filtrados;
        if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
        else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();

        const label = periodo === 'hoy' ? 'Vencen HOY' : 'Vencen esta semana';
        const color = periodo === 'hoy' ? '#ef4444' : '#f59e0b';
        const old = document.getElementById('semaforo-banner'); if (old) old.remove();
    }, 300);
};
