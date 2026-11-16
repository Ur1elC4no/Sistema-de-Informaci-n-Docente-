/* ==========================================================
   Lógica de pantallas. Los datos están en datos.js.
   Logo: recursos/logo.png  ·  Decoración opcional: recursos/decoracion.png
   ========================================================== */
/* Estado actual de la aplicación: quién inició sesión, qué vista se ve, filtros, etc. */
var S={user:null,view:'login',sec:null,edit:null,err:'',fileOk:null,rev:null,detail:null,preview:null,f:{q:'',dept:'',carrera:'',ind:'',grado:'',sexo:''}};

/* ---------- Utilidades ---------- */
/* Atajo para buscar un elemento de la página con un selector CSS */
function $(s){return document.querySelector(s)}
/* Convierte caracteres especiales (<, >, &, ") para que lo que escribe el usuario no rompa el HTML */
function esc(x){return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var LBL={vacio:'Vacío',completo:'Completo',pendiente:'Pendiente',validado:'Validado',rechazado:'Rechazado'};
/* Etiqueta de color con el estado (Pendiente, Validado, Rechazado...) */
function pill(s){return '<span class="pill p-'+s+'">'+LBL[s]+'</span>'}
/* Etiqueta Sí / No */
function yn(b){return '<span class="pill '+(b?'p-si':'p-no')+'">'+(b?'Sí':'No')+'</span>'}
/* Busca un profesor por su id */
function prof(id){return PROFS.filter(function(p){return p.id===id})[0]}
/* Busca un apartado del perfil por su id */
function secOf(id){return SECS.filter(function(s){return s.id===id})[0]}
/* Fecha larga: 16 de noviembre de 2026 */
function fmt(d){if(!d)return '—';return new Date(d+'T00:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})}
/* Fecha corta: 16 nov */
function fmtCorto(d){return new Date(d+'T00:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'}).replace('.','')}
/* Fecha de hoy para el encabezado */
function hoy(){return new Date().toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}).replace(/\./g,'')}
/* ¿El SNI o PRODEP sigue vigente? (tiene "Sí" y su fecha de fin no ha pasado) */
function vigente(i){return !!(i&&i.si&&i.fin&&new Date(i.fin+'T23:59:59')>=new Date())}
/* Calcula la edad a partir de la fecha de nacimiento */
function edad(n){if(!n)return '';var b=new Date(n),t=new Date(),a=t.getFullYear()-b.getFullYear();if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate()))a--;return a}
/* Texto corto que identifica un documento en las listas */
function docTitle(d){var s=secOf(d.sec);return s.f.slice(0,2).map(function(f){return d.data[f[0]]}).filter(Boolean).join(' · ')||s.n}
/* Nombre corto del apartado de un documento (para la lista de revisión) */
function docCorto(d){return d.sec==='ind'?d.data.indicador:secOf(d.sec).n.split(':')[0]}
/* Estado de un apartado en el perfil: vacío, completo, pendiente, validado o rechazado.
   Si hay documentos rechazados gana "rechazado"; si no, "pendiente"; si todos están validados, "validado". */
function secState(pid,s){
  if(s.pdf===false){return prof(pid).gen?'completo':'vacio'}
  var ds=DOCS.filter(function(d){return d.prof===pid&&d.sec===s.id});
  if(!ds.length)return NOANS[pid+s.id]?'completo':'vacio';
  if(ds.some(function(d){return d.state==='rechazado'}))return 'rechazado';
  if(ds.some(function(d){return d.state==='pendiente'}))return 'pendiente';
  return 'validado';
}
/* Mensaje breve que aparece abajo y desaparece solo */
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;e.setAttribute('role','status');document.body.appendChild(e);setTimeout(function(){e.remove()},2600)}
/* Cambia de vista (menú lateral) y reinicia lo que estaba abierto */
function go(v){S.view=v;S.sec=null;S.edit=null;S.err='';S.fileOk=null;S.detail=null;render();window.scrollTo(0,0)}

/* Logo: si recursos/logo.png no existe, se muestra un círculo con las siglas */
/* Logo en círculo. Busca recursos/logo.png; si no existe, el bloque de abajo pone las siglas */
function crest(){return '<span class="crest"><img src="recursos/logo.png" alt="Logo de la institución"></span>'}
/* Si una imagen no carga (no está en recursos/), se reemplaza por una alternativa */
document.addEventListener('error',function(e){
  var t=e.target;
  if(t&&t.tagName==='IMG'){
    if(t.parentNode.classList.contains('crest')){t.parentNode.classList.add('ph');t.parentNode.textContent='SID'}
    else if(t.parentNode.classList.contains('deco')){t.parentNode.remove()}
  }
},true);

/* ---------- Estructura general ---------- */
/* Íconos del menú lateral (uno por vista) */
function ico(d){return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'}
var ICONOS={
 panel:ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
 consulta:ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.6 3-5.4 6-5.4s5.4 1.8 6 5.4"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.6 2.9 2.2 3.2 5"/>'),
 valid:ico('<path d="M6 3h9l4 4v14H6z"/><path d="M9 14l2.2 2.2L15.5 12"/>'),
 reportes:ico('<path d="M5 3h10l4 4v14H5z"/><path d="M9 17v-4M12 17v-7M15 17v-2"/>'),
 perfil:ico('<circle cx="12" cy="8" r="3.6"/><path d="M5 21c.8-4.2 3.5-6.2 7-6.2s6.2 2 7 6.2"/>'),
 docs:ico('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')
};

/* Iniciales para el avatar del usuario (ignora palabras cortas como "de" o "y") */
function iniciales(n){return String(n).split(/\s+/).filter(function(w){return w.length>2}).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase()}
var SALIR=ico('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>');
/* Estructura general con sesión iniciada: barra lateral izquierda (logo, menú, usuario) + contenido.
   nav = lista de [vista, texto] que cambia según el rol. */
function shell(nav,body){
  var u=S.user;
  return '<div class="app"><aside class="side"><div class="brand">'+crest()+'<div><div class="sname">Instituto Tecnológico</div><div class="ssub">Investigación docente</div></div></div>'+
  '<nav class="snav" aria-label="Principal">'+nav.map(function(n){return '<button data-act="nav" data-v="'+n[0]+'"'+(S.view===n[0]&&!S.sec&&!S.detail?' aria-current="page"':'')+'>'+ICONOS[n[0]]+'<span>'+n[1]+'</span></button>'}).join('')+'</nav>'+
  '<div class="deco"><img src="recursos/decoracion.png" alt=""></div>'+
  '<div class="sfoot"><div class="who"><i class="avatar" aria-hidden="true">'+iniciales(u.name)+'</i><span><b>'+esc(u.name)+'</b>'+(u.label.toLowerCase()!==u.name.toLowerCase()?'<small>'+esc(u.label)+'</small>':'')+'</span></div>'+
  '<button class="btn sm side-btn" data-act="logout">'+SALIR+'<span>Cerrar sesión</span></button></div></aside>'+
  '<main class="main">'+body+'</main></div>';
}
var BELL='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
var DOCICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/></svg>';
/* Encabezado de cada pantalla: etiqueta superior, fecha, campana de pendientes, título y subtítulo */
function hero(t,tag,bell){
  return '<div class="hero"><div class="topline"><span class="kicker">Sistema de gestión · Ciclo '+new Date().getFullYear()+'</span><span class="sp"></span><span class="date">'+hoy()+'</span>'+
  (bell?'<button class="bell" data-act="nav" data-v="valid" aria-label="Documentos por validar">'+BELL+(bell>0?'<i></i>':'')+'</button>':'')+'</div>'+
  '<h1>'+t+'</h1><p class="tagline">'+tag+'</p></div>';
}

/* ---------- Inicio de sesión ---------- */
/* Pantalla de inicio de sesión (V1) */
function renderLogin(){
  return '<div class="login"><section class="login-l"><span class="ring" aria-hidden="true"></span><div>'+crest()+'<div class="ssub">Instituto Tecnológico</div></div>'+
  '<div class="stack"><h1>Sistema de información docente</h1><ul>'+
  '<li>Captura tu perfil por apartados y sube tus evidencias en PDF.</li>'+
  '<li>La jefatura revisa cada documento y lo valida o lo devuelve con observaciones.</li>'+
  '<li>Consulta indicadores de SNI, PRODEP, proyectos y artículos con filtros y reportes.</li></ul></div>'+
  '<p class="note" style="color:inherit;opacity:.8">Prototipo con datos de ejemplo · Jefatura de Investigación</p></section>'+
  '<section class="login-r"><form class="login-card" id="loginForm" autocomplete="off"><div><h2>Iniciar sesión</h2><p class="muted">Entra con tu cuenta institucional.</p></div>'+
  (S.err?'<div class="err" role="alert">'+esc(S.err)+'</div>':'')+
  '<div><label for="u">Usuario</label><input type="email" id="u" required placeholder="usuario@itc.mx"></div>'+
  '<div><label for="pw">Contraseña</label><input type="password" id="pw" required></div>'+
  '<button class="btn primary" type="submit">Entrar</button>'+
  '<div class="demo"><div class="demo-h"><b>Cuentas de prueba</b><span class="chip">Contraseña: 1234</span></div><div class="accts">'+
  USERS.map(function(u,i){return '<button type="button" class="acct" data-act="fill" data-i="'+i+'"><span class="av">'+ICONOS[u.role==='prof'?'perfil':u.jef==='Investigación'?'panel':u.jef==='Docencia'?'docs':'consulta']+'</span><span class="ai"><b>'+u.label+'</b><small>'+u.email.split('@')[0]+'</small></span></button>'}).join('')+
  '</div></div></form></section></div>';
}

/* ---------- Profesor ---------- */
/* Panel "Mi perfil" del profesor (V3): avisos, avance y tarjetas de los apartados */
function profPanel(){
  var p=prof(S.user.prof),done=0,al=[];
  var cards=SECS.map(function(s){
    var st=secState(p.id,s);if(st==='completo'||st==='validado')done++;
    var n=s.pdf===false?'':DOCS.filter(function(d){return d.prof===p.id&&d.sec===s.id}).length;
    return '<button class="ap" data-act="sec" data-id="'+s.id+'"><span class="n"><span>'+s.n+'</span>'+pill(st)+'</span><small>'+s.d+(n?' · '+n+' registro'+(n>1?'s':''):'')+'</small></button>';
  }).join('');
  [['SNI',p.sni],['PRODEP',p.prodep]].forEach(function(x){
    if(x[1]&&x[1].si){var dias=(new Date(x[1].fin)-new Date())/864e5;
      if(dias<0)al.push('<div class="alert bad">Tu vigencia de '+x[0]+' venció el '+fmt(x[1].fin)+'.</div>');
      else if(dias<=365)al.push('<div class="alert">Tu vigencia de '+x[0]+' vence el '+fmt(x[1].fin)+'. Sube la constancia nueva cuando la tengas.</div>')}});
  DOCS.filter(function(d){return d.prof===p.id&&d.state==='rechazado'}).forEach(function(d){
    al.push('<div class="alert bad">Rechazado en «'+secOf(d.sec).n+'»: '+esc(d.obs)+'</div>')});
  var pct=Math.round(done/SECS.length*100);
  return hero('Mi perfil','Captura cada apartado y sube tu evidencia en PDF.')+
  '<div class="progress" aria-label="Avance"><i style="width:'+pct+'%"></i></div><p class="note">'+done+' de '+SECS.length+' apartados completos</p>'+
  (al.length?'<div class="stack" style="margin:18px 0">'+al.join('')+'</div>':'<div style="height:18px"></div>')+'<div class="grid-ap">'+cards+'</div>';
}

/* Dibuja un campo de formulario (texto, fecha, número o lista) a partir de su definición en SECS */
function field(f,val){
  var k=f[0],t=f[2]||'text',id='f_'+k;
  var inp=t==='select'?'<select id="'+id+'" name="'+k+'" required>'+f[3].map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>'}).join('')+'</select>'
    :'<input type="'+t+'" id="'+id+'" name="'+k+'" value="'+esc(val)+'" required'+(t==='number'?' min="0"':'')+'>';
  return '<div><label for="'+id+'">'+f[1]+'</label>'+inp+'</div>';
}

/* Pantalla de un apartado: lista de registros, pregunta "¿Cuenta con el documento?", campos y carga de PDF */
function secView(){
  var s=secOf(S.sec),p=prof(S.user.prof);
  var head='<div class="head"><div><button class="btn sm" data-act="back" style="margin-bottom:12px">← Mi perfil</button><h1>'+s.n+'</h1><p class="muted">'+s.d+'</p></div></div>';
  if(s.pdf===false){
    var g=p.gen||{};
    return head+'<form class="card stack" id="secForm"><div class="row">'+s.f.map(function(f){return field(f,g[f[0]])}).join('')+'</div>'+
    '<p class="muted">Edad calculada: <b>'+(g.nac?edad(g.nac)+' años':'—')+'</b></p><div class="actions"><button class="btn primary" type="submit">Guardar</button></div></form>';
  }
  var ds=DOCS.filter(function(d){return d.prof===p.id&&d.sec===s.id});
  var list=ds.length?'<div class="card"><h3 style="margin-bottom:6px">Registros</h3>'+ds.map(function(d){
    return '<div class="entry"><div><b>'+esc(docTitle(d))+'</b><div class="muted">'+esc(d.file)+'</div>'+(d.obs&&d.state==='rechazado'?'<div class="obs">Observación: '+esc(d.obs)+'</div>':'')+'</div>'+
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+pill(d.state)+
    '<button class="btn sm" data-act="view" data-id="'+d.id+'">Ver PDF</button>'+
    (d.state==='validado'?'<span class="note">Bloqueado</span>':'<button class="btn sm" data-act="edit" data-id="'+d.id+'">Editar</button>')+'</div></div>'}).join('')+'</div>':'';
  var ed=S.edit?DOCS.filter(function(d){return d.id===S.edit})[0]:null,v=ed?ed.data:{};
  var tiene=!ed&&NOANS[p.id+s.id]?'no':'si';
  var form='<form class="card stack" id="secForm"><h3>'+(ed?'Editar registro':'Agregar registro')+'</h3>'+
  (ed?'':'<div><label>¿Cuentas con este documento o indicador?</label><div class="radios"><label><input type="radio" name="tiene" value="si"'+(tiene==='si'?' checked':'')+'> Sí</label><label><input type="radio" name="tiene" value="no"'+(tiene==='no'?' checked':'')+'> No</label></div></div>')+
  '<div id="docFields" class="stack"'+(tiene==='no'?' hidden':'')+'><div class="row">'+s.f.map(function(f){return field(f,v[f[0]])}).join('')+'</div>'+
  (s.vig?'<div class="row"><div><label for="f_ini">Inicio de vigencia</label><input type="date" id="f_ini" name="vig_ini" value="'+esc(v.vig_ini)+'" required></div><div><label for="f_fin">Fin de vigencia</label><input type="date" id="f_fin" name="vig_fin" value="'+esc(v.vig_fin)+'" required></div></div>':'')+
  '<div class="dz"><div><b>Evidencia en PDF</b><div class="note">Solo se aceptan archivos .pdf</div>'+(ed?'<div class="note">Archivo actual: '+esc(ed.file)+'. Sube otro solo si quieres reemplazarlo.</div>':'')+'</div><input type="file" id="pdf" accept="application/pdf,.pdf"></div>'+
  '<div id="fileMsg">'+(S.fileOk?'<div class="pill p-validado">Documento cargado: '+esc(S.fileOk)+'</div>':'')+'</div></div>'+
  (S.err?'<div class="err" role="alert">'+esc(S.err)+'</div>':'')+
  '<div class="actions">'+(ed?'<button type="button" class="btn" data-act="cancelEdit">Cancelar</button>':'')+'<button class="btn primary" type="submit">'+(ed?'Guardar cambios':'Guardar')+'</button></div></form>';
  return head+'<div class="stack">'+list+form+'</div>';
}

/* Vista "Mis documentos" del profesor (V15) */
function misDocs(){
  var ds=DOCS.filter(function(d){return d.prof===S.user.prof});
  return hero('Mis documentos','Todo lo que has subido y su estado de validación.')+'<div style="height:22px"></div>'+
  '<div class="tw"><table><thead><tr><th>Apartado</th><th>Registro</th><th>Archivo</th><th>Cargado</th><th>Estado</th><th></th></tr></thead><tbody>'+
  (ds.length?ds.map(function(d){return '<tr><td>'+secOf(d.sec).n+'</td><td>'+esc(docTitle(d))+'</td><td>'+esc(d.file)+'</td><td>'+fmt(d.date)+'</td><td>'+pill(d.state)+'</td><td><button class="btn sm" data-act="view" data-id="'+d.id+'">Ver PDF</button></td></tr>'}).join(''):'<tr><td colspan="6" class="muted">Aún no has subido documentos.</td></tr>')+'</tbody></table></div>';
}

/* ---------- Jefatura ---------- */
/* Profesores que puede ver el usuario: todos, o solo su departamento si es jefe de departamento */
function scope(){var u=S.user;return PROFS.filter(function(p){return !u.dept||p.dept===u.dept})}
/* Documentos pendientes de validar dentro de los profesores visibles */
function pendingDocs(){var ids=scope().map(function(p){return p.id});return DOCS.filter(function(d){return d.state==='pendiente'&&ids.indexOf(d.prof)>-1})}

/* Gráfica de barras horizontales. bars = [[nombre, porcentaje, color], ...] */
function chart(bars){
  var h='<div class="chart">';
  bars.forEach(function(b){h+='<div class="hb"><span class="hl">'+b[0]+'</span><div class="ht"><i style="--p:'+b[1]+';background:'+b[2]+'"></i><em>'+b[1]+'%</em></div></div>'});
  h+='<div class="hb ax"><span></span><div class="axis">'+[0,20,40,60,80,100].map(function(t){return '<u style="--t:'+t+'">'+t+'%</u>'}).join('')+'</div></div></div>';
  return h;
}
/* Resumen de jefatura (V16): cifras, cobertura de indicadores, revisión prioritaria y actividad reciente */
function jefPanel(){
  var L=scope(),n=L.length||1,pend=pendingDocs();
  var pc=function(fn){return Math.round(L.filter(fn).length/n*100)};
  var bars=[['SNI',pc(function(p){return vigente(p.sni)}),'var(--bar-a)'],['PRODEP',pc(function(p){return vigente(p.prodep)}),'var(--bar-b)'],
            ['Proyecto TecNM',pc(function(p){return p.tecnm}),'var(--bar-c)'],['Posgrado',pc(function(p){return p.grado!=='Licenciatura'}),'var(--bar-b)']];
  var por=pend.slice().sort(function(a,b){return a.date<b.date?-1:1}).slice(0,3);
  var rec=DOCS.slice().sort(function(a,b){return a.date<b.date?1:-1}).filter(function(d){return L.some(function(p){return p.id===d.prof})}).slice(0,5);
  return hero('Investigación docente','Actividad académica y seguimiento de evidencias'+(S.user.dept?' · '+S.user.dept:''),pend.length)+
  '<div class="stats"><div class="stat"><b>'+L.length+'</b><span>Profesores</span></div>'+
  '<div class="stat"><b>'+L.filter(function(p){return vigente(p.sni)}).length+'</b><span>SNI vigente</span></div>'+
  '<div class="stat"><b>'+L.filter(function(p){return vigente(p.prodep)}).length+'</b><span>PRODEP vigente</span></div>'+
  '<div class="stat hot"><b>'+(pend.length<10?'0':'')+pend.length+'</b><span>Evidencias por validar</span></div></div>'+
  '<div class="two"><section><h2 class="sec-t">Cobertura de indicadores</h2>'+chart(bars)+'</section>'+
  '<section><h2 class="sec-t">Revisión prioritaria</h2>'+
  (por.length?por.map(function(d){return '<div class="prio">'+DOCICON+'<span class="t"><b>'+prof(d.prof).name+'</b> · '+docCorto(d)+'</span><span class="d">'+fmtCorto(d.date)+'</span>'+pill(d.state)+'</div>'}).join(''):'<p class="muted">No hay evidencias pendientes.</p>')+
  '<button class="more" data-act="nav" data-v="valid">Ver pendientes ›</button></section></div>'+
  '<h2 class="sec-t" style="margin-top:34px">Actividad reciente</h2><div class="tw"><table><thead><tr><th>Profesor</th><th>Departamento</th><th>Apartado</th><th>Cargado</th><th>Estado</th></tr></thead><tbody>'+
  rec.map(function(d){var p=prof(d.prof);return '<tr><td>'+p.name+'</td><td>'+p.dept+'</td><td>'+docCorto(d)+'</td><td>'+fmt(d.date)+'</td><td>'+pill(d.state)+'</td></tr>'}).join('')+'</tbody></table></div>';
}

/* Profesores que cumplen los filtros elegidos */
function filtered(){
  var f=S.f;return scope().filter(function(p){
    return (!f.q||p.name.toLowerCase().indexOf(f.q.toLowerCase())>-1)&&(!f.dept||p.dept===f.dept)&&(!f.carrera||p.carrera===f.carrera)&&(!f.grado||p.grado===f.grado)&&(!f.sexo||p.sexo===f.sexo)&&
      (!f.ind||(f.ind==='SNI'&&vigente(p.sni))||(f.ind==='PRODEP'&&vigente(p.prodep))||(f.ind==='TecNM'&&p.tecnm))});
}
/* Filas de la tabla del directorio */
function rows(){
  var L=filtered();
  return L.length?L.map(function(p){return '<tr><td><button class="linkb" data-act="detail" data-id="'+p.id+'">'+p.name+'</button></td><td>'+p.dept+'</td><td>'+p.grado+'</td><td>'+yn(vigente(p.sni))+'</td><td class="num">'+(p.sni.si?p.sni.fin.slice(0,4):'—')+'</td><td>'+yn(vigente(p.prodep))+'</td><td class="num">'+(p.prodep.si?p.prodep.fin.slice(0,4):'—')+'</td><td>'+yn(p.tecnm)+'</td><td class="num">'+p.arts+'</td></tr>'}).join(''):'<tr><td colspan="9" class="muted">Ningún profesor coincide con los filtros.</td></tr>';
}
/* Lista desplegable de un filtro */
function sel(id,lab,opts,val){return '<div><label for="'+id+'">'+lab+'</label><select id="'+id+'" data-f="'+id.slice(2)+'"><option value="">Todos</option>'+opts.map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>'}).join('')+'</select></div>'}
/* Tarjeta con todos los filtros (se usa en Directorio y en Reportes) */
function filtersCard(){
  var f=S.f;
  return '<div class="card filters"><div><label for="f_q">Buscar por nombre</label><input type="text" id="f_q" data-f="q" value="'+esc(f.q)+'" placeholder="Nombre del profesor"></div>'+
  (S.user.dept?'':sel('f_dept','Departamento',DEPTS,f.dept))+sel('f_carrera','Carrera',CARRERAS,f.carrera)+sel('f_ind','Indicador vigente',['SNI','PRODEP','TecNM'],f.ind)+sel('f_grado','Grado',['Licenciatura','Maestría','Doctorado'],f.grado)+sel('f_sexo','Sexo',['Mujer','Hombre'],f.sexo)+'</div>';
}
/* Directorio: tabla de profesores con filtros (V17) */
function directorio(){
  return hero('Directorio','Filtra y abre el detalle de cada profesor.')+'<div style="height:22px"></div>'+filtersCard()+
  '<div class="tw" style="margin-top:18px"><table><thead><tr><th>Nombre</th><th>Departamento</th><th>Grado</th><th>SNI</th><th class="num">Vig. SNI</th><th>PRODEP</th><th class="num">Vig. PRODEP</th><th>Proyecto TecNM</th><th class="num">Art.</th></tr></thead><tbody id="rows">'+rows()+'</tbody></table></div>';
}
/* Reportes: mismos filtros y botón para copiar el listado (V19) */
function reportes(){
  return hero('Reportes','Elige los filtros y copia el listado para pegarlo en Excel.')+'<div style="height:22px"></div>'+filtersCard()+
  '<div class="card" style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><b id="count">'+filtered().length+'</b> profesores coinciden con los filtros.<div class="note">La descarga directa en Excel y PDF se agrega cuando exista el servidor.</div></div><button class="btn primary" data-act="report">Copiar reporte (CSV)</button></div>';
}
/* Detalle de un profesor con todos sus documentos (V18) */
function detailView(){
  var p=prof(S.detail),g=p.gen||{},ds=DOCS.filter(function(d){return d.prof===p.id});
  return '<div class="head"><div><button class="btn sm" data-act="closeDetail" style="margin-bottom:12px">← Volver</button><h1>'+p.name+'</h1><p class="muted">'+p.dept+' · '+p.carrera+'</p></div></div>'+
  '<div class="stack"><div class="kv"><div><small>Grado</small>'+p.grado+'</div><div><small>Sexo</small>'+p.sexo+'</div><div><small>SNI</small>'+(p.sni.si?'Sí · hasta '+fmt(p.sni.fin):'No')+'</div><div><small>PRODEP</small>'+(p.prodep.si?'Sí · hasta '+fmt(p.prodep.fin):'No')+'</div><div><small>Proyecto TecNM</small>'+(p.tecnm?'Sí':'No')+'</div><div><small>Artículos</small>'+p.arts+'</div>'+(g.correo?'<div><small>Correo</small>'+esc(g.correo)+'</div>':'')+'</div>'+
  '<h2 class="sec-t">Documentos</h2><div class="tw"><table><thead><tr><th>Apartado</th><th>Registro</th><th>Estado</th><th></th></tr></thead><tbody>'+
  (ds.length?ds.map(function(d){return '<tr><td>'+secOf(d.sec).n+'</td><td>'+esc(docTitle(d))+'</td><td>'+pill(d.state)+'</td><td><button class="btn sm" data-act="view" data-id="'+d.id+'">Ver PDF</button></td></tr>'}).join(''):'<tr><td colspan="4" class="muted">Sin documentos.</td></tr>')+'</tbody></table></div></div>';
}
/* Validación de documentos: lista de pendientes y revisión de uno (V20-V21) */
function validView(){
  var L=pendingDocs(),r=S.rev?L.filter(function(d){return d.id===S.rev})[0]:null;
  if(!r&&L.length){r=L[0];S.rev=r.id}
  var left='<div class="card list" style="padding:0;overflow:hidden"><div style="padding:12px 14px;background:var(--sunken);font-weight:700">Pendientes de validación ('+L.length+')</div>'+
   (L.length?L.map(function(d){return '<button data-act="rev" data-id="'+d.id+'"'+(r&&r.id===d.id?' aria-current="true"':'')+'><span><b>'+prof(d.prof).name+'</b><br><small class="muted">'+secOf(d.sec).n+' · '+fmt(d.date)+'</small></span></button>'}).join(''):'<div style="padding:16px" class="muted">No hay documentos pendientes.</div>')+'</div>';
  var right='';
  if(r){var s=secOf(r.sec);
    right='<div class="card stack"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h2>'+prof(r.prof).name+'</h2>'+pill(r.state)+'</div>'+
    '<div class="muted">'+s.n+'</div><div class="kv">'+s.f.map(function(f){return '<div><small>'+f[1]+'</small>'+esc(r.data[f[0]])+'</div>'}).join('')+(r.data.vig_fin?'<div><small>Vigencia</small>'+fmt(r.data.vig_ini)+' a '+fmt(r.data.vig_fin)+'</div>':'')+'</div>'+
    '<div class="pdf"><div><b>'+esc(r.file)+'</b>Aquí se mostrará el PDF para compararlo con lo capturado.</div></div>'+
    '<div><label for="obs">Observaciones (obligatorias al rechazar)</label><textarea id="obs" placeholder="Qué falta o qué corregir"></textarea></div>'+
    (S.err?'<div class="err" role="alert">'+esc(S.err)+'</div>':'')+
    '<div class="actions"><button class="btn warn" data-act="reject">Rechazar</button><button class="btn ok" data-act="approve">Validar</button></div><p class="note">Al validar, el documento queda bloqueado y el profesor ya no puede editarlo.</p></div>';
  }else right='<div class="card muted">Selecciona un documento de la lista.</div>';
  return hero('Validación','Compara el PDF con lo capturado y valida o rechaza.')+'<div style="height:22px"></div><div class="split">'+left+right+'</div>';
}

/* ---------- Animaciones (nuevo) ---------- */
/* Las cifras del resumen "cuentan" desde 0 hasta su valor */
function animaCifras(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.stat b').forEach(function(el){
    var txt=el.textContent,fin=parseInt(txt,10);if(isNaN(fin)||fin===0)return;
    var pad=txt.length>String(fin).length,t0=null,dur=900;
    function paso(t){if(!t0)t0=t;var k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,3),v=Math.round(fin*e);
      el.textContent=(pad&&v<10?'0':'')+v;if(k<1)requestAnimationFrame(paso)}
    el.textContent=pad?'00':'0';requestAnimationFrame(paso);
  });
}
/* Las filas de las tablas aparecen una tras otra */
function escalona(){
  document.querySelectorAll('tbody tr').forEach(function(tr,i){tr.style.animationDelay=Math.min(i*40,480)+'ms'});
}

/* ---------- Render ---------- */
/* Dibuja la pantalla según quién inició sesión y la vista actual.
   Se llama cada vez que cambia el estado S. */
function render(){
  var u=S.user,h='';
  if(!u)h=renderLogin();
  else if(u.role==='prof'){
    h=shell([['perfil','Mi perfil'],['docs','Mis documentos']],S.sec?secView():S.view==='docs'?misDocs():profPanel());
  }else{
    var b=S.detail?detailView():S.view==='consulta'?directorio():S.view==='valid'?validView():S.view==='reportes'?reportes():jefPanel();
    h=shell([['panel','Resumen'],['consulta','Directorio'],['valid','Validación'],['reportes','Reportes']],b);
  }
  $('#app').innerHTML=h;
  animaCifras();
  escalona();
  var m='';
  if(S.preview){var d=DOCS.filter(function(x){return x.id===S.preview})[0];
    m='<div class="modal" data-act="closeView"><div class="card stack" role="dialog" aria-label="Vista del PDF"><div style="display:flex;justify-content:space-between;gap:10px"><h3>'+esc(d.file)+'</h3><button class="btn sm" data-act="closeView">Cerrar</button></div><div class="pdf"><div><b>Vista previa del PDF</b>'+esc(docTitle(d))+'. En el sistema real se abre aquí el archivo guardado en el servidor.</div></div></div></div>'}
  $('#layer').innerHTML=m;
}

/* ---------- Eventos ----------
   Un solo "oyente" de clics: cada botón trae data-act="acción" y aquí se decide qué hacer. */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.dataset.act,id=+el.dataset.id;
  if(a==='closeView'){if(el.classList.contains('modal')&&!e.target.matches('.modal'))return;S.preview=null;render();return}
  if(a==='fill'){var u=USERS[+el.dataset.i];$('#u').value=u.email;$('#pw').value=u.pass;
    document.querySelectorAll('.acct').forEach(function(x){x.classList.toggle('on',x===el)});$('#pw').focus();return}
  if(a==='logout'){S.user=null;S.view='login';S.sec=null;S.detail=null;S.rev=null;render();return}
  if(a==='nav'){S.rev=null;go(el.dataset.v);return}
  if(a==='sec'){S.sec=el.dataset.id;S.edit=null;S.err='';S.fileOk=null;render();window.scrollTo(0,0);return}
  if(a==='back'){S.sec=null;S.edit=null;S.err='';S.fileOk=null;render();return}
  if(a==='edit'){S.edit=id;S.err='';S.fileOk=null;render();window.scrollTo(0,document.body.scrollHeight);return}
  if(a==='cancelEdit'){S.edit=null;S.err='';render();return}
  if(a==='view'){S.preview=id;render();return}
  if(a==='detail'){S.detail=el.dataset.id;render();window.scrollTo(0,0);return}
  if(a==='closeDetail'){S.detail=null;render();return}
  if(a==='rev'){S.rev=id;S.err='';render();return}
  if(a==='approve'||a==='reject'){review(a==='approve');return}
  if(a==='report'){report();return}
});
document.addEventListener('submit',function(e){
  e.preventDefault();
  if(e.target.id==='loginForm'){
    var em=$('#u').value.trim().toLowerCase(),pw=$('#pw').value;
    var u=USERS.filter(function(x){return x.email===em&&x.pass===pw})[0];
    if(!u){S.err='Usuario o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.';render();return}
    S.user=u;S.err='';S.view=u.role==='prof'?'perfil':'panel';render();return}
  if(e.target.id==='secForm')saveSec(new FormData(e.target));
});
/* Actualiza la tabla (o el conteo) sin redibujar toda la pantalla, para no perder el cursor al escribir */
function refrescaFiltros(){var r=$('#rows');if(r)r.innerHTML=rows();var c=$('#count');if(c)c.textContent=filtered().length}
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.name==='tiene'){$('#docFields').hidden=t.value==='no';return}
  if(t.id==='pdf'){
    var f=t.files[0];S.err='';
    if(!f){S.fileOk=null;$('#fileMsg').innerHTML='';return}
    if(!/\.pdf$/i.test(f.name)||(f.type&&f.type!=='application/pdf')){S.fileOk=null;t.value='';$('#fileMsg').innerHTML='<div class="err" role="alert">Archivo no válido: solo se aceptan archivos PDF.</div>';return}
    S.fileOk=f.name;$('#fileMsg').innerHTML='<div class="pill p-validado">Documento cargado: '+esc(f.name)+'</div>';return}
  if(t.dataset&&t.dataset.f!==undefined){S.f[t.dataset.f]=t.value;refrescaFiltros()}
});
document.addEventListener('input',function(e){var t=e.target;if(t.dataset&&t.dataset.f==='q'){S.f.q=t.value;refrescaFiltros()}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&S.preview){S.preview=null;render()}});

/* Guarda lo capturado en un apartado: valida el PDF, crea o edita el registro y lo deja "pendiente" */
function saveSec(fd){
  var s=secOf(S.sec),p=prof(S.user.prof);
  if(s.pdf===false){var g={};s.f.forEach(function(f){g[f[0]]=fd.get(f[0])});p.gen=g;p.name=g.nombre+' '+g.ap1+' '+g.ap2;p.sexo=g.sexo;toast('Datos generales guardados');S.sec=null;render();return}
  if(!S.edit&&fd.get('tiene')==='no'){NOANS[p.id+s.id]=true;toast('Respuesta «No» registrada');S.sec=null;render();return}
  var ed=S.edit?DOCS.filter(function(d){return d.id===S.edit})[0]:null;
  if(!S.fileOk&&!ed){S.err='Falta la evidencia: sube el documento en PDF.';render();return}
  var data={};s.f.forEach(function(f){data[f[0]]=fd.get(f[0])});
  if(s.vig){data.vig_ini=fd.get('vig_ini');data.vig_fin=fd.get('vig_fin');
    if(data.vig_fin<data.vig_ini){S.err='La fecha de fin de vigencia no puede ser anterior a la de inicio.';render();return}}
  var hoyISO=new Date().toISOString().slice(0,10);
  if(ed){ed.data=data;ed.state='pendiente';ed.obs='';if(S.fileOk)ed.file=S.fileOk;ed.date=hoyISO}
  else{DOCS.push({id:NID++,prof:p.id,sec:s.id,state:'pendiente',data:data,file:S.fileOk,obs:'',date:hoyISO});delete NOANS[p.id+s.id]}
  S.edit=null;S.fileOk=null;S.err='';toast('Documento cargado. Queda pendiente de validación.');render();
}
/* Validar o rechazar un documento. Al validar un indicador, actualiza al profesor en el directorio. */
function review(ok){
  var d=DOCS.filter(function(x){return x.id===S.rev})[0],obs=$('#obs').value.trim();
  if(!ok&&!obs){S.err='Escribe qué debe corregir el profesor antes de rechazar.';render();return}
  var L=pendingDocs(),i=L.indexOf(d);
  d.state=ok?'validado':'rechazado';d.obs=ok?'':obs;
  if(ok){var p=prof(d.prof);
    if(d.sec==='ind'){var ind=d.data.indicador;
      if(ind==='SNI')p.sni={si:true,ini:d.data.vig_ini,fin:d.data.vig_fin};
      else if(ind==='PRODEP')p.prodep={si:true,ini:d.data.vig_ini,fin:d.data.vig_fin};
      else p.tecnm=true}
    if(d.sec==='form'&&d.data.tit==='Sí'&&['Maestría','Doctorado'].indexOf(d.data.nivel)>-1)p.grado=d.data.nivel;
    if(d.sec==='prod')p.arts++}
  var R=pendingDocs();S.rev=R.length?R[Math.min(i,R.length-1)].id:null;S.err='';
  toast(ok?'Documento validado y bloqueado':'Documento rechazado. Se avisará al profesor.');render();
}
/* Copia el listado filtrado como CSV para pegarlo en Excel */
function report(){
  var h=['Nombre','Departamento','Grado','SNI','Vig. SNI','PRODEP','Vig. PRODEP','Proyecto TecNM','Artículos'];
  var csv=[h].concat(filtered().map(function(p){return [p.name,p.dept,p.grado,vigente(p.sni)?'Sí':'No',p.sni.si?p.sni.fin.slice(0,4):'',vigente(p.prodep)?'Sí':'No',p.prodep.si?p.prodep.fin.slice(0,4):'',p.tecnm?'Sí':'No',p.arts]})).map(function(r){return r.join(',')}).join('\n');
  var fallo=function(){toast('No se pudo copiar. La descarga en Excel o PDF llegará con el servidor.')};
  try{navigator.clipboard.writeText(csv).then(function(){toast('Reporte copiado. Pégalo en Excel.')},fallo)}catch(x){fallo()}
}
render();