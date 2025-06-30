const tareas = [
    { nombre: "Mantenimiento", subtareas: ["Lubricación", "Inspección", "Ajuste"] },
    { nombre: "Producción", subtareas: ["Montaje", "Verificación"] }
];

const tableBody = document.querySelector("#tareasTable tbody");
const addRowBtn = document.getElementById("addRow");
const saveAllBtn = document.getElementById("saveAll");
const mensajeDiv = document.getElementById("mensaje");

// Utilidad para formato MySQL timestamp
function getMySQLDateTimeString(dateObj) {
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
}

// Función para añadir una nueva fila vacía
function addNewRow() {
    const newRow = document.createElement("tr");
    
    // Columna Tarea (dropdown)
    const tdTarea = document.createElement("td");
    const selectTarea = document.createElement("select");
    selectTarea.className = "task-select";
    selectTarea.innerHTML = '<option value="">Seleccionar tarea</option>';
    tareas.forEach(tarea => {
        const option = document.createElement("option");
        option.value = tarea.nombre;
        option.textContent = tarea.nombre;
        selectTarea.appendChild(option);
    });
    tdTarea.appendChild(selectTarea);
    newRow.appendChild(tdTarea);

    // Columna Subtarea (dropdown)
    const tdSubtarea = document.createElement("td");
    const selectSubtarea = document.createElement("select");
    selectSubtarea.className = "subtask-select";
    selectSubtarea.disabled = true;
    tdSubtarea.appendChild(selectSubtarea);
    newRow.appendChild(tdSubtarea);

    // Hora Inicio (automática)
    const tdHoraInicio = document.createElement("td");
    const inputHoraInicio = document.createElement("input");
    inputHoraInicio.type = "text";
    inputHoraInicio.readOnly = true;
    tdHoraInicio.appendChild(inputHoraInicio);
    newRow.appendChild(tdHoraInicio);

    // Hora Final (automática)
    const tdHoraFinal = document.createElement("td");
    const inputHoraFinal = document.createElement("input");
    inputHoraFinal.type = "text";
    inputHoraFinal.readOnly = true;
    tdHoraFinal.appendChild(inputHoraFinal);
    newRow.appendChild(tdHoraFinal);

    // Comentarios
    const tdComentarios = document.createElement("td");
    const inputComentarios = document.createElement("input");
    inputComentarios.type = "text";
    inputComentarios.placeholder = "Ingresar comentarios";
    tdComentarios.appendChild(inputComentarios);
    newRow.appendChild(tdComentarios);

    // Completado (checkbox)
    const tdCompletado = document.createElement("td");
    const checkCompletado = document.createElement("input");
    checkCompletado.type = "checkbox";
    checkCompletado.className = "check-completed";
    tdCompletado.appendChild(checkCompletado);
    newRow.appendChild(tdCompletado);

    // Eliminar (botón)
    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "delete-btn";
    btnEliminar.innerHTML = "X";
    tdEliminar.appendChild(btnEliminar);
    newRow.appendChild(tdEliminar);

    tableBody.appendChild(newRow);

    // Event listeners
    selectTarea.addEventListener("change", function() {
        const selectedTarea = tareas.find(t => t.nombre === this.value);
        selectSubtarea.innerHTML = "";
        if (selectedTarea) {
            selectSubtarea.disabled = false;
            selectedTarea.subtareas.forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.textContent = sub;
                selectSubtarea.appendChild(option);
            });
            // Registrar hora de inicio en formato MySQL
            inputHoraInicio.value = getMySQLDateTimeString(new Date());
        } else {
            selectSubtarea.disabled = true;
            inputHoraInicio.value = "";
        }
    });

    checkCompletado.addEventListener("change", function() {
        if (this.checked) {
            inputHoraFinal.value = getMySQLDateTimeString(new Date());
        } else {
            inputHoraFinal.value = "";
        }
    });

    btnEliminar.addEventListener("click", function() {
        tableBody.removeChild(newRow);
    });
}

// Función para limpiar el formulario (dejar solo una fila vacía)
function limpiarFormulario() {
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
    addNewRow();
}

// Función para mostrar mensajes
function showMessage(text, type) {
    mensajeDiv.textContent = text;
    mensajeDiv.className = type;
    setTimeout(() => mensajeDiv.textContent = "", 5000);
}

// Función para guardar todas las tareas
async function saveAllTasks() {
    const userEmail = document.getElementById("userEmail").value;
    if (!userEmail) {
        showMessage("Por favor ingrese un email válido", "error");
        return;
    }

    const rows = tableBody.querySelectorAll("tr");
    if (rows.length === 0) {
        showMessage("No hay tareas para guardar", "warning");
        return;
    }

    const tasksData = [];
    let hasErrors = false;

    rows.forEach(row => {
        const task = row.querySelector(".task-select").value;
        const subtask = row.querySelector(".subtask-select").value;
        const startTime = row.querySelector("td:nth-child(3) input").value;
        const endTime = row.querySelector("td:nth-child(4) input").value;
        const comments = row.querySelector("td:nth-child(5) input").value;
        
        if (!task || !subtask) {
            hasErrors = true;
            return;
        }

        tasksData.push({
            email: userEmail,
            task,
            subtask,
            started_at: startTime,
            end_at: endTime,
            comentario: comments
        });
    });

    if (hasErrors) {
        showMessage("Algunas tareas están incompletas", "error");
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/guardar-tareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tasksData)
        });

        const result = await response.json();
        showMessage(result.mensaje, "success");
        if (response.ok) {
            limpiarFormulario();
        }
    } catch (error) {
        showMessage("Error al guardar tareas: " + error.message, "error");
    }
}

// Event Listeners
addRowBtn.addEventListener("click", addNewRow);
saveAllBtn.addEventListener("click", saveAllTasks);
document.getElementById('btnEliminarTodas')?.addEventListener('click', eliminarTodasTareas);

// Añadir fila inicial
addNewRow();


// Función de consulta
document.getElementById('btnConsulta').addEventListener('click', consultarTareas);

async function consultarTareas() {
    const email = document.getElementById('emailConsulta').value;
    
    if (!email) {
        alert('Ingrese un email para consultar');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/consultar-tareas?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.detail || 'Error en la consulta');
        
        mostrarResultados(data.tareas);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function mostrarResultados(tareas) {
    const contenedor = document.getElementById('resultadosConsulta');
    
    if (!tareas || tareas.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron tareas</p>';
        return;
    }
    
    let html = `
    <table class="tabla-resultados">
        <tr>
            <th>Tarea</th>
            <th>Subtarea</th>
            <th>Fecha</th>
            <th>Duración</th>
            <th>Acción</th>
        </tr>`;
    
    tareas.forEach(tarea => {
        const inicio = new Date(tarea.started_at);
        const fin = tarea.end_at ? new Date(tarea.end_at) : null;
        const duracion = fin ? calcularDuracion(inicio, fin) : 'Pendiente';
        
        html += `
        <tr>
            <td>${tarea.task}</td>
            <td>${tarea.subtask}</td>
            <td>${inicio.toLocaleDateString('es-ES')}</td>
            <td>${duracion}</td>
            <td><button onclick="eliminarTarea(${tarea.id})">Eliminar</button></td>
        </tr>`;
    });
    
    html += '</table>';
    contenedor.innerHTML = html;
}

function calcularDuracion(inicio, fin) {
    const minutos = Math.round((fin - inicio) / (1000 * 60));
    return minutos > 60 ? 
        `${Math.floor(minutos / 60)}h ${minutos % 60}m` : 
        `${minutos}m`;
}

// Función para eliminar una tarea individual
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/eliminar-tarea/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error al eliminar');
        }
        
        alert(result.mensaje);
        // Volver a cargar las tareas después de eliminar
        consultarTareas();
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

async function eliminarTodasTareas() {
    const email = document.getElementById('emailConsulta').value;
    
    if (!email) {
        alert('Por favor ingrese un email válido');
        return;
    }
    
    if (!confirm(`¿Está seguro de eliminar TODAS las tareas de ${email}?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/eliminar-todas-tareas?email=${encodeURIComponent(email)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar');
        }
        
        alert(result.mensaje);
        // Limpiar resultados y volver a cargar
        document.getElementById('resultadosConsulta').innerHTML = '';
        consultarTareas(); // Esto volverá a cargar la lista (vacía)
        
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error al eliminar:', error);
    }
}