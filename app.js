const navItems = document.querySelectorAll('.nav-item');
const viewTitle = document.getElementById('view-title');
const mainView = document.getElementById('main-view');
const toolModal = document.getElementById('tool-modal');
const toolIframe = document.getElementById('tool-iframe');
const closeModal = document.querySelector('.close-modal');

// --- DATABASE (IndexedDB) for Files ---
const dbName = "EvidenceDB";
let db;

const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
    }
};
request.onsuccess = (e) => { db = e.target.result; };

function saveFileToDB(id, fileData) {
    const transaction = db.transaction(["files"], "readwrite");
    const store = transaction.objectStore("files");
    store.put({ id, ...fileData });
}

async function getFilesFromDB(id) {
    return new Promise((resolve) => {
        const transaction = db.transaction(["files"], "readonly");
        const store = transaction.objectStore("files");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result?.fileList || []);
    });
}

// --- DATA STRUCTURES & LOGIC ENGINE ---

let config = {
    modality: 'presencial', // presencial, virtual, dual, distancia
    processType: 'nuevo'    // nuevo, renovacion, modificacion
};

const getProgramContent = (condId, modality, processType) => {
    const base = {
        denominacion: {
            title: '1. Denominación del Programa',
            theory: 'Según el Decreto 1330, la denominación debe ser coherente con el título otorgado, el nivel de formación y los contenidos curriculares. Se debe evitar nombres publicitarios y asegurar correspondencia con la clasificación CINE-F.',
            evidences: ['Acto interno de aprobación', 'Análisis de coherencia nombre-título-perfil', 'Justificación de novedad (si no está en SNIES)'],
            example: '"Ingeniería de Datos e IA: Responde a la convergencia curricular entre computación y estadística aplicada..."',
            checklist: ['¿Sigue la clasificación CINE?', '¿Es coherente con el perfil de egreso?']
        },
        justificacion: {
            title: '2. Justificación',
            theory: 'Sustentación de la pertinencia del programa en el contexto local, regional y global. Debe explicar por qué es necesario el programa y cuáles son sus rasgos distintivos (valor agregado) frente a la oferta existente.',
            evidences: ['Estudio de mercado/necesidades del entorno', 'Análisis de competencia (SNIES)', 'Justificación de la modalidad y lugar de desarrollo'],
            example: '"Déficit de 400 profesionales reportado por la Secretaría de Salud rural..."',
            checklist: ['¿Usa datos actuales?', '¿Diferencia claramente la oferta?']
        },
        'aspectos-curriculares': {
            title: '3. Aspectos Curriculares',
            theory: 'Es el diseño formativo. Incluye fundamentación teórica, plan de estudios, interdisciplinariedad y, esencialmente, la declaración de los Resultados de Aprendizaje (RA) que el estudiante debe lograr.',
            evidences: ['Malla curricular con créditos', 'Declaración de RAPs y Perfil de Egreso', 'Estrategias de flexibilidad y modelo pedagógico'],
            example: '"RA: Diseña soluciones sostenibles utilizando biotecnología local, evaluado mediante proyectos ABP..."',
            checklist: ['¿Los RAPs son medibles?', '¿Hay flexibilidad (electivas/doble titulación)?']
        },
        'organizacion-actividades': {
            title: '4. Organización de Actividades',
            theory: 'Operatividad del currículo. Define el tiempo de trabajo del estudiante (HAD: Horas Acompañamiento Directo vs HTI: Horas Trabajo Independiente). 1 crédito = 48 horas totales.',
            evidences: ['Mapa de créditos discriminando HAD/HTI', 'Ruta de formación sugerida', 'Mecanismos de seguimiento al estudiante'],
            example: '"Horas totales: 144. HAD: 48, HTI: 96. Seguimiento mediante 3 cortes evaluativos (30/30/40)."',
            checklist: ['¿La relación HAD/HTI es realista?', '¿El seguimiento es continuo?']
        },
        investigacion: {
            title: '5. Investigación e Innovación',
            theory: 'Fomento del pensamiento crítico y la generación de conocimiento. En pregrado se enfatiza la investigación formativa (aprender a investigar mediante semilleros y proyectos).',
            evidences: ['Líneas de investigación activas', 'Relación de semilleros y participantes', 'Productos de docentes vinculados al programa'],
            example: '"Línea de Desarrollo Sostenible: 3 semilleros activos con 15 estudiantes cada uno..."',
            checklist: ['¿Hay participación estudiantil real?', '¿Existen productos verificables (artículos/obras)?']
        },
        'sector-externo': {
            title: '6. Relación Sector Externo',
            theory: 'Estrategias de conexión con la sociedad y el mercado laboral. Incluye extensión, proyección social y el sistema de prácticas profesionales.',
            evidences: ['Convenios de práctica vigentes', 'Proyectos de impacto social o intervención', 'Actividades de educación continua'],
            example: '"Convenios marco con 15 empresas logísticas garantizando 100% de plazas de práctica..."',
            checklist: ['¿Convenios están formalizados?', '¿Hay impacto medible en el entorno?']
        },
        profesores: {
            title: '7. Profesores',
            theory: 'Disponibilidad de un cuerpo docente idóneo (formación y experiencia) y suficiente para atender el número de estudiantes proyectados.',
            evidences: ['Hojas de vida y títulos (Maestría/PhD)', 'Estatuto Profesoral (Vinculación y permanencia)', 'Relación de estudiantes por profesor'],
            example: '"8 docentes TC: 5 con Maestría y 3 con Doctorado. Relación 1:25..."',
            checklist: ['¿Idoneidad específica para el área?', '¿Garantiza estabilidad laboral?']
        },
        'medios-educativos': {
            title: '8. Medios Educativos',
            theory: 'Recursos bibliográficos, bases de datos y plataformas de aprendizaje (LMS) que apoyan el proceso formativo.',
            evidences: ['Inventario bases de datos (ScienceDirect/Scopus)', 'Licencias de software especializado', 'Plataforma LMS operativa'],
            example: '"Acceso remoto a bases de datos y simuladores de bolsa para laboratorios financieros..."',
            checklist: ['¿Actualidad de material bibliográfico?', '¿Suficiencia de licencias?']
        },
        infraestructura: {
            title: '9. Infraestructura Física',
            theory: 'Espacios físicos o virtuales adecuados (aulas, laboratorios, talleres) para el desarrollo de las actividades académicas y el bienestar.',
            evidences: ['Descripción de espacios físicos y planos', 'Convenios de infraestructura compartida', 'Plan de mantenimiento y renovación tecnológica'],
            example: '"Laboratorio de anatomía con mesas de disección virtual y aulas inteligentes híbridas..."',
            checklist: ['¿Cumple normas de seguridad y salud?', '¿Garantiza accesibilidad (rampas/ascensores)?']
        }
    };

    // Personalización por Modalidad (D529/R21795)
    if (modality === 'virtual') {
        base['medios-educativos'].theory = '[MODALIDAD VIRTUAL] El Decreto exige plataforma LMS/LCMS con herramientas sincrónicas/asincrónicas y soporte 24/7. Para programas nuevos, el 15% de créditos debe estar desarrollado y alojado en plataforma.';
        base['medios-educativos'].evidences.push('Contratos de soporte técnico', 'Módulos diseñados (15% contenidos)', 'Protocolos de tutoría virtual');
        base['infraestructura'].theory = '[MODALIDAD VIRTUAL] La infraestructura es técnica: servidores con capacidad de concurrencia, planes de seguridad informática, encriptación y sistemas de monitoreo/proctoring.';
        base['infraestructura'].evidences = ['Pruebas de estrés/carga de servidores', 'Planes de contingencia y backups', 'Sistemas de vigilancia de exámenes'];
    }

    // Personalización por Proceso (D529)
    if (processType === 'renovacion') {
        Object.keys(base).forEach(key => {
            base[key].theory = `[RENOVACIÓN] ${base[key].theory} Foco en resultados e impacto demostrado en los últimos 7 años. Avance en planes de mejoramiento.`;
            base[key].example = `"Durante la vigencia anterior, el programa redujo la deserción en un 15% gracias a..."`;
            base[key].checklist.push('¿Presenta indicadores históricos reales?', '¿Evidencia impacto de la autoevaluación?');
        });
        base['justificacion'].evidences.push('Impacto en graduados (Empleabilidad)', 'Análisis de evolución de matrícula');
    }

    if (processType === 'single-registry') {
        Object.keys(base).forEach(key => {
            base[key].theory = `[REGISTRO ÚNICO] ${base[key].theory} Al solicitar varias modalidades, debe garantizarse la equivalencia de los Resultados de Aprendizaje en todas ellas.`;
            base[key].checklist.push('¿Garantiza equivalencia entre modalidades?', '¿Cubre requisitos de cada infraestructura solicitada?');
        });
        base['medios-educativos'].evidences.push('Estrategia de convergencia tecnológica para múltiples modalidades');
    }

    if (processType === 'modificacion') {
        const sub = config.modSubtype || 'sustancial';
        Object.keys(base).forEach(key => {
            if (sub === 'sustancial') {
                base[key].theory = `[MOD. SUSTANCIAL - D529] ${base[key].theory} Requiere Resolución previa del MEN. Debes demostrar que el cambio mejora o mantiene la calidad.`;
            } else {
                base[key].theory = `[MOD. NO SUSTANCIAL - D529] ${base[key].theory} Solo requiere reporte o implementación inmediata. El trámite finaliza con oficio, no con resolución.`;
            }
        });

        // Condiciones de las que se debe "dar cuenta" según el tipo de cambio
        if (sub === 'sustancial') {
            base['denominacion'].theory += " Foco en coherencia SNIES y justificación de novedad.";
            base['infraestructura'].theory += " Para cambios de lugar de desarrollo, demostrar capacidad instalada.";
        } else {
            base['aspectos-curriculares'].theory += " Para cambios de créditos o plan de estudios, documentar racionalidad académica.";
            base['medios-educativos'].theory += " Para cambios de modalidad (ej: presencial a virtual), demostrar adecuación tecnológica.";
        }
    }

    return base[condId];
};

const institutionalConditions = [
    { id: 'inst-1', title: '1. Selección Estudiantes/Profesores', theory: 'Existencia de reglamentos claros, transparentes y equitativos que rijan la entrada y permanencia.', checklist: ['Transparencia', 'Equidad', 'Normativa Interna'] },
    { id: 'inst-2', title: '2. Arquitectura Administrativa', theory: 'Gobierno institucional, sistemas de información y capacidad de gestión académica y administrativa.', checklist: ['Gobierno Institucional', 'Sistemas de Información'] },
    { id: 'inst-3', title: '3. Cultura de Calidad (SIAC)', theory: 'Sistemas internos de aseguramiento de la calidad, procesos de autoevaluación y planes de mejoramiento continuo.', checklist: ['Mejora Continua', 'Uso de Datos'] },
    { id: 'inst-4', title: '4. Seguimiento a Egresados', theory: 'Mecanismos para evaluar el impacto y desempeño de los graduados en el sector productivo y social.', checklist: ['Impacto Social', 'Red de Egresados'] },
    { id: 'inst-5', title: '5. Bienestar Institucional', theory: 'Programas enfocados en la salud mental, física y académica para prevenir la deserción y fomentar el desarrollo integral.', checklist: ['Prevención Deserción', 'Desarrollo Integral'] },
    { id: 'inst-6', title: '6. Recursos Financieros', theory: 'Suficiencia, gestión y sostenibilidad económica para cumplir con las metas institucionales y de investigación.', checklist: ['Sostenibilidad', 'Capacidad Inversión'] }
];

let currentConditionIndex = 0;
let currentMode = 'program';

// --- VIEW GENERATION ---

const views = {
    dashboard: {
        title: "Centro de Mando Académico",
        content: `
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <h3>Panel de Control</h3>
                    <p>Configura tu proceso para obtener guías personalizadas.</p>
                </div>
                <div class="card action-card" onclick="showConfig('new-program')">
                    <i data-lucide="award"></i>
                    <h4>Trámites de Programa</h4>
                    <p>Nuevo registro, renovación o modificación personalizada.</p>
                </div>
                <div class="card action-card" onclick="startSimulator('institutional')">
                    <i data-lucide="building"></i>
                    <h4>Condiciones Institucionales</h4>
                    <p>Los 6 pilares de la organización educativa.</p>
                </div>
                <div class="card action-card" onclick="switchView('siac-architect')">
                    <i data-lucide="layout"></i>
                    <h4>Arquitecto SIAC</h4>
                    <p>Diseño de interoperabilidad y ciclos de mejora.</p>
                </div>
            </div>
        `
    },
    'siac-architect': {
        title: "Arquitecto SIAC (Estructura de Calidad)",
        content: `
            <div class="stepper-container">
                <div class="box theory-box" style="margin-bottom:2rem">
                    <h5><i data-lucide="layout"></i> Arquitectura del Sistema Interno de Aseguramiento</h5>
                    <p>El SIAC no es un checklist, es la <strong>interoperabilidad</strong> entre datos, decisiones y recursos.</p>
                </div>
                <div class="dashboard-grid" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="card stat-card" style="border-left: 4px solid var(--primary)">
                        <h5>1. Información para Decisiones</h5>
                        <p>Flujo técnico: Datos -> Procesamiento -> Decisión Académica.</p>
                        <textarea style="width:100%; height:80px; margin-top:10px" placeholder="¿Cómo usan los datos para mejorar?"></textarea>
                    </div>
                    <div class="card stat-card" style="border-left: 4px solid var(--accent)">
                        <h5>2. Medición de RAPs</h5>
                        <p>Estructura técnica de evaluación de resultados académicos.</p>
                        <textarea style="width:100%; height:80px; margin-top:10px" placeholder="¿Qué herramientas miden el aprendizaje?"></textarea>
                    </div>
                    <div class="card stat-card" style="border-left: 4px solid var(--warning)">
                        <h5>3. Articulación Presupuestal</h5>
                        <p>Mejoras vinculadas a planeación y finanzas.</p>
                        <textarea style="width:100%; height:80px; margin-top:10px" placeholder="¿Cómo se financia el plan de mejora?"></textarea>
                    </div>
                    <div class="card stat-card" style="border-left: 4px solid var(--danger)">
                        <h5>4. Ciclicidad y Autorregulación</h5>
                        <p>Evidencia de procesos continuos, no estáticos.</p>
                        <textarea style="width:100%; height:80px; margin-top:10px" placeholder="Cronograma de ciclos de calidad..."></textarea>
                    </div>
                </div>
                <div style="margin-top:20px; text-align:right">
                    <button class="primary-btn" onclick="showToast('SIAC Guardado')">Guardar Arquitectura</button>
                </div>
            </div>
        `
    }
};

function showConfig(processKey) {
    const isSingleRegistry = processKey === 'single-registry';
    const isModification = processKey === 'modification';
    viewTitle.textContent = "Configuración del Proceso";

    mainView.innerHTML = `
        <div class="stepper-container" style="max-width: 600px; margin: 0 auto;">
            <h4>Personaliza tu Simulador</h4>
            <p style="color: var(--text-dim); margin-bottom: 2rem;">Ajustaremos las teorías y evidencias según tu contexto.</p>
            
            <div class="input-area">
                <label>Tipo de Trámite:</label>
                <select id="config-process" class="secondary-btn" style="width:100%; background: #0f172a; margin-bottom: 1rem;">
                    <option value="nuevo" ${processKey === 'new-program' ? 'selected' : ''}>Registro Nuevo (Radicación)</option>
                    <option value="renovacion" ${processKey === 'renewal' ? 'selected' : ''}>Renovación de Registro</option>
                    <option value="single-registry" ${processKey === 'single-registry' ? 'selected' : ''}>Registro Único (Varias Modalidades)</option>
                    <option value="modificacion" ${isModification ? 'selected' : ''}>Modificación de Programa</option>
                </select>

                <div id="mod-sub-type-group" style="${isModification ? 'display:block' : 'display:none'}">
                    <label>Tipo de Modificación (D529):</label>
                    <select id="config-mod-type" class="secondary-btn" style="width:100%; background: #0f172a; margin-bottom: 1rem;">
                        <option value="sustancial">Sustancial (Aprobación Previa)</option>
                        <option value="no-sustancial">No Sustancial (Reporte/Inmediata)</option>
                    </select>
                </div>

                <div id="modality-group" style="${isSingleRegistry ? 'display:none' : 'display:block'}">
                    <label>Modalidad de Estudio:</label>
                    <select id="config-modality" class="secondary-btn" style="width:100%; background: #0f172a; margin-bottom: 2rem;">
                        <option value="presencial">Presencial</option>
                        <option value="virtual" ${processKey === 'virtual' ? 'selected' : ''}>Virtual (100%)</option>
                        <option value="dual">Dual</option>
                        <option value="distancia">A Distancia</option>
                        <option value="hibrido">Híbrido / Combinado</option>
                    </select>
                </div>

                <button class="primary-btn" style="width:100%; margin-top: 1rem" onclick="applyConfig()">Comenzar Simulador</button>
            </div>
        </div>
    `;

    // Listeners for UI changes
    const processSelect = document.getElementById('config-process');
    if (processSelect) {
        processSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            document.getElementById('modality-group').style.display = val === 'single-registry' ? 'none' : 'block';
            document.getElementById('mod-sub-type-group').style.display = val === 'modificacion' ? 'block' : 'none';
        });
    }
}

function applyConfig() {
    config.processType = document.getElementById('config-process').value;
    config.modality = document.getElementById('config-modality').value;

    // Save to shared state for SACES coherence
    localStorage.setItem('rc_shared_modality', config.modality);
    localStorage.setItem('rc_shared_process', config.processType);
    // Captura subtipo de modificación si aplica
    if (config.processType === 'modificacion') {
        config.modSubtype = document.getElementById('config-mod-type').value;
    }
    startSimulator('program');
}

function startSimulator(mode) {
    currentMode = mode;
    currentConditionIndex = 0;
    renderCondition();
}

async function renderCondition() {
    let list = currentMode === 'program' ?
        ['denominacion', 'justificacion', 'aspectos-curriculares', 'organizacion-actividades', 'investigacion', 'sector-externo', 'profesores', 'medios-educativos', 'infraestructura'] :
        institutionalConditions.map(c => c.id);

    // Si es modificación, el usuario suele enfocarse solo en lo que cambia
    // Pero por diseño pedagógico mostraremos todas, resaltando la relevancia.
    // Opcional: Filtrar si el usuario lo pide, por ahora mantenemos el flujo completo.

    const condId = list[currentConditionIndex];
    let cond;

    if (currentMode === 'program') {
        cond = getProgramContent(condId, config.modality, config.processType);
    } else {
        cond = institutionalConditions.find(c => c.id === condId);
        cond.theory = 'Sustentación institucional de capacidad para soportar programas académicos.';
        cond.checklist = ['Suficiencia', 'Idoneidad', 'Vigencia'];
    }

    viewTitle.textContent = currentMode === 'program' ?
        `Simulador: ${config.processType.toUpperCase()} - ${config.modality.toUpperCase()}` :
        "Condiciones Institucionales";

    mainView.innerHTML = `
        <div class="stepper-container">
            <div class="stepper-header">
                <h4>${cond.title || cond.id}</h4>
                <div class="condition-progress">
                    ${list.map((_, i) => `<div class="progress-dot ${i === currentConditionIndex ? 'active' : (i < currentConditionIndex ? 'done' : '')}"></div>`).join('')}
                </div>
            </div>

            <div class="pedagogical-grid">
                <div class="column">
                    <div class="box theory-box">
                        <h5><i data-lucide="help-circle"></i> Explicación Teórica</h5>
                        <p>${cond.theory}</p>
                    </div>
                    <div class="box evidence-box">
                        <h5><i data-lucide="file-text"></i> Evidencias Requeridas</h5>
                        <ul>${(cond.evidences || ['Documentación legal', 'Actas']).map(e => `<li>${e}</li>`).join('')}</ul>
                    </div>
                </div>
                <div class="column">
                    <div class="box example-box">
                        <h5><i data-lucide="sparkles"></i> Ejemplo Real (IA)</h5>
                        <p><em>${cond.example || 'Ejemplo técnico contextualizado...'}</em></p>
                    </div>
                    <div class="box eval-box">
                        <h5><i data-lucide="check-square"></i> Instrumento de Evaluación</h5>
                        <ul>${(cond.checklist || ['Criterio de veracidad']).map(c => `<li>${c}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>

            <div class="input-area">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label>Tu Redacción para el Documento:</label>
                    ${condId === 'aspectos-curriculares' ? '<button class="tool-btn" style="margin-top:0; padding:4px 8px; font-size:0.75rem" onclick="importFromTool(\'raps\')">Importar RAPs Diseñados</button>' : ''}
                    ${condId === 'organizacion-actividades' ? '<button class="tool-btn" style="margin-top:0; padding:4px 8px; font-size:0.75rem" onclick="importFromTool(\'credits\')">Importar Cálculos de Créditos</button>' : ''}
                </div>
                <textarea id="user-text" placeholder="Inicia la redacción aquí..."></textarea>
                
                <div class="upload-section" id="upload-zone">
                    <i data-lucide="upload-cloud" class="upload-icon"></i>
                    <p>Carga tus evidencias para esta sección.</p>
                    <input type="file" id="file-input" multiple hidden>
                    <div class="file-list" id="attached-files"></div>
                </div>

                <div id="feedback-panel" class="feedback-panel">
                    <div class="feedback-header">
                        <h5><i data-lucide="bot"></i> Feedback IA Contextual</h5>
                        <span class="score-badge" id="ai-score">0/100</span>
                    </div>
                    <p id="ai-text"></p>
                </div>
            </div>

            <div class="simulator-actions">
                <button class="secondary-btn" onclick="${currentConditionIndex === 0 ? 'switchView(\'dashboard\')' : 'prevCondition()'}">
                    Volver
                </button>
                <div class="main-actions">
                    <button class="primary-btn" style="background: var(--accent); margin-right: 10px;" onclick="getAIFeedback()">Analizar con IA</button>
                    <button class="primary-btn" onclick="nextCondition()">
                        ${currentConditionIndex === list.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup File Upload
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileListEl = document.getElementById('attached-files');

    if (uploadZone) uploadZone.onclick = () => fileInput.click();
    if (fileInput) fileInput.onchange = (e) => handleFiles(e.target.files, condId, fileListEl);

    // Load saved data
    const savedText = localStorage.getItem(`rc_text_${condId}`);
    if (savedText) document.getElementById('user-text').value = savedText;

    const savedFiles = await getFilesFromDB(condId);
    renderFiles(savedFiles, fileListEl, condId);

    if (window.lucide) window.lucide.createIcons();
}

// --- HELPERS ---

async function handleFiles(files, condId, listEl) {
    const currentFiles = await getFilesFromDB(condId);
    for (let f of files) {
        currentFiles.push({ name: f.name, size: f.size });
    }
    saveFileToDB(condId, { fileList: currentFiles });
    renderFiles(currentFiles, listEl, condId);
    showToast(`${files.length} archivo(s) adjuntado(s)`);
}

function renderFiles(files, listEl, condId) {
    if (!listEl) return;
    listEl.innerHTML = files.map((f, i) => `
        <div class="file-chip">
            <i data-lucide="file"></i> ${f.name}
            <i data-lucide="x" onclick="removeFile('${condId}', ${i}, this)"></i>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

async function removeFile(condId, index, el) {
    const files = await getFilesFromDB(condId);
    files.splice(index, 1);
    saveFileToDB(condId, { fileList: files });
    el.parentElement.remove();
}

function prevCondition() {
    saveCurrent();
    currentConditionIndex--;
    renderCondition();
}

// Tool Modal Controllers
function openTool(toolId) {
    if (!toolModal) return;
    toolModal.classList.remove('hidden');
    if (toolId === 'rap') {
        toolIframe.src = '../rap-designer/index.html';
    } else if (toolId === 'credit') {
        toolIframe.src = '../credit-calculator/index.html';
    } else if (toolId === 'saces') {
        toolIframe.src = '../saces-trainer/index.html';
    }
}

function nextCondition() {
    saveCurrent();
    const list = currentMode === 'program' ? 9 : 6;
    if (currentConditionIndex < list - 1) {
        currentConditionIndex++;
        renderCondition();
    } else {
        generateSummary();
    }
}

function importFromTool(type) {
    const textEl = document.getElementById('user-text');
    if (!textEl) return;

    if (type === 'raps') {
        const raps = JSON.parse(localStorage.getItem('rc_shared_raps') || '[]');
        if (raps.length === 0) {
            showToast("No hay RAPs diseñados aún.");
            return;
        }
        const rapText = "\n\nRESULTADOS DE APRENDIZAJE PROGRAMADOS:\n" + raps.map((r, i) => `${i + 1}. ${r}`).join('\n');
        textEl.value += rapText;
    } else {
        const credits = localStorage.getItem('rc_shared_credits');
        const had = localStorage.getItem('rc_shared_had');
        const hti = localStorage.getItem('rc_shared_hti');
        if (!credits) {
            showToast("No hay cálculos de créditos guardados.");
            return;
        }
        const creditText = `\n\nESTRUCTURA DE CRÉDITOS:\n- Créditos Totales: ${credits}\n- Horas Acompañamiento (HAD): ${had}\n- Horas Independientes (HTI): ${hti}`;
        textEl.value += creditText;
    }
    showToast("Datos importados con éxito");
}

function openTool(tool) {
    if (tool === 'evaluator') {
        renderInMainView(`
            <iframe src="../authentic-evaluator/index.html" style="width:100%; height:90vh; border:none; border-radius:15px;"></iframe>
        `);
    } else if (tool === 'secretaria') {
        renderInMainView(`
            <iframe src="../authentic-evaluator/progress.html" style="width:100%; height:90vh; border:none; border-radius:15px;"></iframe>
        `);
    }
}

function saveCurrent() {
    const textEl = document.getElementById('user-text');
    if (!textEl) return;
    const list = currentMode === 'program' ?
        ['denominacion', 'justificacion', 'aspectos-curriculares', 'organizacion-actividades', 'investigacion', 'sector-externo', 'profesores', 'medios-educativos', 'infraestructura'] :
        institutionalConditions.map(c => c.id);
    const condId = list[currentConditionIndex];
    localStorage.setItem(`rc_text_${condId}`, textEl.value);
}

function getAIFeedback() {
    const textEl = document.getElementById('user-text');
    if (!textEl) return;
    const text = textEl.value;
    const panel = document.getElementById('feedback-panel');
    const scoreEl = document.getElementById('ai-score');
    const feedbackEl = document.getElementById('ai-text');

    panel.style.display = 'block';
    let score = 50;
    let feedback = `Análisis para ${config.modality.toUpperCase()} en ${config.processType.toUpperCase()}: `;

    if (config.modality === 'virtual' && !text.toLowerCase().includes('plataforma')) feedback += "Debes mencionar la plataforma LMS necesaria para virtualidad. ";
    if (config.processType === 'renovacion' && !text.toLowerCase().includes('avance')) feedback += "Falta enfoque en los avances de la vigencia anterior. ";

    scoreEl.textContent = `${score}/100`;
    feedbackEl.textContent = feedback || "Excelente redacción contextualizada.";
}

function generateSummary() {
    showToast("¡Proceso Finalizado!");
    switchView('dashboard');
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function switchView(viewKey) {
    if (views[viewKey]) {
        mainView.innerHTML = views[viewKey].content;
        viewTitle.textContent = views[viewKey].title;
    } else if (viewKey === 'new-program' || viewKey === 'renewal' || viewKey === 'virtual' || viewKey === 'modification' || viewKey === 'single-registry') {
        showConfig(viewKey);
    } else if (viewKey === 'institutional') {
        startSimulator('institutional');
    }

    navItems.forEach(item => item.classList.toggle('active', item.dataset.view === viewKey));
    if (window.lucide) window.lucide.createIcons();
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
    });
});

switchView('dashboard');

// Modal Closure Handlers
function closeModalFunc() {
    if (toolModal) {
        toolModal.classList.add('hidden');
        toolIframe.src = '';
    }
}

if (closeModal) {
    closeModal.onclick = closeModalFunc;
}

// Close on backdrop click
toolModal.onclick = (e) => {
    if (e.target === toolModal) closeModalFunc();
};

// Keyboard listener for main window
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !toolModal.classList.contains('hidden')) {
        closeModalFunc();
    }
});

// Listener for messages from iframes (ESC key inside them)
window.addEventListener('message', (e) => {
    if (e.data === 'close-modal') {
        closeModalFunc();
    }
});
