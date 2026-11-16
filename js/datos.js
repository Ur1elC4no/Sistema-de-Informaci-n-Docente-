/* ==========================================================
   Datos de ejemplo (todo es ficticio).
   Cuando exista la base de datos, esto se reemplaza por
   consultas al servidor. Mientras tanto vive en memoria.
   ========================================================== */
var DEPTS=['Sistemas y Computación','Ingeniería Industrial','Ciencias Básicas'];
var CARRERAS=['Ing. en Sistemas Computacionales','Ing. Industrial','Ing. en Gestión Empresarial'];

/* Cuentas de prueba (contraseña de todas: 1234) */
var USERS=[
 {email:'profesor@itc.mx',pass:'1234',role:'prof',name:'Ana Torres Ríos',prof:'p1',label:'Profesor'},
 {email:'investigacion@itc.mx',pass:'1234',role:'jef',name:'Jefatura de Investigación',jef:'Investigación',label:'Jefatura de investigación'},
 {email:'docencia@itc.mx',pass:'1234',role:'jef',name:'Jefatura de Docencia',jef:'Docencia',label:'Jefatura de docencia'},
 {email:'depto@itc.mx',pass:'1234',role:'jef',name:'Jefe de Sistemas y Computación',jef:'Departamento',dept:DEPTS[0],label:'Jefe de departamento'}
];

/* Crea un profesor. sni/prodep = {si, ini, fin} (fechas de vigencia); tecnm = tiene proyecto; arts = número de artículos */
function P(id,name,sexo,dept,carrera,grado,sni,prodep,tecnm,arts){return {id:id,name:name,sexo:sexo,dept:dept,carrera:carrera,grado:grado,sni:sni,prodep:prodep,tecnm:tecnm,arts:arts,gen:null}}
var PROFS=[
 P('p1','Ana Torres Ríos','Mujer',DEPTS[0],CARRERAS[0],'Doctorado',{si:true,ini:'2023-01-01',fin:'2027-06-30'},{si:true,ini:'2022-01-01',fin:'2028-12-31'},true,4),
 P('p2','Luis Hernández Soto','Hombre',DEPTS[0],CARRERAS[0],'Maestría',{si:false},{si:true,ini:'2021-01-01',fin:'2026-12-31'},true,2),
 P('p3','Marta Ibarra Vega','Mujer',DEPTS[1],CARRERAS[1],'Doctorado',{si:true,ini:'2024-01-01',fin:'2028-12-31'},{si:false},false,6),
 P('p4','Jorge Salinas León','Hombre',DEPTS[1],CARRERAS[1],'Licenciatura',{si:false},{si:false},false,0),
 P('p5','Elena Ruiz Cano','Mujer',DEPTS[0],CARRERAS[2],'Doctorado',{si:true,ini:'2025-01-01',fin:'2029-12-31'},{si:true,ini:'2023-01-01',fin:'2028-12-31'},true,3),
 P('p6','Raúl Mena Díaz','Hombre',DEPTS[2],CARRERAS[2],'Maestría',{si:false},{si:true,ini:'2022-01-01',fin:'2027-12-31'},false,1)
];
PROFS[0].gen={nombre:'Ana',ap1:'Torres',ap2:'Ríos',sexo:'Mujer',nac:'1984-05-17',correo:'ana.torres@itc.mx'};

/* Apartados del perfil. f = [clave, etiqueta, tipo, opciones].
   pdf:false = el apartado no pide evidencia. vig:true = pide fechas de vigencia. */
var SECS=[
 {id:'gen',n:'Datos generales',d:'Nombre, sexo, fecha de nacimiento y correo.',pdf:false,f:[['nombre','Nombre(s)'],['ap1','Apellido paterno'],['ap2','Apellido materno'],['sexo','Sexo','select',['Mujer','Hombre']],['nac','Fecha de nacimiento','date'],['correo','Correo institucional','email']]},
 {id:'nomb',n:'Nombramiento actual',d:'Plaza, categoría y antigüedad.',f:[['plaza','Plaza'],['cat','Categoría'],['ant','Antigüedad (años)','number']]},
 {id:'form',n:'Formación académica',d:'Licenciatura, maestría y doctorado.',f:[['nivel','Nivel','select',['Licenciatura','Maestría','Doctorado']],['inst','Institución'],['anio','Año','number'],['tit','¿Titulado?','select',['Sí','No']]]},
 {id:'cap',n:'Capacitación docente',d:'Cursos con su constancia.',f:[['curso','Nombre del curso'],['inst','Institución'],['fecha','Fecha','date'],['horas','Horas','number']]},
 {id:'act',n:'Actualización disciplinar',d:'Cursos de tu disciplina.',f:[['curso','Nombre del curso'],['inst','Institución'],['fecha','Fecha','date'],['horas','Horas','number']]},
 {id:'ges',n:'Gestión académica',d:'Cargos y actividades de gestión.',f:[['cargo','Cargo o actividad'],['periodo','Periodo']]},
 {id:'prod',n:'Productos académicos',d:'Artículos de los últimos 5 años.',f:[['titulo','Título del artículo'],['revista','Revista'],['anio','Año','number'],['tipo','Tipo','select',['Divulgación','Difusión','JCR']]]},
 {id:'exp',n:'Experiencia profesional no académica',d:'Empresa, puesto y periodo.',f:[['empresa','Empresa'],['puesto','Puesto'],['periodo','Periodo']]},
 {id:'log',n:'Logros profesionales no académicos',d:'Reconocimientos fuera de la academia.',f:[['desc','Descripción'],['fecha','Fecha','date']]},
 {id:'part',n:'Colegios, cámaras y asociaciones',d:'Participación en organizaciones.',f:[['org','Organización'],['tipo','Tipo de participación'],['periodo','Periodo']]},
 {id:'ind',n:'Indicadores: SNI, PRODEP y Proyecto TecNM',d:'Constancias con fecha de vigencia.',vig:true,f:[['indicador','Indicador','select',['SNI','PRODEP','Proyecto TecNM']],['nivel','Nivel o clave']]}
];

/* Documentos subidos. state: pendiente | validado | rechazado */
var DOCS=[];var NID=1;
/* Agrega un documento de ejemplo a la lista DOCS */
function D(prof,sec,state,data,file,obs,date){DOCS.push({id:NID++,prof:prof,sec:sec,state:state,data:data,file:file,obs:obs||'',date:date||'2026-11-10'})}
D('p1','form','validado',{nivel:'Doctorado',inst:'UNAM',anio:'2014',tit:'Sí'},'titulo_doctorado.pdf','','2026-10-02');
D('p1','cap','rechazado',{curso:'Didáctica de la ingeniería',inst:'TecNM',fecha:'2025-06-12',horas:'40'},'constancia_didactica.pdf','El PDF está cortado, sube la constancia completa.','2026-11-05');
D('p1','ind','pendiente',{indicador:'SNI',nivel:'Nivel I',vig_ini:'2023-01-01',vig_fin:'2027-06-30'},'constancia_sni.pdf','','2026-11-12');
D('p1','prod','pendiente',{titulo:'Modelos de predicción en educación superior',revista:'Revista Mexicana de Computación',anio:'2025',tipo:'Difusión'},'articulo_2025.pdf','','2026-11-12');
D('p3','ind','pendiente',{indicador:'PRODEP',nivel:'Perfil deseable',vig_ini:'2025-01-01',vig_fin:'2028-12-31'},'constancia_prodep.pdf','','2026-11-11');
D('p4','form','pendiente',{nivel:'Licenciatura',inst:'ITC',anio:'2010',tit:'Sí'},'cedula.pdf','','2026-11-09');
D('p6','ind','pendiente',{indicador:'Proyecto TecNM',nivel:'TNM-2026-114'},'oficio_proyecto.pdf','','2026-11-13');
D('p2','form','validado',{nivel:'Maestría',inst:'Universidad de Guanajuato',anio:'2016',tit:'Sí'},'titulo_maestria.pdf','','2026-10-20');
var NOANS={}; /* apartados contestados con «No» */
