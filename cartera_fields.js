(()=>{
const CAMPOS=[
{k:'asegurado',l:'Asegurado',s:['asegurado','cliente','nombre','tomador']},
{k:'identificacion',l:'Identificación',s:['identificación','cedula','cédula','documento']},
{k:'poliza',l:'Póliza',s:['poliza','póliza','# poliza','numero poliza']},
{k:'telefono',l:'Tel / WA',s:['teléfono','telefono','celular','whatsapp']},
{k:'correo',l:'Email',s:['correo','email','mail']},
{k:'periodicidad',l:'Periodicidad',s:['periodicidad','frecuencia','periodo pago']},
{k:'desde',l:'Desde',s:['desde','vigencia desde','fecha desde']},
{k:'hasta',l:'Vence',s:['hasta','vigencia hasta','vence','fecha hasta']},
{k:'moneda',l:'Moneda',s:['moneda','currency']},
{k:'prima',l:'Prima (IVA incl.)',s:['prima','prima total','monto asegurado']},
{k:'placa',l:'Objeto Asegurado',s:['placa','placa/folio','matricula','objeto']},
{k:'aseguradora',l:'Aseguradora',s:['aseguradora','compañía']},
{k:'estado',l:'Estado Póliza',s:['estado','status']}
];
const NOA={bg:'#111827',panel:'#1F2937',fg:'#FFFFFF',muted:'#CBD5E1',accent:'#0EA5E9',ok:'#10B981',warn:'#F59E0B',err:'#EF4444',radius:'14px',shadow:'0 10px 30px rgba(0,0,0,.25)'};
const norm=s=>(s==null?'':String(s)).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
function mapCol(h){const n=norm(h);for(let c of CAMPOS){if(c.s.some(x=>norm(x)===n))return c.k;}return null;}

function buildCols(raw){
  const map=new Map();
  raw.forEach(h=>{const k=mapCol(h);if(k)map.set(k,h);});
  const out=[];
  out.push({key:'select',label:'☑️'});
  out.push({key:'estado_pago',label:'Estado Pago'});
  out.push({key:'asegurado_sticky',label:'Asegurado'});
  out.push({key:'identificacion',label:'Cédula'});
  out.push({key:'acciones',label:'Acciones'});
  out.push({key:'desde',label:'Desde'});
  out.push({key:'hasta',label:'Hasta'});
  out.push({key:'periodicidad',label:'Periodicidad'});
  out.push({key:'prima',label:'Prima (IVA incl.)'});
  out.push({key:'moneda',label:'Moneda'});
  out.push({key:'telefono',label:'Tel / WA'});
  out.push({key:'correo',label:'Email'});
  out.push({key:'poliza',label:'Póliza'});
  out.push({key:'aseguradora',label:'Aseguradora'});
  out.push({key:'placa',label:'Objeto Asegurado'});
  out.push({key:'fecha_limite',label:'Fecha Límite'});
  out.push({key:'estado',label:'Estado Póliza'});
  return out;
}

let COLS=[],FILTER='PENDIENTE',SEARCH_TERM='';const SZ=50;
function excelDate(v){const n=Number(v);if(!isNaN(n)&&n>1000&&n<100000){const d=new Date((n-25569)*86400*1000);if(!isNaN(d.getTime())){const dd=String(d.getUTCDate()).padStart(2,'0');const mm=String(d.getUTCMonth()+1).padStart(2,'0');const yy=d.getUTCFullYear();return `${dd}/${mm}/${yy}`;}}return v;}
function getFiltered(){const ALL=window.datosReales||[];let filtered=FILTER==='PAGADO'?ALL.filter(r=>r._pagado):FILTER==='PENDIENTE'?ALL.filter(r=>!r._pagado):FILTER==='CRC'?ALL.filter(r=>norm(r.moneda||'crc').includes('crc')||norm(r.moneda||'crc').includes('colon')):FILTER==='USD'?ALL.filter(r=>norm(r.moneda||'').includes('usd')||norm(r.moneda||'').includes('dolar')):ALL;if(SEARCH_TERM){const search=norm(SEARCH_TERM);filtered=filtered.filter(r=>norm(r.asegurado||'').includes(search)||norm(r.poliza||'').includes(search)||norm(r.telefono||'').includes(search)||norm(r.correo||'').includes(search));}return filtered.sort((a,b)=>{const dateA=new Date(a.desde||'9999-12-31');const dateB=new Date(b.desde||'9999-12-31');return dateA-dateB;});}
function getCurrentTab(){const tabs=document.querySelectorAll('.tab-content');for(let t of tabs){if(t.classList.contains('active'))return t.id;}return null;}

function host(){
  const tabId=getCurrentTab();if(tabId!=='cartera')return null;
  let container=document.getElementById('cartera');if(!container)return null;
  let w=container.querySelector('#cartera-noa');
  if(!w){
    w=document.createElement('div');
    w.id='cartera-noa';
    w.style.cssText=`background:${NOA.panel};border-radius:${NOA.radius};box-shadow:${NOA.shadow};margin:20px 0;`;
    w.innerHTML=`<style>
.noa-btn{background:linear-gradient(135deg,${NOA.accent},#0284c7);color:${NOA.fg};border:none;padding:10px 20px;border-radius:${NOA.radius};font-weight:600;font-size:14px;cursor:pointer;transition:all .3s;box-shadow:0 4px 12px rgba(14,165,233,.3)}
.noa-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(14,165,233,.5)}
.noa-btn:active{transform:translateY(0)}
.noa-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;white-space:nowrap}
.badge-ok{background:rgba(16,185,129,.15);color:${NOA.ok};border:1px solid ${NOA.ok}}
.badge-pending{background:rgba(245,158,11,.15);color:${NOA.warn};border:1px solid ${NOA.warn}}
.noa-table{width:100%;border-collapse:collapse;font-size:13px}
.noa-table th{background:${NOA.bg};color:#FFFFFF;text-align:left;padding:10px 14px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;position:sticky;top:0;z-index:3;border-bottom:2px solid ${NOA.accent};white-space:nowrap}
.noa-table th.col-sticky{position:sticky;top:0;left:0;z-index:5;background:${NOA.bg};border-right:1px solid #334155}
.noa-table td{padding:10px 14px;border-bottom:1px solid #e2e8f0;transition:background .2s;white-space:nowrap;background:#ffffff;color:#1e293b;}
.noa-table td.col-sticky{position:sticky;left:0;background:${NOA.panel};z-index:2;border-right:1px solid #334155;font-weight:600;color:#FFFFFF}
.noa-table tr:hover td{background:rgba(14,165,233,.05)}
.noa-table tr:hover td.col-sticky{background:#1a2a3a}
.noa-icon-btn{background:transparent;border:1px solid #334155;color:${NOA.muted};padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.noa-icon-btn:hover{border-color:${NOA.accent};color:${NOA.accent};background:rgba(14,165,233,.1)}
.noa-action-btn{background:linear-gradient(135deg,#10B981,#059669);color:white;border:none;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.noa-action-btn:hover{transform:scale(1.05)}
.noa-ver-btn{background:rgba(14,165,233,.15);border:1px solid ${NOA.accent};color:${NOA.accent};padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;white-space:nowrap}
.noa-wa-btn{background:rgba(16,185,129,.15);border:1px solid #10B981;color:#10B981;padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;white-space:nowrap}
.noa-email-btn{background:rgba(139,92,246,.15);border:1px solid #8b5cf6;color:#8b5cf6;padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;white-space:nowrap}
.noa-arch-btn{background:rgba(239,68,68,.1);border:1px solid #EF4444;color:#EF4444;padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;white-space:nowrap}
</style>
<div style="padding:20px;border-bottom:1px solid #334155">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
<h2 style="margin:0;color:${NOA.fg};font-size:24px;font-weight:700">Cartera <span style="color:${NOA.accent}">NOA</span></h2>
<div style="display:flex;gap:8px;flex-wrap:wrap;">
<button id="btn-nuevo-cliente" class="noa-btn" style="background:linear-gradient(135deg,#10B981,#059669)" onclick="abrirFormularioCliente()">➕ Nuevo</button>
<button id="btn-todo" class="noa-btn">📊 Todas</button>
<button id="btn-crc" class="noa-btn">₡ Colones</button>
<button id="btn-usd" class="noa-btn">$ Dólares</button>

<button id="btn-pendiente" class="noa-btn">⏳ Pendientes</button>
<button id="btn-email-masivo" class="noa-btn" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">📧 Email Masivo</button>
<button id="btn-wa-masivo" class="noa-btn" style="background:linear-gradient(135deg,#10b981,#059669)">📱 WhatsApp Masivo</button>
<button id="btn-archivar" class="noa-btn" style="background:linear-gradient(135deg,#EF4444,#DC2626)">🗑️ Archivar</button><button id="btn-papelera" class="noa-btn" style="background:linear-gradient(135deg,#64748B,#475569)">📦 Papelera</button><button id="btn-exportar" class="noa-btn" style="background:linear-gradient(135deg,#22c55e,#16a34a)">📥 Exportar</button>
</div></div>
<div style="margin-bottom:16px"><input id="noa-search" type="text" placeholder="🔍 Buscar por nombre, póliza, email, teléfono..." style="width:100%;background:#111827;border:1px solid #334155;border-radius:10px;color:#fff;padding:12px 16px;font-size:14px;box-sizing:border-box"></div>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
<select id="filtro-mes-rapido" onchange="window.filtrarPorMesRapido()" style="background:#111827;border:1px solid #334155;border-radius:8px;color:#fff;padding:8px 10px;font-size:13px;cursor:pointer;">
<option value="">📅 Mes...</option>
<option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
<option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
<option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
<option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
</select>
<label style="color:#94A3B8;font-size:13px;white-space:nowrap;">📅 Vence entre:</label>
<input type="date" id="filtro-fecha-desde" style="background:#111827;border:1px solid #334155;border-radius:8px;color:#fff;padding:8px 10px;font-size:13px;cursor:pointer;" onchange="window.filtrarPorFecha()">
<span style="color:#94A3B8;">y</span>
<input type="date" id="filtro-fecha-hasta" style="background:#111827;border:1px solid #334155;border-radius:8px;color:#fff;padding:8px 10px;font-size:13px;cursor:pointer;" onchange="window.filtrarPorFecha()">
<button onclick="window.limpiarFiltroFecha()" style="background:#334155;color:#94A3B8;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;">✕ Limpiar</button>
</div>
<div id="stats" style="color:${NOA.muted};font-size:14px"></div></div>
<div style="overflow:auto;max-height:600px"><table class="noa-table" style="min-width:3000px;"><thead id="thead-cartera"></thead><tbody id="tbody-cartera"></tbody></table></div>
<div style="padding:20px;text-align:center;border-top:1px solid #334155"><button id="btn-more" class="noa-btn" style="display:none">Cargar 50 más</button></div>`;
    container.appendChild(w);
  }
  return w;
}

function hdr(){
  const h=host();if(!h)return;
  const thead=h.querySelector('#thead-cartera');if(!thead)return;
  const W={select:'36px',estado_pago:'130px',asegurado:'260px',asegurado_sticky:'260px',acciones:'420px',hasta:'110px',prima:'150px',telefono:'110px',poliza:'200px',aseguradora:'130px',desde:'120px',periodicidad:'120px',moneda:'90px',placa:'170px',fecha_limite:'130px',identificacion:'120px',correo:'210px',estado:'130px'};
  const headers=COLS.map(c=>{
    const w=W[c.key]||'130px';
    const st='min-width:'+w+';width:'+w+';';
    if(c.key==='asegurado_sticky')return '<th class="col-sticky" style="'+st+'">'+esc(c.label)+'</th>';
    return '<th style="'+st+'">'+esc(c.label)+'</th>';
  }).join('');
  thead.innerHTML='<tr>'+headers+'</tr>';
}

function fmt(v,m){let s=String(v).trim();if(/^[0-9]{1,3},[0-9]{2}$/.test(s))s=s.replace(',','.');const n=Number(s.replace(/[^\d.-]/g,''))||0;try{return new Intl.NumberFormat('es-CR',{style:'currency',currency:m||'CRC',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}catch{return n.toLocaleString();}}
function calcNext(desde,per){const parts=desde.split('/');if(parts.length!==3)return desde;const d=new Date(parts[2],parts[1]-1,parts[0]);if(isNaN(d.getTime()))return desde;const p=norm(per);if(p.includes('anual')||p.includes('año'))d.setFullYear(d.getFullYear()+1);else if(p.includes('semes'))d.setMonth(d.getMonth()+6);else if(p.includes('trimest'))d.setMonth(d.getMonth()+3);else if(p.includes('mensual')||p.includes('mes'))d.setMonth(d.getMonth()+1);else return desde;const dd=String(d.getDate()).padStart(2,'0');const mm=String(d.getMonth()+1).padStart(2,'0');const yy=d.getFullYear();return `${dd}/${mm}/${yy}`;}
function calcularDiasMora(hasta,fechaPago){try{const partsHasta=hasta.split('/');const partsPago=fechaPago.split('/');if(partsHasta.length!==3||partsPago.length!==3)return 0;const dateHasta=new Date(partsHasta[2],partsHasta[1]-1,partsHasta[0]);const datePago=new Date(partsPago[2],partsPago[1]-1,partsPago[0]);const diffTime=datePago-dateHasta;const diffDays=Math.floor(diffTime/(1000*60*60*24));return diffDays>0?diffDays:0;}catch(e){return 0;}}

function calcFechaLimite(hasta){
  if(!hasta)return '';
  const p=hasta.split('/');if(p.length!==3)return '';
  const d=new Date(p[2],p[1]-1,p[0]);if(isNaN(d.getTime()))return '';
  let dias=0;
  while(dias<10){
    d.setDate(d.getDate()+1);
    const dow=d.getDay();
    if(dow!==0&&dow!==6)dias++;
  }
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}

async function marcarPagado(id){const r=(window.datosReales||[]).find(x=>x.id===id);if(!r)return;function isoToDDMMYYYY(fecha){if(!fecha||fecha.trim()==='')return '';if(fecha.includes('/'))return fecha;const parts=fecha.split('-');if(parts.length===3){return `${parts[2]}/${parts[1]}/${parts[0]}`;}return fecha;}const hoy=new Date();const dd=String(hoy.getDate()).padStart(2,'0');const mm=String(hoy.getMonth()+1).padStart(2,'0');const yy=hoy.getFullYear();const fechaPago=`${dd}/${mm}/${yy}`;const desdeConvertido=isoToDDMMYYYY(r.desde);let hastaActual=r.hasta;if(!hastaActual||hastaActual.trim()===''){hastaActual=calcNext(desdeConvertido,r.periodicidad||'mensual');r.hasta=hastaActual;}else{hastaActual=isoToDDMMYYYY(hastaActual);}const nuevaDesde=hastaActual;const nuevaHasta=calcNext(hastaActual,r.periodicidad||'mensual');const diasMora=calcularDiasMora(hastaActual,fechaPago);if(window.guardarPago){const resultPago=await window.guardarPago({cliente_id:r.id,poliza:r.poliza,cliente_nombre:r.asegurado,periodo_desde:desdeConvertido,periodo_hasta:hastaActual,monto_pagado:r.prima,moneda:window.normalizarMoneda(r.moneda),fecha_pago:fechaPago,dias_mora:diasMora,metodo_pago:'manual'});if(!resultPago.success){alert('⚠️ Error guardando pago: '+resultPago.error);return;}}
r._pagado=false;r._fecha_pago=fechaPago;if(window.actualizarClienteSupabase){await window.actualizarClienteSupabase(r.id,{pagado:false,desde:nuevaDesde,hasta:nuevaHasta});}if(window.cargarDatos){await window.cargarDatos();}render();alert('✅ Pago registrado\n\nPeriodo pagado: '+desdeConvertido+' - '+hastaActual+'\nNuevo periodo: '+nuevaDesde+' - '+nuevaHasta+(diasMora>0?'\n⚠️ Mora: '+diasMora+' días':''));}
async function enviarEmailMasivo(){const checkboxes=document.querySelectorAll(".cliente-checkbox:checked");if(checkboxes.length===0){alert("Selecciona al menos un cliente");return;}const seleccionados=Array.from(checkboxes).map(cb=>{const id=cb.dataset.id;return(window.datosReales||[]).find(r=>r.id===id);}).filter(r=>r&&r.correo);if(seleccionados.length===0){alert("Los clientes seleccionados no tienen email");return;}window.mostrarModalMensaje("Email Masivo - "+seleccionados.length+" clientes","Estimado/a [nombre], le recordamos el pago pendiente de su póliza. Por favor contáctenos para coordinar. Gracias.",function(mensaje){window.abrirPanelEnvios(seleccionados,"email",mensaje);});}
async function enviarWAMasivo(){const checkboxes=document.querySelectorAll(".cliente-checkbox:checked");if(checkboxes.length===0){alert("Selecciona al menos un cliente");return;}const seleccionados=Array.from(checkboxes).map(cb=>{const id=cb.dataset.id;return(window.datosReales||[]).find(r=>r.id===id);}).filter(r=>r&&r.telefono);if(seleccionados.length===0){alert("Los clientes seleccionados no tienen teléfono");return;}window.mostrarModalMensaje("WhatsApp Masivo - "+seleccionados.length+" clientes","Estimado/a [nombre], le recordamos el pago pendiente de su póliza. Por favor contáctenos para coordinar. Gracias.",function(mensaje){window.abrirPanelEnvios(seleccionados,"whatsapp",mensaje);});}
async function enviarWA(id){const r=(window.datosReales||[]).find(x=>x.id===id);if(!r||!r.telefono){alert("No hay teléfono registrado para este cliente");return;}const nombre=r.asegurado||"Cliente";const poliza=r.poliza||"";const hasta=r.hasta||"";window.mostrarModalMensaje("Mensaje para "+nombre,"Estimado/a "+nombre+", le recordamos que su póliza "+poliza+" vence el "+hasta+". Por favor contáctenos para coordinar el pago. Gracias.",async function(msg){const tel=String(r.telefono).replace(/\D/g,"");const telCR=tel.startsWith("506")?tel:"506"+tel;const apiKey=localStorage.getItem("wasender_api_key")||"";if(apiKey){try{const res=await fetch("https://www.wasenderapi.com/api/send-message",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({to:telCR,text:msg})});if(res.ok){alert("✅ Mensaje enviado por WhatsApp a "+nombre);if(typeof guardarEnvio==="function")guardarEnvio(r.id,r.asegurado,1,"whatsapp",msg,"manual");}else{alert("❌ Error al enviar: "+res.status);}}catch(e){alert("❌ Error de conexión: "+e.message);}}else{alert("⚠️ WhatsApp no configurado.\nAndá a Configuración y guardá tu API Key de Wasender.");}});}
async function enviarEmail(id){const r=(window.datosReales||[]).find(x=>x.id===id);if(!r||!r.correo){alert("No hay email");return;}const nombre=r.asegurado||"Cliente";const email=r.correo;const poliza=r.poliza||"N/A";const monto=r.prima||0;try{const params={to_email:email,to_name:nombre,from_name:window.nombreCorrector||"Su Corredor",poliza:poliza,monto:monto,message:"Recordatorio de pago de su póliza."};const res=await emailjs.send(window.EMAILJS_CONFIG.serviceId,window.EMAILJS_CONFIG.templateId,params,window.EMAILJS_CONFIG.publicKey);if(res.status===200){alert("✅ Email enviado a: "+email);}else{alert("⚠️ Error al enviar email");}}catch(err){console.error(err);alert("❌ Error: "+err.message);}}

function renderFila(r,isCartera){
  const m=r.moneda||'CRC';
  const id=r.id||'';
  return COLS.map(c=>{
    if(c.key==='select')return '<td><input type="checkbox" class="cliente-checkbox" data-id="'+id+'" data-email="'+esc(r.correo||'')+'"></td>';
    if(c.key==='estado_pago'){const badge=r._pagado?'<span class="noa-badge badge-ok" style="font-size:11px;">✓ Pagado</span>':'<span class="noa-badge badge-pending" style="font-size:11px;">⏳ Pendiente</span>';return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;">'+badge+'</td>';}
    if(c.key==='asegurado'||c.key==='asegurado_sticky'){const n=(r.asegurado||'Sin nombre').toLowerCase().replace(/\b\w/g,l=>l.toUpperCase());return '<td class="col-sticky" style="font-size:13px;padding:10px 14px;white-space:nowrap;">'+esc(n)+'</td>';}
    if(c.key==='acciones'){
      const btnVer='<button onclick="verHistorialPagos(\''+id+'\')" style="font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;border:1px solid;margin-right:3px;background:rgba(14,165,233,.15);border-color:#0EA5E9;color:#0369a1;">💰 Ver</button>';
      const btnEditar='<button onclick="editarCliente(\''+id+'\')" style="font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;border:1px solid;margin-right:3px;background:transparent;border-color:#cbd5e1;color:#475569;">✏️ Editar</button>';
      const btnPagar=r._pagado?'':'<button onclick="marcarPagado(\''+id+'\')" style="font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;border:1px solid;margin-right:3px;background:#10B981;border-color:#10B981;color:#fff;font-weight:600;">💰 Pagar</button>';
      const btnWA='<button onclick="enviarWA(\''+id+'\')" style="font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;border:1px solid;margin-right:3px;background:rgba(16,185,129,.15);border-color:#10B981;color:#059669;">📱 WhatsApp</button>';
      const btnEmail='<button onclick="enviarEmail(\''+id+'\')" style="font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;border:1px solid;margin-right:3px;background:rgba(139,92,246,.15);border-color:#8b5cf6;color:#7c3aed;">📧 Email</button>';
      return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;">'+btnVer+btnEditar+(btnPagar||'')+btnWA+btnEmail+'</td>';
    }
    let v=r[c.key]||'';
    if(c.key==='prima')v=fmt(v,m);
    else if(c.key==='desde'||c.key==='hasta')v=excelDate(v);
    if(c.key==='identificacion')return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;background:#ffffff;color:#1e293b;text-align:center;">'+esc(r.identificacion||'')+'</td>';
    if(c.key==='fecha_limite')return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;background:#ffffff;color:#1e293b;">'+esc(calcFechaLimite(excelDate(r.hasta||'')))+'</td>';
    if(c.key==='estado')return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;background:#ffffff;color:#1e293b;">'+esc(r.estado||'Activo')+'</td>';
    return '<td style="font-size:13px;padding:10px 14px;white-space:nowrap;background:#ffffff;color:#1e293b;">'+esc(v)+'</td>';
  }).join('');
}

function render(){requestAnimationFrame(()=>{
  const h=host();if(!h)return;
  const tb=h.querySelector('#tbody-cartera');if(!tb)return;
  tb.innerHTML='';hdr();
  const tabId=getCurrentTab();const isCartera=tabId==='cartera';
  const filt=getFiltered();const shown=window.CARTERA_SHOWN||SZ;
  const toShow=filt.slice(0,Math.min(shown,filt.length));
  toShow.forEach(r=>{tb.insertAdjacentHTML('beforeend','<tr>'+renderFila(r,isCartera)+'</tr>');});
  const s=h.querySelector('#stats');
  if(s)s.textContent='Mostrando '+toShow.length+' de '+filt.length+' | Filtro: '+(FILTER==='TODO'?'Todos':FILTER==='PAGADO'?'✓ Pagados':FILTER==='PENDIENTE'?'⏳ Pendientes':FILTER==='CRC'?'₡ Colones':FILTER==='USD'?'$ Dólares':'Todos');
  const bm=h.querySelector('#btn-more');
  if(bm){if(toShow.length<filt.length){bm.style.display='inline-block';bm.textContent='⬇ Cargar 50 más (quedan '+(filt.length-toShow.length)+')';}else{bm.style.display='none';}}
  const bt=h.querySelector("#btn-todo");const bc=h.querySelector("#btn-crc");const bu=h.querySelector("#btn-usd");
  if(bt)bt.onclick=()=>{if(window._datosRealesBackup){window.datosReales=window._datosRealesBackup;window._datosRealesBackup=null;}FILTER="TODO";window.CARTERA_SHOWN=SZ;render();};
  if(bc)bc.onclick=()=>{FILTER="CRC";window.CARTERA_SHOWN=SZ;render();};
  const bp=h.querySelector("#btn-pagado");const bpe=h.querySelector("#btn-pendiente");
  if(bp)bp.onclick=()=>{FILTER="PAGADO";window.CARTERA_SHOWN=SZ;render();};
  if(bpe)bpe.onclick=()=>{FILTER="PENDIENTE";window.CARTERA_SHOWN=SZ;render();};
  const bem=h.querySelector("#btn-email-masivo");if(bem)bem.onclick=()=>enviarEmailMasivo();
  const searchInput=h.querySelector("#noa-search");if(searchInput)searchInput.oninput=(e)=>{SEARCH_TERM=e.target.value;window.CARTERA_SHOWN=SZ;render();};
  const bwa=h.querySelector("#btn-wa-masivo");if(bwa)bwa.onclick=()=>enviarWAMasivo();
  if(bu)bu.onclick=()=>{FILTER="USD";window.CARTERA_SHOWN=SZ;render();};
  if(bm)bm.onclick=()=>{window.CARTERA_SHOWN=(window.CARTERA_SHOWN||SZ)+SZ;render();};
  const bbpapelera=h.querySelector("#btn-papelera");if(bbpapelera)bbpapelera.onclick=()=>window.abrirPapelera();
  const bexportar=h.querySelector("#btn-exportar");if(bexportar)bexportar.onclick=()=>window.exportarCarteraExcel();
  const barchivar=h.querySelector("#btn-archivar");if(barchivar)barchivar.onclick=async function(){
  const checkboxes=document.querySelectorAll(".cliente-checkbox:checked");
  if(checkboxes.length===0){ window.abrirModalBorrarCliente(); return; }
  const seleccionados=Array.from(checkboxes).map(cb=>(window.datosReales||[]).find(r=>r.id===cb.dataset.id)).filter(Boolean);
  const nombres=seleccionados.map(r=>r.asegurado||'Sin nombre').join(', ');
  if(!confirm('¿Archivar a '+nombres+'?\n\nPodrás recuperarlos desde la Papelera.')) return;
  for(const r of seleccionados){
    const res=await window.borrarClienteSupabase(r.id);
    if(res.success){ window.datosReales=window.datosReales.filter(x=>x.id!==r.id); }
    else{ alert('Error archivando '+r.asegurado+': '+res.error); }
  }
  if(typeof window.renderizarCartera==='function') window.renderizarCartera();
  if(typeof window.actualizarDashboard==='function') window.actualizarDashboard();
};
});}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
window.marcarPagado=marcarPagado;window.enviarWA=enviarWA;window.enviarEmail=enviarEmail;
window.renderizarCartera=render;
window.setFiltroCartera=function(f){FILTER=f;render();};
window.renderizarCartera=render;
window.setFiltroCartera=function(f){FILTER=f;render();};
window.NOA_RENDER_CARTERA=function(csvData){try{console.log('NOA_RENDER con',csvData.data.length,'clientes');COLS=buildCols(csvData.cols);FILTER='PENDIENTE';window.CARTERA_SHOWN=SZ;setTimeout(function(){render();},300);}catch(e){console.error(e);alert('Error: '+e.message);}};
document.querySelectorAll('.nav-tab').forEach(btn=>{btn.addEventListener('click',()=>{setTimeout(render,300);});});
})();

window.normalizarMoneda = function(m) {
  m = (m || 'CRC').toString().toLowerCase().trim();
  if (m.includes('dolar') || m.includes('dollar') || m === 'usd' || m === '$' || m === 'us') return 'USD';
  return 'CRC';
};

window.filtrarPorFecha = function() {
    const desde = document.getElementById('filtro-fecha-desde')?.value;
    const hasta = document.getElementById('filtro-fecha-hasta')?.value;
    if (!desde && !hasta) return;

    const datosBase = window._datosRealesBackup || window.datosReales || [];
    if (!window._datosRealesBackup) window._datosRealesBackup = window.datosReales;

    const filtrados = datosBase.filter(c => {
        if (!c.hasta) return false;
        let fecha;
        if (c.hasta.includes('/')) {
            const parts = c.hasta.split('/');
            fecha = new Date(parts[2], parts[1]-1, parts[0]);
        } else {
            fecha = new Date(c.hasta);
        }
        if (isNaN(fecha)) return false;
        const fechaStr = fecha.toISOString().substring(0,10);
        if (desde && fechaStr < desde) return false;
        if (hasta && fechaStr > hasta) return false;
        return true;
    });

    window.datosReales = filtrados;
    if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
    else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
};

window.limpiarFiltroFecha = function() {
    const d = document.getElementById('filtro-fecha-desde');
    const h = document.getElementById('filtro-fecha-hasta');
    if (d) d.value = '';
    if (h) h.value = '';
    if (window._datosRealesBackup) {
        window.datosReales = window._datosRealesBackup;
        window._datosRealesBackup = null;
    }
    if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
    else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
};

window.filtrarPorMesRapido = function() {
    const sel = document.getElementById('filtro-mes-rapido');
    const mes = sel ? parseInt(sel.value) : 0;
    if (!mes) {
        window.limpiarFiltroFecha();
        return;
    }
    const datosBase = window._datosRealesBackup || window.datosReales || [];
    if (!window._datosRealesBackup) window._datosRealesBackup = window.datosReales;

    // Limpiar fechas manuales
    const fd = document.getElementById('filtro-fecha-desde');
    const fh = document.getElementById('filtro-fecha-hasta');
    if (fd) fd.value = '';
    if (fh) fh.value = '';

    const filtrados = datosBase.filter(c => {
        if (!c.hasta) return false;
        let fecha;
        if (c.hasta.includes('/')) {
            const parts = c.hasta.split('/');
            fecha = new Date(parts[2], parts[1]-1, parts[0]);
        } else {
            fecha = new Date(c.hasta);
        }
        return !isNaN(fecha) && fecha.getMonth()+1 === mes;
    });

    window.datosReales = filtrados;
    if (typeof window.setFiltroCartera === 'function') window.setFiltroCartera('TODO');
    else if (typeof window.renderizarCartera === 'function') window.renderizarCartera();
};

// =========================================
// EXPORTAR CARTERA A CSV/EXCEL
// =========================================
window.exportarCarteraExcel = function() {
  const datos = window.datosReales || [];
  if (!datos.length) { 
    alert('No hay datos para exportar'); 
    return; 
  }
  
  const headers = ['Asegurado','Cedula','Poliza','Telefono','Email','Periodicidad','Desde','Hasta','Prima','Moneda','Aseguradora','Placa','Estado'];
  
  let csv = headers.join(',') + '\n';
  datos.forEach(function(r) {
    const fila = [
      '"' + (r.asegurado || '').replace(/"/g, '""') + '"',
      '"' + (r.identificacion || '').replace(/"/g, '""') + '"',
      '"' + (r.poliza || '').replace(/"/g, '""') + '"',
      '"' + (r.telefono || '').replace(/"/g, '""') + '"',
      '"' + (r.correo || '').replace(/"/g, '""') + '"',
      '"' + (r.periodicidad || '').replace(/"/g, '""') + '"',
      '"' + (r.desde || '').replace(/"/g, '""') + '"',
      '"' + (r.hasta || '').replace(/"/g, '""') + '"',
      r.prima || 0,
      '"' + (r.moneda || 'CRC') + '"',
      '"' + (r.aseguradora || '').replace(/"/g, '""') + '"',
      '"' + (r.placa || '').replace(/"/g, '""') + '"',
      '"' + (r._pagado ? 'Pagado' : 'Pendiente') + '"'
    ];
    csv += fila.join(',') + '\n';
  });
  
  var blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'cartera_' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('[Cartera] Exportados', datos.length, 'registros');
};
