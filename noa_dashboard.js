// ============================================
// NOA DASHBOARD ACCIONABLE - Datos Reales de Supabase
// ============================================

(function() {
    'use strict';
    
    console.log('📊 NOA Dashboard Accionable cargando...');

    // ============================================
    // CALCULAR VENCIMIENTOS
    // ============================================
    
    function calcularDiasParaVencer(fechaHasta) {
        if (!fechaHasta) return null;
        
        let fecha;
        if (fechaHasta.includes('/')) {
            const [d, m, y] = fechaHasta.split('/');
            fecha = new Date(y, m - 1, d);
        } else {
            fecha = new Date(fechaHasta);
        }
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fecha.setHours(0, 0, 0, 0);
        
        const diffTime = fecha - hoy;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ============================================
    // ACTUALIZAR KPIS PRINCIPALES
    // ============================================
    
    window.actualizarKPIsDashboard = function() {
        if (!window.datosReales || window.datosReales.length === 0) {
            console.log('📊 Dashboard: Sin datos para KPIs');
            return;
        }
        
        const clientes = window.datosReales;
        let vencenHoy = 0;
        let vencenSemana = 0;
        let vencidos = 0;
        let alDia = 0;
        
        clientes.forEach(c => {
            const dias = calcularDiasParaVencer(c.hasta);
            if (dias === null) return;
            
            if (dias < 0) vencidos++;
            else if (dias === 0) vencenHoy++;
            else if (dias <= 7) vencenSemana++;
            else alDia++;
        });
        
        // Actualizar DOM
        const elemHoy = document.getElementById('kpi-vencen-hoy');
        const elemSemana = document.getElementById('kpi-vencen-semana');
        const elemTotal = document.getElementById('kpi-total-clientes');
        const elemVencidos = document.getElementById('kpi-vencidos');
        
        if (elemHoy) elemHoy.textContent = vencenHoy;
        if (elemSemana) elemSemana.textContent = vencenSemana;
        if (elemTotal) elemTotal.textContent = clientes.length;
        if (elemVencidos) elemVencidos.textContent = vencidos;
        
        console.log('📊 KPIs actualizados:', { vencenHoy, vencenSemana, vencidos, total: clientes.length });
    };

    // ============================================
    // ACTUALIZAR SEMÁFORO CON DATOS REALES
    // ============================================
    
    window.actualizarSemaforoDashboard = function() {
        if (!window.datosReales || window.datosReales.length === 0) return;
        
        const clientes = window.datosReales;
        let verde = 0, amarillo = 0, rojo = 0;
        
        clientes.forEach(c => {
            const dias = calcularDiasParaVencer(c.hasta);
            if (dias === null) return;
            
            if (dias < 0) rojo++;
            else if (dias <= 10) amarillo++;
            else verde++;
        });
        
        // Actualizar badges del semáforo
        const badges = document.querySelectorAll('.tag-semaforo');
        badges.forEach(badge => {
            if (badge.classList.contains('verde')) {
                badge.textContent = `Verde: ${verde}`;
            } else if (badge.classList.contains('amarillo')) {
                badge.textContent = `Amarillo: ${amarillo}`;
            } else if (badge.classList.contains('rojo')) {
                badge.textContent = `Rojo: ${rojo}`;
            }
        });
        
        console.log('🚦 Semáforo actualizado:', { verde, amarillo, rojo });
    };

    // ============================================
    // TOP 5 CLIENTES QUE REQUIEREN ATENCIÓN
    // ============================================
    
    window.actualizarTop5Urgentes = async function() {
        try {
            const datos = window.datosReales || [];
            if (datos.length === 0) return;

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            // Calcular mora desde datosReales
            const conMora = datos
                .filter(c => c.estado !== 'pagado' && c.hasta)
                .map(c => {
                    const hasta = new Date(c.hasta);
                    const diasMora = Math.floor((hoy - hasta) / (1000 * 60 * 60 * 24));
                    return {
                        cliente_nombre: c.asegurado || 'Sin nombre',
                        poliza: c.poliza || '',
                        dias_mora: diasMora,
                        id: c.id
                    };
                })
                .filter(c => c.dias_mora > 0)
                .sort((a, b) => b.dias_mora - a.dias_mora);

            // Top 5
            const top5 = conMora.slice(0, 5);
            
            // Actualizar DOM
            const contenedor = document.getElementById('top5-urgentes');
            if (!contenedor) return;
            
            if (top5.length === 0) {
                contenedor.innerHTML = '<p style="color:#36ffad;margin:0;">✅ No hay clientes con mora significativa</p>';
                return;
            }
            
            // Guardar top5 para acceso desde botones
            window.top5Urgentes = top5;
            
            contenedor.innerHTML = top5.map((c, i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div>
                        <span style="color:#ff534f;font-weight:700;">${i + 1}.</span>
                        <span style="color:#fff;margin-left:8px;">${c.cliente_nombre}</span>
                        <span style="color:#94A3B8;font-size:12px;margin-left:8px;">${c.poliza}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:#ff534f;font-weight:600;">${c.dias_mora} días mora</span>
                        <button onclick="window.cobrarUrgente(${i})" 
                                style="background:#3b82f6;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">
                            Cobrar →
                        </button>
                    </div>
                </div>
            `).join('');
            
            console.log('🚨 Top 5 urgentes actualizado');
            
        } catch (error) {
            console.error('Error actualizando top 5:', error);
        }
    };

    // ============================================
    // FILTRAR CARTERA POR CLIENTE (acción rápida)
    // ============================================
    
    window.filtrarCarteraPorCliente = function(nombreCliente) {
        // Cambiar a tab de cartera directamente
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        const carteraTab = document.getElementById('cartera');
        if (carteraTab) carteraTab.classList.add('active');
        
        // Forzar render de cartera y luego buscar
        setTimeout(() => {
            // Trigger render si existe
            if (typeof render === 'function') {
                render();
            }
            
            // Buscar el input de búsqueda después de que se renderice
            setTimeout(() => {
                const inputBusqueda = document.getElementById('noa-search');
                if (inputBusqueda) {
                    inputBusqueda.value = nombreCliente;
                    inputBusqueda.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('✅ Filtrado por cliente:', nombreCliente);
                } else {
                    // Fallback: buscar por variable global
                    if (typeof window.SEARCH_TERM !== 'undefined') {
                        window.SEARCH_TERM = nombreCliente;
                        if (typeof render === 'function') render();
                        console.log('✅ Filtrado por SEARCH_TERM:', nombreCliente);
                    }
                }
            }, 500);
        }, 200);
    };

    // ============================================
    // GRÁFICO DE TENDENCIA CON DATOS REALES
    // ============================================
    
    window.actualizarGraficoTendencia = async function() {
        if (!window.supabaseClient) return;
        
        try {
            const { data: pagos, error } = await window.supabaseClient
                .from('historial_pagos')
                .select('fecha_pago, monto_pagado, moneda');
            
            if (error) throw error;
            
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
                
                if (!porMes[mes]) porMes[mes] = { usd: 0, crc: 0 };
                
                const moneda = window.normalizarMonedaCompleto ? 
                    window.normalizarMonedaCompleto(p.moneda) : 
                    (p.moneda || 'CRC').toUpperCase();
                
                if (moneda === 'USD') {
                    porMes[mes].usd += Number(p.monto_pagado) || 0;
                } else {
                    porMes[mes].crc += Number(p.monto_pagado) || 0;
                }
            });
            
            // Ordenar meses y tomar últimos 6
            const mesesOrdenados = Object.keys(porMes).sort().slice(-6);
            const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            
            const labels = mesesOrdenados.map(m => {
                const [año, mes] = m.split('-');
                return `${nombresMeses[parseInt(mes) - 1]} ${año.slice(2)}`;
            });
            
            const dataUSD = mesesOrdenados.map(m => Math.round(porMes[m].usd));
            const dataCRC = mesesOrdenados.map(m => Math.round(porMes[m].crc / 1000)); // En miles
            
            // Actualizar gráfico
            const canvas = document.getElementById('salesTrendChart');
            if (!canvas) return;
            
            // Destruir gráfico anterior si existe
            if (window.dashboardChart) {
                window.dashboardChart.destroy();
            }
            
            const ctx = canvas.getContext('2d');
            window.dashboardChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cobrado USD ($)',
                        backgroundColor: '#36ffad',
                        borderColor: '#36c7ff',
                        borderWidth: 2,
                        data: dataUSD
                    }, {
                        label: 'Cobrado CRC (miles ₡)',
                        backgroundColor: '#ffa600',
                        borderColor: '#ffa600',
                        borderWidth: 2,
                        data: dataCRC
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#fff' } }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { color: '#fff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: { 
                            ticks: { color: '#fff' },
                            grid: { display: false }
                        }
                    }
                }
            });
            
            console.log('📈 Gráfico actualizado con datos reales');
            
        } catch (error) {
            console.error('Error actualizando gráfico:', error);
        }
    };

    // ============================================
    // ACTUALIZAR TODO EL DASHBOARD
    // ============================================
    
    window.actualizarDashboardCompleto = async function() {
        console.log('📊 Actualizando Dashboard completo...');
        
        window.actualizarKPIsDashboard();
        window.actualizarSemaforoDashboard();
        
        if (typeof window.actualizarComparativoCobros === 'function') {
            await window.actualizarComparativoCobros();
        }
        
        await window.actualizarTop5Urgentes();
        await window.actualizarGraficoTendencia();
        
        // Inicializar Panel WOW
        if (typeof window.inicializarWow === 'function') {
            await window.inicializarWow();
        }
        
        console.log('📊 Dashboard actualizado completamente');
    };

    // ============================================
    // AUTO-ACTUALIZAR AL CARGAR DATOS
    // ============================================
    
    // Escuchar cuando se cargan datos
    const originalActualizarEstadisticas = window.actualizarEstadisticas;
    window.actualizarEstadisticas = function() {
        if (originalActualizarEstadisticas) originalActualizarEstadisticas();
        window.actualizarDashboardCompleto();
    };

    console.log('📊 NOA Dashboard Accionable cargado ✅');

})();

    // ============================================
    // FUNCIONES DE NAVEGACIÓN PARA BOTONES
    // ============================================
    
    window.irACartera = function() {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('cartera').classList.add('active');
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector('.nav-tab[onclick*="cartera"]');
        if (btn) btn.classList.add('active');
    };
    
    window.irACarteraWA = function() {
        window.irACartera();
        setTimeout(() => alert('Selecciona clientes con los checkboxes y usa el botón WhatsApp Masivo en la cartera'), 500);
    };
    
    window.irACarteraEmail = function() {
        window.irACartera();
        setTimeout(() => alert('Selecciona clientes con los checkboxes y usa el botón Email Masivo en la cartera'), 500);
    };
    
    window.irAHistorialEnvios = function() {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('historial').classList.add('active');
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector('.nav-tab[onclick*="historial"]');
        if (btn) btn.classList.add('active');
        
        // Cargar datos
        setTimeout(() => {
            if (typeof window.filtrarHistorial === 'function') {
                window.filtrarHistorial('todos');
            }
        }, 300);
    };
    
    window.irAHistorialPagos = function() {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('historial-pagos-tab').classList.add('active');
        
        // Cargar datos
        setTimeout(() => {
            if (typeof window.renderHistorialPagos === 'function') {
                window.renderHistorialPagos();
            }
        }, 300);
    };


// Modal de Cobro - Elegir canal para enviar aviso
window.cobrarUrgente = function(indice) {
    if (!window.top5Urgentes || !window.top5Urgentes[indice]) {
        alert('Error: No se encontró el cliente');
        return;
    }
    const cliente = window.top5Urgentes[indice];
    const clienteCompleto = (window._datosRealesBackup || window.datosReales || []).find(c =>
        c.asegurado === cliente.cliente_nombre || c.poliza === cliente.poliza
    );
    const datosOriginales = window._datosRealesBackup || window.datosReales || [];
    window._datosRealesBackup = datosOriginales;
    window.datosReales = clienteCompleto ? [clienteCompleto] : [];
    cambiarTab('cartera');
    setTimeout(function() {
        if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
        else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
        const old = document.getElementById('semaforo-banner'); if (old) old.remove();
    }, 300);

};


// Enviar cobro por WhatsApp
window.enviarCobroWhatsApp = function(telefono, nombreCliente) {
    const mensaje = document.getElementById('mensaje-cobro').value;
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    // Agregar código de país si no lo tiene
    const telefonoCompleto = telefonoLimpio.startsWith('506') ? telefonoLimpio : '506' + telefonoLimpio;
    
    // Cerrar modal
    document.getElementById('modal-cobro').remove();

    if (window.enviarWAIndividual) {
        window.enviarWAIndividual(telefonoCompleto, mensaje, nombreCliente, null, 'manual');
    } else {
        const url = `https://wa.me/${telefonoCompleto}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        if (typeof guardarEnvio === 'function') {
            guardarEnvio(null, nombreCliente, 1, 'whatsapp', 'Aviso de Cobro', 'manual');
        }
    }
};

// Enviar cobro por Email
window.enviarCobroEmail = function(email, nombreCliente, poliza) {
    const mensaje = document.getElementById('mensaje-cobro').value;
    
    // Usar EmailJS si está configurado
    if (window.emailjs) {
        emailjs.send('service_noa', 'template_cobro', {
            to_email: email,
            nombre: nombreCliente,
            poliza: poliza,
            mensaje: mensaje
        }).then(() => {
            alert('✅ Email enviado correctamente');
            document.getElementById('modal-cobro').remove();
            
            if (typeof guardarEnvio === 'function') {
                guardarEnvio(null, nombreCliente, 1, 'email', 'Aviso de Cobro', 'manual');
            }
        }).catch(err => {
            console.error('Error enviando email:', err);
            // Fallback: abrir cliente de correo
            window.location.href = `mailto:${email}?subject=Aviso de Cobro - Póliza ${poliza}&body=${encodeURIComponent(mensaje)}`;
        });
    } else {
        // Fallback: abrir cliente de correo
        window.location.href = `mailto:${email}?subject=Aviso de Cobro - Póliza ${poliza}&body=${encodeURIComponent(mensaje)}`;
        document.getElementById('modal-cobro').remove();
    }
};
