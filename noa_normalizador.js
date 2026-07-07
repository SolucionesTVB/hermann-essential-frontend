/**
 * NOA NORMALIZADOR - Módulo Central de Normalización y Validación
 * 
 * Este archivo es el ÚNICO punto de normalización de datos.
 * Todos los puntos de entrada (Excel, Supabase, localStorage, Backup)
 * deben usar estas funciones.
 */

(function() {
    'use strict';

    // =========================================
    // DICCIONARIO DE MAPEO DE CAMPOS
    // =========================================
    const MAPEO_CAMPOS = {
        periodicidad: {
            aliases: ['Período Pago', 'Periodo Pago', 'Periodicidad de pago', 'Periodicidad', 'Frecuencia'],
            requerido: true
        },
        aseguradora: {
            aliases: ['Aseguradora', 'Compañía', 'Empresa'],
            requerido: true
        },
        hasta: {
            aliases: ['Fecha Hasta', 'Vigencia Hasta', 'Hasta', 'Vencimiento', 'Fecha Fin', 'Fec Hasta', 'VigHasta', 'Fin Vigencia', 'Vence', 'Fecha Vencimiento', 'FechaHasta', 'Vig Hasta', 'F Hasta', 'Fhasta'],
            requerido: true,
            transformar: 'fecha'
        },
        desde: {
            aliases: ['Fecha Desde ', 'Fecha Desde', 'Vigencia Desde', 'Desde', 'Inicio', 'Fecha Inicio', 'Fec Desde', 'VigDesde', 'Inicio Vigencia', 'FechaDesde', 'Vig Desde', 'F Desde', 'Fdesde'],
            requerido: false,
            transformar: 'fecha'
        },
        poliza: {
            aliases: ['Número de Póliza', '# Póliza', 'Póliza', 'Poliza', 'No. Póliza'],
            requerido: true
        },
        asegurado: {
            aliases: ['Nombre del Tomador', 'Asegurado', 'Cliente', 'Nombre'],
            requerido: true
        },
        telefono: {
            aliases: ['Celular', 'Teléfono', 'Tel. Oficina', 'Tel. Habitación', 'WhatsApp'],
            requerido: false
        },
        correo: {
            aliases: ['Correo Cliente', 'Correo electrónico', 'Correo Electrónico 1', 'Correo electrónico 1', 'Email', 'Correo Adicional'],
            requerido: false
        },
        prima: {
            aliases: ['Prima', 'Monto', 'Valor', 'Importe', 'Prima Aseguradora'],
            requerido: true
        },
        moneda: {
            aliases: ['Moneda', 'Currency', 'Divisa'],
            requerido: false,
            defaultValido: 'CRC'
        },
        placa: {
            aliases: ['Placa/Folio', 'Placa del Vehículo', 'Placa'],
            requerido: false
        },
        tipo_seguro: {
            aliases: ['Producto', 'Tipo de seguro', 'Ramo'],
            requerido: false
        },
        identificacion: {
            aliases: ['Identificación', 'Cédula', 'Cedula', 'Documento'],
            requerido: false
        }
    };

    // =========================================
    // UTILIDADES
    // =========================================
    
    /**
     * Convierte fecha de Excel (número) a formato legible DD/MM/YYYY
     */
    function convertirFechaExcel(valor) {
        if (!valor) return '';
        
        // Si ya es string con formato fecha
        if (typeof valor === 'string') {
            // Formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS
            if (valor.includes('-') && valor.length >= 10) {
                const soloFecha = valor.split(' ')[0];
                const parts = soloFecha.split('-');
                if (parts.length === 3 && parts[0].length === 4) {
                    return parts[2] + '/' + parts[1] + '/' + parts[0];
                }
            }
            // Ya está en formato DD/MM/YYYY
            if (valor.includes('/')) {
                return valor;
            }
        }
        
        // Si es número Excel (días desde 1900)
        const num = parseFloat(valor);
        if (!isNaN(num) && num > 30000 && num < 60000) {
            const fecha = new Date((num - 25569) * 86400 * 1000);
            const dd = String(fecha.getUTCDate()).padStart(2, '0');
            const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0');
            const yy = fecha.getUTCFullYear();
            return dd + '/' + mm + '/' + yy;
        }
        
        return String(valor);
    }

    /**
     * Obtiene identificador legible de un cliente para mensajes de error
     */
    function getIdentificador(d) {
        return d['Nombre del Tomador'] || 
               d['Asegurado'] || 
               d.asegurado ||
               d['Número de Póliza'] || 
               d['# Póliza'] || 
               d.poliza ||
               'Registro desconocido';
    }

    // =========================================
    // FUNCIONES PRINCIPALES
    // =========================================

    /**
     * Normaliza UN cliente
     * @param {Object} d - Datos del cliente (crudo)
     * @param {Array} avisos - Array donde se agregan los avisos (por referencia)
     * @returns {Object} - Cliente normalizado
     */
    function normalizarCliente(d, avisos) {
        if (!d) return null;
        
        avisos = avisos || [];
        
        // Si viene de Supabase (ya tiene user_id o campos normalizados), no reprocesar
        if (d.user_id || (d.asegurado && d.poliza && d.hasta && !d['Nombre del Tomador'])) {
            return d;
        }
        
        const resultado = { ...d };  // Mantener campos originales
        const identificador = getIdentificador(d);
        
        // Función para normalizar texto (quitar acentos, espacios, lowercase)
        const normText = function(s) {
            return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
        };
        
        for (const [campoNorm, config] of Object.entries(MAPEO_CAMPOS)) {
            let valor = null;
            
            // Buscar valor en aliases (búsqueda flexible)
            for (const alias of config.aliases) {
                // Primero intento exacto
                if (d[alias] !== undefined && d[alias] !== null && d[alias] !== '') {
                    valor = d[alias];
                    break;
                }
                // Si no, buscar en todas las keys del objeto de forma flexible
                const aliasNorm = normText(alias);
                const CAMPOS_IGNORAR = ['id', 'user_id', 'created_at', 'updated_at', 'borrado'];
                for (const key of Object.keys(d)) {
                    if (CAMPOS_IGNORAR.includes(key.toLowerCase())) continue;
                    const keyNorm = normText(key);
                    if (keyNorm === aliasNorm || keyNorm.includes(aliasNorm)) {
                        if (d[key] !== undefined && d[key] !== null && d[key] !== '') {
                            valor = d[key];
                            break;
                        }
                    }
                }
                if (valor) break;
            }
            
            // También revisar si ya existe el campo normalizado
            if (!valor && d[campoNorm]) {
                valor = d[campoNorm];
            }
            
            // Aplicar transformación si es fecha
            if (valor && config.transformar === 'fecha') {
                valor = convertirFechaExcel(valor);
            }
            
            // Validar campos requeridos
            if (config.requerido && !valor) {
                avisos.push({
                    tipo: 'error',
                    campo: campoNorm,
                    identificador: identificador,
                    mensaje: 'Campo "' + campoNorm + '" vacío en: ' + identificador
                });
            }
            
            // Asignar valor (usar default solo si está definido y es válido)
            if (valor) {
                resultado[campoNorm] = valor;
            } else if (config.defaultValido) {
                resultado[campoNorm] = config.defaultValido;
            } else {
                resultado[campoNorm] = '';
            }
        }
        
        return resultado;
    }

    /**
     * Normaliza un ARRAY de clientes
     * @param {Array} datos - Array de clientes crudos
     * @returns {Array} - Array de clientes normalizados
     */
    function normalizarLote(datos) {
        if (!datos || !Array.isArray(datos)) {
            console.warn('[NOA Normalizador] Datos inválidos recibidos');
            return [];
        }
        
        console.log('[NOA Normalizador] Procesando', datos.length, 'registros...');
        
        const avisos = [];
        let nullCount = 0;
        const normalizados = datos.map(function(d, idx) {
            const result = normalizarCliente(d, avisos);
            if (result === null) {
                nullCount++;
                console.warn('[NOA Normalizador] Fila', idx + 2, 'retornó null');
            }
            return result;
        }).filter(function(d) {
            return d !== null;
        });
        
        if (nullCount > 0) {
            console.warn('[NOA Normalizador] ⚠️', nullCount, 'registros fueron filtrados (null)');
        }
        
        // Mostrar avisos si hay
        if (avisos.length > 0) {
            mostrarAvisos(avisos);
        } else {
            console.log('[NOA Normalizador] ✅ Todos los registros OK');
        }
        
        console.log('[NOA Normalizador] ✅ Normalizados:', normalizados.length, 'registros');
        
        // Log de ejemplo para verificar
        if (normalizados.length > 0) {
            console.log('[NOA Normalizador] Ejemplo primer registro:', {
                asegurado: normalizados[0].asegurado,
                periodicidad: normalizados[0].periodicidad,
                aseguradora: normalizados[0].aseguradora,
                hasta: normalizados[0].hasta
            });
        }
        
        return normalizados;
    }

    /**
     * Muestra avisos al usuario de forma inteligente
     */
    function mostrarAvisos(avisos) {
        if (!avisos || avisos.length === 0) return;
        
        // Agrupar por campo
        const porCampo = {};
        avisos.forEach(function(a) {
            if (!porCampo[a.campo]) porCampo[a.campo] = [];
            porCampo[a.campo].push(a.identificador);
        });
        
        // Construir mensaje
        var mensaje = '⚠️ PROBLEMAS DETECTADOS EN LOS DATOS:\n\n';
        for (const campo in porCampo) {
            mensaje += '• ' + porCampo[campo].length + ' registros sin "' + campo + '"\n';
        }
        mensaje += '\nLos datos se cargarán pero algunos campos estarán vacíos.\n';
        mensaje += 'Revisa la consola (F12) para ver detalles.';
        
        // Mostrar al usuario
        alert(mensaje);
        
        // Log detallado en consola
        console.group('🔍 NOA Normalizador - Problemas detectados');
        for (const campo in porCampo) {
            console.groupCollapsed('Campo: ' + campo + ' (' + porCampo[campo].length + ' registros)');
            porCampo[campo].slice(0, 10).forEach(function(id) {
                console.log('  • ' + id);
            });
            if (porCampo[campo].length > 10) {
                console.log('  ... y ' + (porCampo[campo].length - 10) + ' más');
            }
            console.groupEnd();
        }
        console.groupEnd();
    }

    // =========================================
    // EXPORTAR FUNCIONES GLOBALMENTE
    // =========================================
    window.NOA_NORMALIZADOR = {
        normalizarCliente: normalizarCliente,
        normalizarLote: normalizarLote,
        convertirFechaExcel: convertirFechaExcel,
        MAPEO_CAMPOS: MAPEO_CAMPOS
    };
    
    // Alias directos para facilidad de uso
    window.normalizarCliente = normalizarCliente;
    window.normalizarLote = normalizarLote;
    
    console.log('[NOA Normalizador] ✅ Módulo cargado correctamente');

})();

// =========================================
// NORMALIZACIÓN DE MONEDA (TODAS LAS VARIANTES)
// =========================================
window.normalizarMonedaCompleto = function(valor) {
    if (!valor) return 'CRC';
    
    const v = String(valor).toLowerCase().trim();
    
    // USD - Todas las formas posibles
    const esUSD = [
        'usd', 'us', 'us$', 'u$d', 'u$s',
        'dolar', 'dólar', 'dollar', 
        'dolares', 'dólares', 'dollars',
        'dolarés', 'dolár', 'dóláres',
        'dlr', 'dll', 'dls', 'dl',
        '$', 'us dollar', 'us dollars',
        'american dollar', 'american dollars',
        'dolars', 'dólars',
        'doalr', 'dolar americano', 'dólares americanos',
        'd0lares', 'd0lar', // con cero en vez de o
        'do1ares', 'do1ar', // con uno en vez de l
        'usdollar', 'usdollars'
    ].some(alias => v === alias || v.includes(alias));
    
    if (esUSD) return 'USD';
    
    // CRC - Todas las formas posibles (default)
    // Incluye: crc, colones, colon, colón, ₡, etc.
    return 'CRC';
};

console.log('[NOA Normalizador] ✅ normalizarMonedaCompleto cargado');
