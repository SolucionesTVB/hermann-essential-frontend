(()=> {
  // --- Utils CSV ---
  const norm = s=> (s==null?'':String(s)).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
  function detectDelim(sample){
    const count=(txt,ch)=>{let c=0,inQ=false;for(let i=0;i<txt.length;i++){const t=txt[i];
      if(t==='"'){ if(inQ && txt[i+1]==='"'){i++;} else inQ=!inQ; }
      else if(!inQ && t===ch){ c++; }} return c; };
    return count(sample,';')>count(sample,',')? ';' : ',';
  }
  function splitCSV(line, d){
    const out=[],len=line.length; let cur='',inQ=false;
    for(let i=0;i<len;i++){
      const ch=line[i];
      if(ch==='"'){ if(inQ && line[i+1]==='"'){cur+='"';i++;} else inQ=!inQ; }
      else if(ch===d && !inQ){ out.push(cur); cur=''; }
      else cur+=ch;
    }
    out.push(cur); return out;
  }
  function parseCSV(text){
    text=text.replace(/^\uFEFF/,'').replace(/\r/g,'');
    const lines=text.split('\n').filter(l=>l.length>0);
    const sample=lines.slice(0,5).join('\n');
    const d=detectDelim(sample);
    const cols=splitCSV(lines.shift(),d).map(s=>s.trim());
    const data=lines.map(line=>{const vals=splitCSV(line,d);const obj={};cols.forEach((c,i)=>obj[c]=(vals[i]??'').trim());return obj;});
    return { cols, data };
  }

  // --- Excel (.xlsx/.xls) via SheetJS CDN ---
  async function ensureXLSX(){
    if (window.XLSX) return;
    await new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js';
      s.onload=res; s.onerror=()=>rej(new Error('No se pudo cargar XLSX'));
      document.head.appendChild(s);
    });
  }
  async function parseExcel(file){
    await ensureXLSX();
    const buf = await file.arrayBuffer();
    const wb  = XLSX.read(new Uint8Array(buf), { type:'array' });
    const sh  = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sh, { header:1, raw:true });
    const cols = (rows.shift()||[]).map(v=> v==null?'':String(v));
    const data = rows.map(r=>{
      const o={}; cols.forEach((c,i)=> o[c] = (r[i]==null?'':String(r[i])) ); return o;
    });
    return { cols, data };
  }

  // === USA EL NORMALIZADOR CENTRAL ===
  async function handleFile(file){
    const name=file.name.toLowerCase();
    let parsed;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) parsed = await parseExcel(file);
    else if (name.endsWith('.csv')) parsed = parseCSV(await file.text());
    else {
      try { parsed = await parseExcel(file); }
      catch { parsed = parseCSV(await file.text()); }
    }

    console.log('[NOA] Headers detectados:', parsed.cols);
    
    // === USAR NORMALIZADOR CENTRAL ===
    const datosNormalizados = window.normalizarLote ? window.normalizarLote(parsed.data) : parsed.data;
    
    console.log('[NOA] ✅ Datos normalizados:', datosNormalizados.length, 'registros');

    if (typeof window.NOA_RENDER_CARTERA==='function'){
      window.NOA_LAST_COLS = parsed.cols;
      window.NOA_LAST_SAMPLE = datosNormalizados.slice(0,3);
      window.NOA_RENDER_CARTERA({ cols: parsed.cols, data: datosNormalizados });
    } else {
      alert('Renderer de Cartera no encontrado.');
    }
  }

  // ===== Escuchar el "change" GLOBAL en captura =====
  document.addEventListener('change', async (e)=>{
    const el = e.target;
    if (el && el.tagName === 'INPUT' && el.type === 'file' && el.files && el.files[0]) {
      try { await handleFile(el.files[0]); }
      catch(err){ alert('No se pudo leer el archivo: '+err); }
    }
  }, true);

  // Soportar drop directo
  document.addEventListener('dragover', e=>{ e.preventDefault(); }, false);
  document.addEventListener('drop', async e=>{
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    try { await handleFile(e.dataTransfer.files[0]); }
    catch(err){ alert('No se pudo leer el archivo (drop): '+err); }
  }, false);
})();
