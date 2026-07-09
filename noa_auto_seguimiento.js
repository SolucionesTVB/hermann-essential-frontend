// 🤖 NOA AUTO SEGUIMIENTO - Sistema de Envío Automático
// IMPORTANTE: Solo se activa cuando el usuario lo enciende manualmente

(function() {
    'use strict';
    
    console.log('🤖 Sistema de Auto Seguimiento cargado (INACTIVO por defecto)');
    
    const CONFIG = {
        checkIntervalMinutes: 3,
        enabled: false,  // SIEMPRE inicia desactivado
        corredor: localStorage.getItem('sistemaV5_nombreCorrector') || '',
        agencia: localStorage.getItem('sistemaV5_nombreAgencia') || ''
    };
    
    let isRunning = false;
    let intervalId = null;
    let lastCheckTime = null;
    let stats = {
        totalChecks: 0,
        enviosAutomaticos: 0,
        errores: 0
    };
    
    // ========================================
    // OBTENER CONFIGURACIÓN IA
    // ========================================
    
    function getConfigIA() {
        try {
            const saved = localStorage.getItem('sistemaV5_configIA');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return { agresividad: 5, intervaloMinimo: 3, maxIntentos: 3 };
    }
    
    // ========================================
    // INTERVALOS POR PERIODICIDAD
    // ========================================
    
    window.INTERVALOS_DEFAULT = {
        mensual: { r1: 5, r2: 3, r3: 1 },
        trimestral: { r1: 15, r2: 7, r3: 3 },
        semestral: { r1: 30, r2: 15, r3: 7 },
        anual: { r1: 45, r2: 30, r3: 15 }
    };
    
    function getIntervalos() {
        try {
            const saved = localStorage.getItem('sistemaV5_intervalos');
            if (saved) {
                window.INTERVALOS_CONFIG = JSON.parse(saved);
                return window.INTERVALOS_CONFIG;
            }
        } catch(e) {}
        window.INTERVALOS_CONFIG = window.INTERVALOS_DEFAULT;
        return window.INTERVALOS_DEFAULT;
    }
    
    // ========================================
    // CALCULAR SI DEBE ENVIAR RECORDATORIO
    // ========================================
    
    function calcularDiasRestantes(fechaVencimiento) {
        if (!fechaVencimiento) return null;
        
        let fecha;
        if (fechaVencimiento.includes('/')) {
            const [d, m, y] = fechaVencimiento.split('/');
            fecha = new Date(y, m - 1, d);
        } else {
            fecha = new Date(fechaVencimiento);
        }
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fecha.setHours(0, 0, 0, 0);
        
        const diffTime = fecha - hoy;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    function obtenerPeriodicidad(cliente) {
        const p = (cliente.periodicidad || 'mensual').toLowerCase().trim();
        if (p.includes('trim')) return 'trimestral';
        if (p.includes('sem')) return 'semestral';
        if (p.includes('anu')) return 'anual';
        return 'mensual';
    }
    
    function contarEnviosPrevios(cliente) {
        try {
            const historial = JSON.parse(localStorage.getItem('sistemaV5_historialEnvios') || '[]');
            const enviosCliente = historial.filter(e => 
                e.cliente_id === cliente.id && 
                e.tipo === 'auto_seguimiento'
            );
            return enviosCliente.length;
        } catch(e) {
            return 0;
        }
    }
    
    async function debeEnviarRecordatorio(cliente) {
        const configIA = getConfigIA();
        const intervalos = getIntervalos();
        
        // Si ya está pagado, no enviar
        if (cliente.pagado === true) return null;
        
        // Verificar fecha de vencimiento
        const fechaVenc = cliente.hasta || cliente.vencimiento || cliente.fechaVencimiento;
        if (!fechaVenc) return null;
        
        const diasRestantes = calcularDiasRestantes(fechaVenc);
        if (diasRestantes === null || diasRestantes < 0) return null;
        
        // Obtener periodicidad e intervalos
        const periodicidad = obtenerPeriodicidad(cliente);
        const intervalosPeriodo = intervalos[periodicidad] || intervalos.mensual;
        
        // Contar envíos previos
        const enviosPrevios = contarEnviosPrevios(cliente);
        
        // Si ya se enviaron el máximo de intentos, no enviar más
        if (enviosPrevios >= configIA.maxIntentos) return null;
        
        // Determinar qué recordatorio toca
        const siguienteRecordatorio = enviosPrevios + 1;
        let diasParaEnviar;
        
        switch(siguienteRecordatorio) {
            case 1: diasParaEnviar = intervalosPeriodo.r1; break;
            case 2: diasParaEnviar = intervalosPeriodo.r2; break;
            case 3: diasParaEnviar = intervalosPeriodo.r3; break;
            default: return null;
        }
        
        console.log(`📊 ${cliente.asegurado}: ${diasRestantes} días restantes, periodicidad ${periodicidad}, recordatorio #${siguienteRecordatorio} debe enviarse a ${diasParaEnviar} días`);
        
        // Verificar si es el momento de enviar
        if (diasRestantes <= diasParaEnviar) {
            return {
                debeEnviar: true,
                diasRestantes,
                tipoEnvio: siguienteRecordatorio,
                periodicidad,
                canal: 'whatsapp'
            };
        }
        
        return null;
    }
    
    // ========================================
    // ENVIAR RECORDATORIO
    // ========================================
    
    async function enviarRecordatorioAutomatico(cliente, info) {
        try {
            // Verificar si WhatsApp está conectado antes de enviar
            if (info.canal === 'whatsapp' && window.wasenderConectado === false) {
                console.log('⚠️ WhatsApp desconectado, no se puede enviar a:', cliente.asegurado);
                return false;
            }
            
            console.log('📤 Enviando recordatorio automático a:', cliente.asegurado);
            
            if (info.canal === 'whatsapp') {
                if (window.enviarWAIndividual) {
                    // Normalizar moneda
                    const monedaNorm = String(cliente.moneda || 'CRC').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const esUSD = monedaNorm.includes('usd') || monedaNorm.includes('dolar');
                    const simbolo = esUSD ? '$' : '₡';
                    
                    const result = await window.enviarWAIndividual(
                        cliente.telefono,
`Estimado/a ${cliente.asegurado},

Le recordamos que su póliza *${cliente.poliza || 'N/A'}* vence en *${info.diasRestantes} días* (${cliente.hasta || ''}).

💰 Prima: ${simbolo}${cliente.prima || '0'}
🏢 Aseguradora: ${cliente.aseguradora || ''}

Por favor contáctenos para coordinar el pago y mantener su cobertura activa.

_Recordatorio #${info.tipoEnvio} - NOA Cobros_`,
                        cliente.asegurado,
                        cliente.id,
                        'automatico'
                    );
                    
                    if (result && result.success) {
                        console.log('✅ WhatsApp enviado automáticamente:', cliente.asegurado);
                        registrarEnvio(cliente, info, 'whatsapp');
                        stats.enviosAutomaticos++;
                        return true;
                    }
                }
            } else if (info.canal === 'email') {
                if (window.enviarEmailIndividual) {
                    const result = await window.enviarEmailIndividual(cliente);
                    
                    if (result && result.success) {
                        console.log('✅ Email enviado automáticamente:', cliente.asegurado);
                        registrarEnvio(cliente, info, 'email');
                        stats.enviosAutomaticos++;
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error enviando recordatorio automático:', error);
            stats.errores++;
            return false;
        }
    }
    
    function registrarEnvio(cliente, info, canal) {
        try {
            const historial = JSON.parse(localStorage.getItem('sistemaV5_historialEnvios') || '[]');
            historial.push({
                cliente_id: cliente.id,
                asegurado: cliente.asegurado,
                tipo: 'auto_seguimiento',
                canal: canal,
                recordatorio: info.tipoEnvio,
                fecha: new Date().toISOString(),
                diasRestantes: info.diasRestantes
            });
            localStorage.setItem('sistemaV5_historialEnvios', JSON.stringify(historial));
        } catch(e) {
            console.error('Error registrando envío:', e);
        }
    }
    
    // ========================================
    // VERIFICAR CLIENTES
    // ========================================
    
    async function verificarClientesParaRecordatorio() {
        // VERIFICAR QUE ESTÉ ACTIVO - Si no está activo, no hacer nada
        if (!window.autoSeguimientoActivo) {
            console.log('⏸️ Auto-seguimiento inactivo, saltando verificación');
            return;
        }
        
        if (isRunning) {
            console.log('⏸️ Verificación ya en curso, saltando...');
            return;
        }
        
        isRunning = true;
        lastCheckTime = new Date();
        stats.totalChecks++;
        
        const configIA = getConfigIA();
        
        console.log('🔍 Verificando clientes para recordatorios automáticos...');
        console.log('📊 Check #', stats.totalChecks, '- Hora:', lastCheckTime.toLocaleTimeString());
        
        try {
            const clientes = window.datosReales || [];
            
            if (clientes.length === 0) {
                console.log('⚠️ No hay clientes cargados');
                isRunning = false;
                return;
            }
            
            console.log('👥 Revisando', clientes.length, 'clientes...');
            
            let candidatos = 0;
            
            for (const cliente of clientes) {
                // Verificar de nuevo que sigue activo (el usuario pudo desactivarlo)
                if (!window.autoSeguimientoActivo) {
                    console.log('⏹️ Auto-seguimiento desactivado durante verificación, deteniendo...');
                    break;
                }
                
                const info = await debeEnviarRecordatorio(cliente);
                
                if (info) {
                    candidatos++;
                    console.log('🎯 Candidato para envío:', cliente.asegurado, '- Recordatorio #' + info.tipoEnvio);
                    await enviarRecordatorioAutomatico(cliente, info);
                    await new Promise(r => setTimeout(r, 30000));
                }
            }
            
            console.log('✅ Verificación completada -', candidatos, 'recordatorios enviados');
            
        } catch (error) {
            console.error('❌ Error en verificación:', error);
            stats.errores++;
        } finally {
            isRunning = false;
        }
    }
    
    // ========================================
    // FUNCIONES PÚBLICAS PARA ACTIVAR/DESACTIVAR
    // ========================================
    
    window.autoSeguimientoActivo = false;  // SIEMPRE inicia en false
    
    window.activarAutoSeguimiento = function() {
        if (window.autoSeguimientoActivo) {
            console.log('⚠️ Auto-seguimiento ya está activo');
            return;
        }
        
        window.autoSeguimientoActivo = true;
        localStorage.setItem('auto_seguimiento_activo', 'true');
        actualizarIndicadorHeader(true);
        
        console.log('✅ Auto-Seguimiento ACTIVADO manualmente');
        console.log('⏱️ Verificación cada', CONFIG.checkIntervalMinutes, 'minutos');
        
        // Iniciar verificaciones
        verificarClientesParaRecordatorio();
        intervalId = setInterval(() => {
            verificarClientesParaRecordatorio();
        }, CONFIG.checkIntervalMinutes * 60 * 1000);
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('🤖 Auto-Seguimiento ACTIVADO', 'success');
        }
    };
    
    window.desactivarAutoSeguimiento = function() {
        window.autoSeguimientoActivo = false;
        localStorage.setItem('auto_seguimiento_activo', 'false');
        actualizarIndicadorHeader(false);
        
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        console.log('⏹️ Auto-Seguimiento DESACTIVADO');
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('⏹️ Auto-Seguimiento DESACTIVADO', 'warning');
        }
    };
    
    window.getEstadoAutoSeguimiento = function() {
        return {
            activo: window.autoSeguimientoActivo,
            stats: stats,
            lastCheck: lastCheckTime
        };
    };
    

    // ========================================
    // FUNCIONES UI PARA PANEL DE CONTROL
    // ========================================
    
    window.activarAutoSeguimientoUI = function() {
        window.activarAutoSeguimiento();
        const estado = document.getElementById('estadoAutoSeguimiento');
        if (estado) {
            estado.innerHTML = '🟢 ACTIVO';
            estado.style.color = '#27ae60';
        }
    };
    
    window.desactivarAutoSeguimientoUI = function() {
        window.desactivarAutoSeguimiento();
        const estado = document.getElementById('estadoAutoSeguimiento');
        if (estado) {
            estado.innerHTML = '⚪ INACTIVO';
            estado.style.color = '#e74c3c';
        }
    };

    // ========================================
    // NO INICIAR AUTOMÁTICAMENTE
    // ========================================
    
    console.log('🤖 Sistema de Auto Seguimiento LISTO (esperando activación manual)');
    setTimeout(function() {
        const estaActivo = localStorage.getItem('auto_seguimiento_activo') === 'true';
        actualizarIndicadorHeader(estaActivo);
    }, 2000);
    console.log('   Para activar: window.activarAutoSeguimiento()');
    console.log('   Para desactivar: window.desactivarAutoSeguimiento()');
    
})();

function actualizarIndicadorHeader(activo) {
    // Remover badge viejo del header si existe
    const old = document.getElementById('auto-seg-header-badge');
    if (old) old.remove();

    // Punto en tab Configuracion
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function(tab) {
        if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes('configuracion')) {
            let punto = tab.querySelector('.auto-seg-dot');
            if (!activo) {
                if (!punto) {
                    punto = document.createElement('span');
                    punto.className = 'auto-seg-dot';
                    punto.style.cssText = 'display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;margin-left:6px;animation:pulse-dot 1.5s infinite;vertical-align:middle;';
                    tab.appendChild(punto);
                }
                tab.title = 'Auto-Seguimiento INACTIVO — Click para activar';
            } else {
                if (punto) punto.remove();
                tab.title = 'Auto-Seguimiento ACTIVO';
            }
        }
    });

    // Agregar animacion si no existe
    if (!document.getElementById('auto-seg-dot-style')) {
        const style = document.createElement('style');
        style.id = 'auto-seg-dot-style';
        style.textContent = '@keyframes pulse-dot{0%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(1.3);}100%{opacity:1;transform:scale(1);}}';
        document.head.appendChild(style);
    }
}
