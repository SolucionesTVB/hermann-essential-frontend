// Guardar configuración del corredor en Supabase
window.guardarConfigCorredorSupabase = async function() {
  try {
    const user = await getUserNOA();
    if (!user) {
      alert('⚠️ Debes iniciar sesión');
      return false;
    }
    
    const config = {
      user_id: user.id,
      nombre: document.getElementById('nombreCorrector').value.trim(),
      whatsapp: document.getElementById('whatsappCorrector').value.trim(),
      email: document.getElementById('emailCorrector').value.trim(),
      agencia: document.getElementById('agenciaCorrector').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await window.supabaseClient
      .from('configuracion_corredor')
      .upsert(config, { onConflict: 'user_id' })
      .select();
    
    if (error) throw error;
    
    console.log('✅ Configuración guardada en Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error guardando config:', error);
    return false;
  }
};

// Cargar configuración del corredor desde Supabase
window.cargarConfigCorredorSupabase = async function() {
  try {
    const user = await getUserNOA();
    if (!user) return null;
    
    const { data, error } = await window.supabaseClient
      .from('configuracion_corredor')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      if (data.nombre) document.getElementById('nombreCorrector').value = data.nombre;
      if (data.whatsapp) document.getElementById('whatsappCorrector').value = data.whatsapp;
      if (data.email) document.getElementById('emailCorrector').value = data.email;
      if (data.agencia) document.getElementById('agenciaCorrector').value = data.agencia;
      console.log('✅ Configuración cargada desde Supabase');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error cargando config:', error);
    return null;
  }
};

console.log('✅ noa_config_corredor.js cargado');

// Cargar configuración automáticamente al iniciar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(async function() {
    if (window.cargarConfigCorredorSupabase) {
      await window.cargarConfigCorredorSupabase();
    }
  }, 2000);
});

// Cargar configuración automáticamente al iniciar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(async function() {
    if (window.cargarConfigCorredorSupabase) {
      await window.cargarConfigCorredorSupabase();
    }
  }, 2000);
});
