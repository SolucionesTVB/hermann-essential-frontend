// ============================================
// NOA ML - Machine Learning con Datos Reales
// ============================================

(function() {
    'use strict';
    
    console.log('🤖 NOA ML cargando...');

    // ============================================
    // COMPORTAMIENTO DE PAGO
    // ============================================
    
    window.calcularComportamientoPago = async function() {
        if (!window.supabaseClient) {
            console.error('Supabase no disponible');
            return;
        }
        
        try {
            const { data: pagos, error } = await window.supabaseClient
                .from('historial_pagos')
                .select('cliente_nombre, dias_mora, monto_pagado, moneda');
            
            if (error) throw error;
            
            const porCliente = {};
            pagos.forEach(p => {
                if (!porCliente[p.cliente_nombre]) {
                    porCliente[p.cliente_nombre] = { totalMora: 0, pagos: 0, montoTotal: 0 };
                }
                porCliente[p.cliente_nombre].totalMora += Number(p.dias_mora) || 0;
                porCliente[p.cliente_nombre].pagos++;
                porCliente[p.cliente_nombre].montoTotal += Number(p.monto_pagado) || 0;
            });
            
            const ranking = Object.entries(porCliente).map(([nombre, datos]) => ({
                nombre,
                moraPromedio: Math.round(datos.totalMora / datos.pagos),
                pagos: datos.pagos,
                montoTotal: datos.montoTotal
            })).sort((a, b) => a.moraPromedio - b.moraPromedio);
            
            const moraGeneral = ranking.length > 0 
                ? Math.round(ranking.reduce((sum, c) => sum + c.moraPromedio, 0) / ranking.length)
                : 0;
            
            const mejores = ranking.slice(0, 5);
            const peores = ranking.slice(-5).reverse();
            
            renderizarComportamiento(moraGeneral, mejores, peores);
            
        } catch (error) {
            console.error('Error calculando comportamiento:', error);
        }
    };
    
    function renderizarComportamiento(moraGeneral, mejores, peores) {
        const container = document.getElementById('ml-comportamiento');
        if (!container) return;
        window._mlMejores = mejores;
        window._mlPeores = peores;
        
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:25px;">
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:2.5em;font-weight:800;color:#f59e0b;">${moraGeneral}</div>
                    <div style="color:#94A3B8;font-size:14px;">Días mora promedio</div>
                </div>
                <div style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:12px;padding:20px;text-align:center;cursor:pointer;" onclick="irClienteML(0,'mejor')" title="Ver mejor pagador">
                    <div style="font-size:2.5em;font-weight:800;color:#10b981;">${mejores[0]?.moraPromedio || 0}</div>
                    <div style="color:#94A3B8;font-size:14px;">Mejor pagador →</div>
                </div>
                <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:12px;padding:20px;text-align:center;cursor:pointer;" onclick="irClienteML(0,'peor')" title="Ver peor pagador">
                    <div style="font-size:2.5em;font-weight:800;color:#ef4444;">${peores[0]?.moraPromedio || 0}</div>
                    <div style="color:#94A3B8;font-size:14px;">Peor pagador →</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr;gap:20px;">
                <div style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:12px;padding:20px;">
                    <h4 style="color:#10b981;margin:0 0 15px 0;">🏆 Top 5 Mejores Pagadores</h4>
                    ${mejores.map((c, i) => `
                        <div onclick="irClienteML(${i},'mejor')" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);cursor:pointer;" title="Ver en Cartera">
                            <span style="color:#fff;">${i+1}. ${c.nombre.substring(0,25)}${c.nombre.length > 25 ? '...' : ''}</span>
                            <span style="color:#10b981;font-weight:600;">${c.moraPromedio} días →</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    window.irClienteML = function(indice, tipo) {
        const lista = tipo === 'mejor' ? window._mlMejores : window._mlPeores;
        if (!lista || !lista[indice]) return;
        const nombre = lista[indice].nombre;
        const clienteCompleto = (window._datosRealesBackup || window.datosReales || []).find(c => c.asegurado === nombre);
        const datosOriginales = window._datosRealesBackup || window.datosReales || [];
        window._datosRealesBackup = datosOriginales;
        window.datosReales = clienteCompleto ? [clienteCompleto] : [];
        cambiarTab('cartera');
        setTimeout(function() {
            if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
            else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
            const old = document.getElementById('semaforo-banner');
            if (old) old.remove();
        }, 300);
    };

    // ============================================
    // EFECTIVIDAD DE COBRANZA
    // ============================================
    
    window.calcularEfectividadCobranza = async function() {
        if (!window.supabaseClient) return;
        
        try {
            const { data: envios, error } = await window.supabaseClient
                .from('historial_envios')
                .select('canal, estado, cliente_nombre');
            
            if (error) throw error;
            
            const whatsapp = envios.filter(e => e.canal === 'whatsapp');
            const email = envios.filter(e => e.canal === 'email');
            
            const whatsappExitosos = whatsapp.filter(e => e.estado === 'enviado').length;
            const emailExitosos = email.filter(e => e.estado === 'enviado').length;
            
            const efectividadWA = whatsapp.length > 0 ? Math.round((whatsappExitosos / whatsapp.length) * 100) : 0;
            const efectividadEmail = email.length > 0 ? Math.round((emailExitosos / email.length) * 100) : 0;
            
            const clientesUnicos = [...new Set(envios.map(e => e.cliente_nombre))].length;
            const intentosPromedio = clientesUnicos > 0 ? Math.round(envios.length / clientesUnicos * 10) / 10 : 0;
            
            renderizarEfectividad(whatsapp.length, email.length, efectividadWA, efectividadEmail, clientesUnicos, intentosPromedio);
            
        } catch (error) {
            console.error('Error calculando efectividad:', error);
        }
    };
    
    function renderizarEfectividad(totalWA, totalEmail, efectividadWA, efectividadEmail, clientesUnicos, intentosPromedio) {
        const container = document.getElementById('ml-efectividad');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px;">
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:2em;font-weight:800;color:#22c55e;">${totalWA}</div>
                    <div style="color:#94A3B8;font-size:13px;">📱 WhatsApp enviados</div>
                </div>
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:2em;font-weight:800;color:#3b82f6;">${totalEmail}</div>
                    <div style="color:#94A3B8;font-size:13px;">📧 Emails enviados</div>
                </div>
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:2em;font-weight:800;color:#f59e0b;">${clientesUnicos}</div>
                    <div style="color:#94A3B8;font-size:13px;">👥 Clientes contactados</div>
                </div>
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:2em;font-weight:800;color:#a855f7;">${intentosPromedio}</div>
                    <div style="color:#94A3B8;font-size:13px;">🔄 Intentos/cliente</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;">
                    <h4 style="color:#22c55e;margin:0 0 15px 0;">📱 Efectividad WhatsApp</h4>
                    <div style="background:#0f172a;border-radius:10px;height:30px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#22c55e,#16a34a);height:100%;width:${efectividadWA}%;display:flex;align-items:center;justify-content:center;min-width:40px;">
                            <span style="color:#fff;font-weight:700;font-size:14px;">${efectividadWA}%</span>
                        </div>
                    </div>
                </div>
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;">
                    <h4 style="color:#3b82f6;margin:0 0 15px 0;">📧 Efectividad Email</h4>
                    <div style="background:#0f172a;border-radius:10px;height:30px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#3b82f6,#1d4ed8);height:100%;width:${efectividadEmail}%;display:flex;align-items:center;justify-content:center;min-width:40px;">
                            <span style="color:#fff;font-weight:700;font-size:14px;">${efectividadEmail}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div style="margin-top:20px;background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:20px;">
                <h4 style="color:#fff;margin:0 0 15px 0;">📊 Comparativa de Canales</h4>
                <canvas id="chart-canales" style="max-height:250px;"></canvas>
            </div>
        `;
        
        setTimeout(() => {
            const canvas = document.getElementById('chart-canales');
            if (canvas && window.Chart) {
                new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['WhatsApp', 'Email'],
                        datasets: [{
                            label: 'Enviados',
                            data: [totalWA, totalEmail],
                            backgroundColor: ['#22c55e', '#3b82f6']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                            x: { ticks: { color: '#fff' }, grid: { display: false } }
                        }
                    }
                });
            }
        }, 100);
    }

    // ============================================
    // INICIALIZAR ML
    // ============================================
    
    window.inicializarML = async function() {
        console.log('🤖 Inicializando ML...');
        await window.calcularComportamientoPago();
        await window.calcularEfectividadCobranza();
        console.log('🤖 ML inicializado ✅');
    };

    console.log('🤖 NOA ML cargado ✅');

})();
