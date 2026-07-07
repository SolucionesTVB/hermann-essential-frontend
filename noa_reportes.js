// ============================================
// NOA REPORTES - Métricas y Exportación
// ============================================

(function() {
    'use strict';
    
    console.log('📊 NOA Reportes cargando...');

    // ============================================
    // CALCULAR MÉTRICAS PRINCIPALES
    // ============================================
    
    window.calcularMetricasReportes = async function() {
        if (!window.supabaseClient) {
            console.error('Supabase no disponible');
            return;
        }
        
        try {
            // Obtener pagos
            const { data: pagos, error: errorPagos } = await window.supabaseClient
                .from('historial_pagos')
                .select('monto_pagado, moneda, dias_mora, fecha_pago');
            
            if (errorPagos) throw errorPagos;
            
            // Obtener clientes
            const { data: clientes, error: errorClientes } = await window.supabaseClient
                .from('clientes')
                .select('prima, moneda');
            
            if (errorClientes) throw errorClientes;
            
            // Calcular cobrado (separado por moneda)
            let cobradoUSD = 0, cobradoCRC = 0;
            pagos.forEach(p => {
                const moneda = (p.moneda || 'CRC').toUpperCase();
                if (moneda === 'USD') {
                    cobradoUSD += Number(p.monto_pagado) || 0;
                } else {
                    cobradoCRC += Number(p.monto_pagado) || 0;
                }
            });
            
            // Calcular pendiente (prima total - cobrado)
            let primaUSD = 0, primaCRC = 0;
            clientes.forEach(c => {
                const moneda = (c.moneda || 'CRC').toUpperCase();
                if (moneda === 'USD') {
                    primaUSD += Number(c.prima) || 0;
                } else {
                    primaCRC += Number(c.prima) || 0;
                }
            });
            
            const pendienteUSD = Math.max(0, primaUSD - cobradoUSD);
            const pendienteCRC = Math.max(0, primaCRC - cobradoCRC);
            
            // Mora promedio
            const moraPromedio = pagos.length > 0 
                ? Math.round(pagos.reduce((sum, p) => sum + (Number(p.dias_mora) || 0), 0) / pagos.length)
                : 0;
            
            // Total clientes
            const totalClientes = clientes.length;
            
            // Metas (configurables)
            const metaUSD = 150000;
            const metaCRC = 30000000;
            const avanceUSD = Math.min(100, Math.round((cobradoUSD / metaUSD) * 100));
            const avanceCRC = Math.min(100, Math.round((cobradoCRC / metaCRC) * 100));
            
            // Renderizar KPIs
            renderizarKPIs(cobradoUSD, cobradoCRC, pendienteUSD, pendienteCRC, moraPromedio, totalClientes, avanceUSD, avanceCRC);
            
            // Calcular datos para gráfico de últimos 6 meses
            await calcularGrafico6Meses(pagos);
            
        } catch (error) {
            console.error('Error calculando métricas:', error);
        }
    };
    
    function renderizarKPIs(cobradoUSD, cobradoCRC, pendienteUSD, pendienteCRC, moraPromedio, totalClientes, avanceUSD, avanceCRC) {
        const container = document.getElementById('reportes-kpis');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:30px;">
                <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;padding:25px;text-align:center;">
                    <div style="font-size:1.8em;font-weight:800;color:#fff;">$${formatNumber(cobradoUSD)}</div>
                    <div style="font-size:1.4em;font-weight:700;color:rgba(255,255,255,0.9);">₡${formatNumber(cobradoCRC)}</div>
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:8px;">💰 Total Cobrado</div>
                </div>
                <div style="background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:16px;padding:25px;text-align:center;">
                    <div style="font-size:1.8em;font-weight:800;color:#fff;">$${formatNumber(pendienteUSD)}</div>
                    <div style="font-size:1.4em;font-weight:700;color:rgba(255,255,255,0.9);">₡${formatNumber(pendienteCRC)}</div>
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:8px;">⏳ Pendiente</div>
                </div>
                <div style="background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:16px;padding:25px;text-align:center;">
                    <div style="font-size:2.5em;font-weight:800;color:#fff;">${moraPromedio}</div>
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:8px;">📅 Días Mora Promedio</div>
                </div>
                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:16px;padding:25px;text-align:center;">
                    <div style="font-size:2.5em;font-weight:800;color:#fff;">${totalClientes}</div>
                    <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:8px;">👥 Total Clientes</div>
                </div>
            </div>
            
            <!-- Gauges de Avance -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;">
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:25px;">
                    <h4 style="color:#fff;margin:0 0 15px 0;text-align:center;">🎯 Avance Meta USD</h4>
                    <div style="position:relative;height:20px;background:#0f172a;border-radius:10px;overflow:hidden;">
                        <div style="position:absolute;height:100%;background:linear-gradient(90deg,#10b981,#22c55e);width:${avanceUSD}%;transition:width 0.5s;"></div>
                    </div>
                    <div style="text-align:center;margin-top:10px;color:#10b981;font-size:1.5em;font-weight:700;">${avanceUSD}%</div>
                    <div style="text-align:center;color:#94A3B8;font-size:13px;">$${formatNumber(cobradoUSD)} / $150,000</div>
                </div>
                <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:25px;">
                    <h4 style="color:#fff;margin:0 0 15px 0;text-align:center;">🎯 Avance Meta CRC</h4>
                    <div style="position:relative;height:20px;background:#0f172a;border-radius:10px;overflow:hidden;">
                        <div style="position:absolute;height:100%;background:linear-gradient(90deg,#10b981,#22c55e);width:${avanceCRC}%;transition:width 0.5s;"></div>
                    </div>
                    <div style="text-align:center;margin-top:10px;color:#10b981;font-size:1.5em;font-weight:700;">${avanceCRC}%</div>
                    <div style="text-align:center;color:#94A3B8;font-size:13px;">₡${formatNumber(cobradoCRC)} / ₡30,000,000</div>
                </div>
            </div>
        `;
    }
    
    async function calcularGrafico6Meses(pagos) {
        // Agrupar por mes
        const porMes = {};
        pagos.forEach(p => {
            if (!p.fecha_pago) return;
            
            let mes;
            if (p.fecha_pago.includes('/')) {
                const partes = p.fecha_pago.split('/');
                mes = `${partes[2]}-${partes[1].padStart(2, '0')}`;
            } else {
                mes = p.fecha_pago.substring(0, 7);
            }
            
            if (!porMes[mes]) porMes[mes] = { cobrado: 0 };
            porMes[mes].cobrado += Number(p.monto_pagado) || 0;
        });
        
        // Ordenar y tomar últimos 6
        const mesesOrdenados = Object.keys(porMes).sort().slice(-6);
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const labels = mesesOrdenados.map(m => {
            const [año, mes] = m.split('-');
            return `${nombresMeses[parseInt(mes) - 1]} ${año.slice(2)}`;
        });
        
        const dataCobrado = mesesOrdenados.map(m => Math.round(porMes[m].cobrado));
        
        renderizarGrafico(labels, dataCobrado);
    }
    
    function renderizarGrafico(labels, dataCobrado) {
        const container = document.getElementById('reportes-grafico');
        if (!container) return;
        
        container.innerHTML = `
            <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:25px;">
                <h4 style="color:#fff;margin:0 0 20px 0;">📈 Cobrado - Últimos 6 Meses</h4>
                <canvas id="chart-reportes" style="max-height:300px;"></canvas>
            </div>
        `;
        
        setTimeout(() => {
            const canvas = document.getElementById('chart-reportes');
            if (canvas && window.Chart) {
                new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Cobrado',
                            data: dataCobrado,
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderColor: '#10b981',
                            borderWidth: 2,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { 
                            legend: { display: false }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                ticks: { 
                                    color: '#94A3B8',
                                    callback: function(value) {
                                        return '₡' + formatNumber(value);
                                    }
                                }, 
                                grid: { color: 'rgba(255,255,255,0.1)' } 
                            },
                            x: { 
                                ticks: { color: '#fff' }, 
                                grid: { display: false } 
                            }
                        }
                    }
                });
            }
        }, 100);
    }
    
    function formatNumber(num) {
        return new Intl.NumberFormat('es-CR').format(Math.round(num));
    }

    // ============================================
    // EXPORTAR REPORTE COMPLETO
    // ============================================
    
    window.exportarReporteCompleto = async function() {
        if (!window.supabaseClient) {
            alert('Error: Supabase no disponible');
            return;
        }
        
        try {
            // Obtener todos los datos
            const { data: clientes } = await window.supabaseClient.from('clientes').select('*');
            const { data: pagos } = await window.supabaseClient.from('historial_pagos').select('*');
            const { data: envios } = await window.supabaseClient.from('historial_envios').select('*');
            
            // Crear libro Excel con múltiples hojas
            const wb = XLSX.utils.book_new();
            
            // Hoja 1: Resumen
            const resumen = [
                ['REPORTE COMPLETO NOA COBROS'],
                ['Fecha de generación:', new Date().toLocaleString('es-CR')],
                [''],
                ['MÉTRICAS PRINCIPALES'],
                ['Total Clientes:', clientes?.length || 0],
                ['Total Pagos Registrados:', pagos?.length || 0],
                ['Total Envíos:', envios?.length || 0],
            ];
            const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
            
            // Hoja 2: Clientes
            if (clientes && clientes.length > 0) {
                const wsClientes = XLSX.utils.json_to_sheet(clientes.map(c => ({
                    'Asegurado': c.asegurado || '',
                    'Póliza': c.poliza || '',
                    'Prima': c.prima || 0,
                    'Moneda': c.moneda || 'CRC',
                    'Teléfono': c.telefono || '',
                    'Correo': c.correo || '',
                    'Desde': c.desde || '',
                    'Hasta': c.hasta || ''
                })));
                XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');
            }
            
            // Hoja 3: Pagos
            if (pagos && pagos.length > 0) {
                const wsPagos = XLSX.utils.json_to_sheet(pagos.map(p => ({
                    'Cliente': p.cliente_nombre || '',
                    'Póliza': p.poliza || '',
                    'Monto': p.monto_pagado || 0,
                    'Moneda': p.moneda || 'CRC',
                    'Fecha Pago': p.fecha_pago || '',
                    'Días Mora': p.dias_mora || 0
                })));
                XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos');
            }
            
            // Hoja 4: Envíos
            if (envios && envios.length > 0) {
                const wsEnvios = XLSX.utils.json_to_sheet(envios.map(e => ({
                    'Cliente': e.cliente_nombre || '',
                    'Canal': e.canal || '',
                    'Estado': e.estado || '',
                    'Mensaje': e.mensaje || '',
                    'Fecha': e.fecha_envio || ''
                })));
                XLSX.utils.book_append_sheet(wb, wsEnvios, 'Envíos');
            }
            
            // Descargar
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `reporte_completo_${fecha}.xlsx`);
            
            alert('✅ Reporte exportado exitosamente');
            
        } catch (error) {
            console.error('Error exportando reporte:', error);
            alert('❌ Error al exportar: ' + error.message);
        }
    };

    // ============================================
    // INICIALIZAR REPORTES
    // ============================================
    
    window.inicializarReportes = async function() {
        console.log('📊 Inicializando Reportes...');
        await window.calcularMetricasReportes();
        console.log('📊 Reportes inicializado ✅');
    };

    console.log('📊 NOA Reportes cargado ✅');

})();
