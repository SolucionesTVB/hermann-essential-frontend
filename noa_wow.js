// ============================================
// NOA WOW - Features de Impacto
// ============================================

(function() {
    'use strict';
    
    console.log('🚀 NOA WOW cargando...');

    // ============================================
    // 1. COMPARATIVA VS MES ANTERIOR
    // ============================================
    
    window.calcularComparativaMensual = async function() {
        if (!window.supabaseClient) return null;
        
        try {
            const { data: pagos } = await window.supabaseClient
                .from('historial_pagos')
                .select('monto_pagado, moneda, fecha_pago');
            
            if (!pagos) return null;
            
            const hoy = new Date();
            const mesActual = hoy.getMonth();
            const añoActual = hoy.getFullYear();
            const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
            const añoMesAnterior = mesActual === 0 ? añoActual - 1 : añoActual;
            
            let cobradoMesActual = 0;
            let cobradoMesAnterior = 0;
            
            pagos.forEach(p => {
                if (!p.fecha_pago) return;
                
                let fecha;
                if (p.fecha_pago.includes('/')) {
                    const [d, m, y] = p.fecha_pago.split('/');
                    fecha = new Date(y, m - 1, d);
                } else {
                    fecha = new Date(p.fecha_pago);
                }
                
                const monto = Number(p.monto_pagado) || 0;
                
                if (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual) {
                    cobradoMesActual += monto;
                } else if (fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoMesAnterior) {
                    cobradoMesAnterior += monto;
                }
            });
            
            const diferencia = cobradoMesAnterior > 0 
                ? Math.round(((cobradoMesActual - cobradoMesAnterior) / cobradoMesAnterior) * 100)
                : 100;
            
            const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            return {
                actual: cobradoMesActual,
                anterior: cobradoMesAnterior,
                diferencia,
                mesAnteriorNombre: nombresMeses[mesAnterior],
                positivo: diferencia >= 0
            };
            
        } catch (error) {
            console.error('Error calculando comparativa:', error);
            return null;
        }
    };

    // ============================================
    // 2. PREDICCIÓN DE FLUJO SEMANAL
    // ============================================
    
    window.calcularPrediccionSemanal = function() {
        if (!window.datosReales) return null;
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const finSemana = new Date(hoy);
        finSemana.setDate(finSemana.getDate() + 7);
        
        let prediccionUSD = 0;
        let prediccionCRC = 0;
        let polizasVencen = 0;
        
        window.datosReales.forEach(c => {
            if (!c.hasta || c._pagado) return;
            
            let fechaHasta;
            if (c.hasta.includes('/')) {
                const [d, m, y] = c.hasta.split('/');
                fechaHasta = new Date(y, m - 1, d);
            } else {
                fechaHasta = new Date(c.hasta);
            }
            
            if (fechaHasta >= hoy && fechaHasta <= finSemana) {
                polizasVencen++;
                const moneda = (c.moneda || 'CRC').toUpperCase();
                const prima = Number(c.prima) || 0;
                
                if (moneda === 'USD') {
                    prediccionUSD += prima;
                } else {
                    prediccionCRC += prima;
                }
            }
        });
        
        return { prediccionUSD, prediccionCRC, polizasVencen };
    };

    // ============================================
    // 3. GAMIFICACIÓN - BADGES Y LOGROS
    // ============================================
    
    window.calcularLogros = async function() {
        const logros = [];
        
        // Datos necesarios
        const comparativa = await window.calcularComparativaMensual();
        const prediccion = window.calcularPrediccionSemanal();
        
        // Badge: Meta del mes
        if (comparativa && comparativa.actual > 0) {
            const metaCRC = 30000000;
            const avance = (comparativa.actual / metaCRC) * 100;
            
            if (avance >= 100) {
                logros.push({ icono: '🏆', titulo: '¡META ALCANZADA!', desc: 'Superaste la meta mensual', color: '#fbbf24' });
            } else if (avance >= 75) {
                logros.push({ icono: '🔥', titulo: '¡En racha!', desc: '75% de la meta cumplida', color: '#f97316' });
            } else if (avance >= 50) {
                logros.push({ icono: '💪', titulo: 'Buen ritmo', desc: 'Mitad de meta alcanzada', color: '#3b82f6' });
            }
        }
        
        // Badge: Mejor que mes anterior
        if (comparativa && comparativa.diferencia > 0) {
            logros.push({ icono: '📈', titulo: '¡Superando!', desc: `+${comparativa.diferencia}% vs ${comparativa.mesAnteriorNombre}`, color: '#10b981' });
        }
        
        // Badge: Semana activa
        if (prediccion && prediccion.polizasVencen >= 5) {
            logros.push({ icono: '⚡', titulo: 'Semana activa', desc: `${prediccion.polizasVencen} pólizas por cobrar`, color: '#8b5cf6' });
        }
        
        // Badge: Cartera grande
        if (window.datosReales && window.datosReales.length >= 100) {
            logros.push({ icono: '👑', titulo: 'Cartera Premium', desc: `${window.datosReales.length}+ clientes`, color: '#ec4899' });
        }
        
        return logros;
    };

    // ============================================
    // 4. ASISTENTE IA CONVERSACIONAL
    // ============================================
    
    window.responderAsistenteIA = async function(pregunta) {
        const preguntaLower = pregunta.toLowerCase();
        
        // Obtener datos
        const comparativa = await window.calcularComparativaMensual();
        const prediccion = window.calcularPrediccionSemanal();
        const totalClientes = window.datosReales?.length || 0;
        
        // Respuestas inteligentes basadas en datos reales
        if (preguntaLower.includes('cómo voy') || preguntaLower.includes('como voy') || preguntaLower.includes('este mes')) {
            if (comparativa) {
                const signo = comparativa.positivo ? '+' : '';
                return `📊 Este mes has cobrado ₡${formatNum(comparativa.actual)}. 
                
${comparativa.positivo ? '🎉' : '📉'} Eso es ${signo}${comparativa.diferencia}% comparado con ${comparativa.mesAnteriorNombre} (₡${formatNum(comparativa.anterior)}).

${comparativa.positivo ? '¡Vas muy bien! Sigue así.' : 'Hay oportunidad de mejorar. ¡Tú puedes!'}`;
            }
            return '📊 Cargando datos... Asegúrate de tener la cartera cargada.';
        }
        
        if (preguntaLower.includes('semana') || preguntaLower.includes('cobrar')) {
            if (prediccion) {
                return `🔮 Esta semana tienes ${prediccion.polizasVencen} pólizas por vencer.

💰 Potencial de cobro:
- USD: $${formatNum(prediccion.prediccionUSD)}
- CRC: ₡${formatNum(prediccion.prediccionCRC)}

${prediccion.polizasVencen > 5 ? '¡Semana cargada! Prioriza los montos más altos.' : 'Semana tranquila, aprovecha para seguimiento.'}`;
            }
            return '🔮 Carga tu cartera para ver predicciones.';
        }
        
        if (preguntaLower.includes('cliente') || preguntaLower.includes('cartera')) {
            return `👥 Tu cartera tiene ${totalClientes} clientes activos.

${totalClientes >= 100 ? '👑 ¡Cartera Premium! Tienes una base sólida.' : 
  totalClientes >= 50 ? '💪 Buena base de clientes. ¡A crecer!' : 
  '🌱 Cartera en crecimiento. ¡Cada cliente cuenta!'}`;
        }
        
        if (preguntaLower.includes('ayuda') || preguntaLower.includes('qué puedo')) {
            return `🤖 Soy tu asistente NOA. Puedo ayudarte con:

- "¿Cómo voy este mes?" - Resumen de cobranza
- "¿Qué debo cobrar esta semana?" - Predicción semanal  
- "¿Cuántos clientes tengo?" - Info de cartera
- "Dame un consejo" - Tip del día

¡Pregúntame lo que necesites!`;
        }
        
        if (preguntaLower.includes('consejo') || preguntaLower.includes('tip')) {
            const tips = [
                '💡 Los lunes y martes por la mañana son los mejores momentos para cobrar por WhatsApp.',
                '💡 Un recordatorio amable 3 días antes del vencimiento aumenta 40% la tasa de pago.',
                '💡 Los clientes que pagan puntual son candidatos ideales para cross-selling.',
                '💡 Personaliza tus mensajes: usar el nombre del cliente aumenta la respuesta.',
                '💡 Si un cliente no responde WhatsApp en 48h, prueba con email o llamada.'
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }
        
        return `🤖 Entiendo que preguntas sobre "${pregunta}". 

Prueba preguntarme:
- ¿Cómo voy este mes?
- ¿Qué debo cobrar esta semana?
- Dame un consejo

¡Estoy aquí para ayudarte!`;
    };
    
    function formatNum(num) {
        return new Intl.NumberFormat('es-CR').format(Math.round(num));
    }

    // ============================================
    // RENDERIZAR PANEL WOW EN DASHBOARD
    // ============================================
    
    window.renderizarPanelWow = async function() {
        const container = document.getElementById('wow-panel');
        if (!container) return;
        
        // Obtener datos
        const comparativa = await window.calcularComparativaMensual();
        const prediccion = window.calcularPrediccionSemanal();
        const logros = await window.calcularLogros();
        
        let html = `
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-bottom:20px;">
                <!-- Comparativa -->
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:5px;">vs ${comparativa?.mesAnteriorNombre || 'mes anterior'}</div>
                    <div style="font-size:2em;font-weight:800;color:${comparativa?.positivo ? '#10b981' : '#ef4444'};">
                        ${comparativa?.positivo ? '+' : ''}${comparativa?.diferencia || 0}%
                    </div>
                    <div style="font-size:11px;color:#64748b;margin-top:5px;">
                        ${comparativa?.positivo ? '📈 ¡Vas mejor!' : '📉 Oportunidad de mejora'}
                    </div>
                </div>
                
                <!-- Predicción -->
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:5px;">🔮 Esta semana</div>
                    <div style="font-size:1.5em;font-weight:800;color:#8b5cf6;">
                        ${prediccion?.polizasVencen || 0} pólizas
                    </div>
                    <div style="font-size:11px;color:#64748b;margin-top:5px;">
                        ~₡${formatNum(prediccion?.prediccionCRC || 0)} por cobrar
                    </div>
                </div>
                
                <!-- Logros -->
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;">
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:8px;text-align:center;">🏆 Logros</div>
                    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                        ${logros.length > 0 
                            ? logros.slice(0,3).map(l => `<span title="${l.desc}" style="font-size:1.5em;cursor:help;">${l.icono}</span>`).join('')
                            : '<span style="color:#64748b;font-size:12px;">Sigue trabajando para desbloquear</span>'
                        }
                    </div>
                </div>
            </div>
            

            <!-- Asistente IA -->
            <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;border:2px solid #8b5cf6;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
                    <span style="font-size:1.5em;">🤖</span>
                    <span style="color:#fff;font-weight:600;">Asistente NOA</span>
                </div>
                <div id="chat-respuesta" style="background:#0f172a;border-radius:10px;padding:15px;margin-bottom:15px;min-height:60px;color:#e2e8f0;font-size:14px;line-height:1.5;position:relative;">
                    <span id="chat-texto">¡Hola! Soy tu asistente. Pregúntame: "¿Cómo voy este mes?" o "¿Qué debo cobrar esta semana?"</span>
                    <button id="chat-cerrar" onclick="window.cerrarRespuestaIA()" style="display:none;position:absolute;top:8px;right:8px;background:#334155;color:#94A3B8;border:none;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;">✕</button>
                </div>
                <div style="display:flex;gap:10px;">
                    <input type="text" id="chat-input" placeholder="Escribe tu pregunta..." 
                           onkeypress="if(event.key==='Enter')window.enviarPreguntaIA()"
                           style="flex:1;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px 15px;color:#fff;font-size:14px;">
                    <button onclick="window.enviarPreguntaIA()" 
                            style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border:none;padding:12px 20px;border-radius:10px;cursor:pointer;font-weight:600;">
                        Enviar
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    };
    
    window.enviarPreguntaIA = async function() {
        const input = document.getElementById('chat-input');
        const chatTexto = document.getElementById('chat-texto');
        const btnCerrar = document.getElementById('chat-cerrar');
        
        if (!input || !input.value.trim()) return;
        
        const pregunta = input.value.trim();
        input.value = '';
        
        if (chatTexto) chatTexto.innerHTML = '<span style="color:#8b5cf6;">🤔 Pensando...</span>';
        if (btnCerrar) btnCerrar.style.display = 'none';
        
        const respuesta = await window.responderAsistenteIA(pregunta);
        if (chatTexto) chatTexto.innerHTML = respuesta.replace(/\n/g, '<br>');
        if (btnCerrar) btnCerrar.style.display = 'block';
    };
    
    window.cerrarRespuestaIA = function() {
        const chatTexto = document.getElementById('chat-texto');
        const btnCerrar = document.getElementById('chat-cerrar');
        
        if (chatTexto) chatTexto.innerHTML = '¡Hola! Soy tu asistente. Pregúntame lo que necesites.';
        if (btnCerrar) btnCerrar.style.display = 'none';
    };

    // ============================================
    // INICIALIZAR WOW
    // ============================================
    
    window.inicializarWow = async function() {
        console.log('🚀 Inicializando WOW...');
        await window.renderizarPanelWow();
        console.log('🚀 WOW inicializado ✅');
    };

    console.log('🚀 NOA WOW cargado ✅');

})();
