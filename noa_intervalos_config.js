// Configuración de intervalos por periodicidad
window.INTERVALOS_DEFAULT = {
  mensual: { r1: 5, r2: 3, r3: 1 },
  trimestral: { r1: 15, r2: 7, r3: 3 },
  semestral: { r1: 30, r2: 15, r3: 7 },
  anual: { r1: 45, r2: 30, r3: 15 }
};

window.cargarIntervalosConfig = async function() {
  try {
    const user = await getUserNOA();
    if (!user) return;
    const { data } = await window.supabaseClient
      .from('configuracion_corredor')
      .select('intervalos')
      .eq('user_id', user.id)
      .single();
    if (data && data.intervalos) {
      window.INTERVALOS_CONFIG = JSON.parse(data.intervalos);
    } else {
      window.INTERVALOS_CONFIG = window.INTERVALOS_DEFAULT;
    }
    actualizarCamposIntervalos();
  } catch (e) {
    window.INTERVALOS_CONFIG = window.INTERVALOS_DEFAULT;
  }
};

window.guardarIntervalosConfig = async function() {
  try {
    const user = await getUserNOA();
    if (!user) { alert('Inicia sesion'); return; }
    window.INTERVALOS_CONFIG = {
      mensual: {
        r1: parseInt(document.getElementById('int-mensual-r1').value) || 
5,
        r2: parseInt(document.getElementById('int-mensual-r2').value) || 
3,
        r3: parseInt(document.getElementById('int-mensual-r3').value) || 1
      },
      trimestral: {
        r1: parseInt(document.getElementById('int-trimestral-r1').value) 
|| 15,
        r2: parseInt(document.getElementById('int-trimestral-r2').value) 
|| 7,
        r3: parseInt(document.getElementById('int-trimestral-r3').value) 
|| 3
      },
      semestral: {
        r1: parseInt(document.getElementById('int-semestral-r1').value) || 
30,
        r2: parseInt(document.getElementById('int-semestral-r2').value) || 
15,
        r3: parseInt(document.getElementById('int-semestral-r3').value) || 
7
      },
      anual: {
        r1: parseInt(document.getElementById('int-anual-r1').value) || 45,
        r2: parseInt(document.getElementById('int-anual-r2').value) || 30,
        r3: parseInt(document.getElementById('int-anual-r3').value) || 15
      }
    };
    await window.supabaseClient
      .from('configuracion_corredor')
      .upsert({ user_id: user.id, intervalos: 
JSON.stringify(window.INTERVALOS_CONFIG) }, { onConflict: 'user_id' });
    alert('Intervalos guardados');
  } catch (e) {
    alert('Error: ' + e.message);
  }
};

function actualizarCamposIntervalos() {
  var c = window.INTERVALOS_CONFIG || window.INTERVALOS_DEFAULT;
  if (document.getElementById('int-mensual-r1')) {
    document.getElementById('int-mensual-r1').value = c.mensual.r1;
    document.getElementById('int-mensual-r2').value = c.mensual.r2;
    document.getElementById('int-mensual-r3').value = c.mensual.r3;
    document.getElementById('int-trimestral-r1').value = c.trimestral.r1;
    document.getElementById('int-trimestral-r2').value = c.trimestral.r2;
    document.getElementById('int-trimestral-r3').value = c.trimestral.r3;
    document.getElementById('int-semestral-r1').value = c.semestral.r1;
    document.getElementById('int-semestral-r2').value = c.semestral.r2;
    document.getElementById('int-semestral-r3').value = c.semestral.r3;
    document.getElementById('int-anual-r1').value = c.anual.r1;
    document.getElementById('int-anual-r2').value = c.anual.r2;
    document.getElementById('int-anual-r3').value = c.anual.r3;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { window.cargarIntervalosConfig(); }, 3000);
});

console.log('noa_intervalos_config.js cargado');
