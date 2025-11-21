const API_BASE = 'https://virsual-api.vercel.app';
let endpointsData = []; // Store endpoints globally for editing

// ==========================================
// 1. CONFIG & HELPERS
// ==========================================

const AVAILABLE_VARS = [
    { label: 'ID (UUID)', value: '{{$randomId}}' },
    { label: 'Name', value: '{{$randomName}}' },
    { label: 'Email', value: '{{$randomEmail}}' },
    { label: 'City', value: '{{$randomCity}}' },
    { label: 'Date', value: '{{$randomDate}}' },
    { label: 'Image URL', value: '{{$randomImage}}' },
    { label: 'Req Body', value: '{{body.field}}' },
    { label: 'URL Param', value: '{{params.id}}' },
    { label: 'Query Param', value: '{{query.key}}' }
];

function getHeaders() {
    const key = document.getElementById('adminKey').value;
    return { 'Content-Type': 'application/json', 'x-admin-key': key };
}

// Render the small buttons to insert variables
function renderVariableChips() {
    const container = document.getElementById('variableChips');
    container.innerHTML = '';

    AVAILABLE_VARS.forEach(v => {
        const btn = document.createElement('button');
        btn.type = "button"; 
        btn.className = "bg-gray-200 hover:bg-blue-100 text-gray-700 hover:text-blue-600 text-[10px] px-2 py-1 rounded border border-gray-300 transition";
        btn.innerText = v.label;
        btn.title = "Insert " + v.value;
        btn.onclick = () => insertAtCursor(v.value);
        container.appendChild(btn);
    });
}

// Helper to insert text into textarea at cursor position
function insertAtCursor(text) {
    const textarea = document.getElementById('responseBody');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    textarea.value = newValue;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}

// ==========================================
// 2. SCHEMA BUILDER UI LOGIC
// ==========================================

function addBodyField() {
    const container = document.getElementById('schemaBuilder');
    const id = Date.now(); 

    const div = document.createElement('div');
    div.className = "flex gap-2 items-center bg-gray-50 p-2 rounded border";
    div.id = `field-${id}`;
    
    div.innerHTML = `
        <input type="text" placeholder="Field Name" class="schema-name w-1/3 p-1 border rounded text-xs">
        <select class="schema-type w-1/3 p-1 border rounded text-xs">
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
        </select>
        <label class="flex items-center text-xs gap-1">
            <input type="checkbox" class="schema-required"> Req?
        </label>
        <button type="button" onclick="removeField('${id}')" class="text-red-500 text-lg leading-none">&times;</button>
    `;
    container.appendChild(div);
}

function removeField(id) {
    document.getElementById(`field-${id}`).remove();
}

function constructJsonSchema() {
    const rows = document.querySelectorAll('#schemaBuilder > div');
    if (rows.length === 0) return null; 

    const schema = {
        type: "object",
        properties: {},
        required: []
    };

    rows.forEach(row => {
        const name = row.querySelector('.schema-name').value.trim();
        const type = row.querySelector('.schema-type').value;
        const isRequired = row.querySelector('.schema-required').checked;

        if (name) {
            schema.properties[name] = { type: type };
            if (isRequired) schema.required.push(name);
        }
    });

    return schema;
}

// ==========================================
// 3. FORM SUBMISSION (CREATE / UPDATE)
// ==========================================

async function handleFormSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('editId').value;
    
    // Gather Data
    const method = document.getElementById('method').value;
    const path = document.getElementById('path').value;
    const statusCode = parseInt(document.getElementById('statusCode').value);
    const delay = parseInt(document.getElementById('delay').value);
    const headersStr = document.getElementById('reqHeaders').value;
    const requiredHeaders = headersStr ? headersStr.split(',').map(h => h.trim()).filter(h => h) : [];
    const bodySchema = constructJsonSchema();

    let responseBody = {};
    try {
        responseBody = JSON.parse(document.getElementById('responseBody').value);
    } catch (err) {
        alert('Error: Invalid JSON in Response Body');
        return;
    }

    const payload = {
        method, path, requiredHeaders, bodySchema,
        response: { statusCode, delay, body: responseBody }
    };

    const url = editId ? `${API_BASE}/_system/endpoints/${editId}` : `${API_BASE}/_system/create-endpoint`;
    const fetchMethod = editId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: fetchMethod,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(editId ? 'API Updated!' : 'API Created!');
            cancelEdit(); 
            loadAll();
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Network Error: ' + err.message);
    }
}

// ==========================================
// 4. EDITING LOGIC
// ==========================================

async function editEndpoint(id) {
    const endpoint = endpointsData.find(ep => ep._id === id);
    if (!endpoint) return;

    // Populate Basic Fields
    document.getElementById('editId').value = endpoint._id;
    document.getElementById('method').value = endpoint.method;
    document.getElementById('path').value = endpoint.path;
    document.getElementById('statusCode').value = endpoint.response.statusCode;
    document.getElementById('delay').value = endpoint.response.delay;
    document.getElementById('responseBody').value = JSON.stringify(endpoint.response.body, null, 2);
    document.getElementById('reqHeaders').value = endpoint.requiredHeaders.join(', ');

    // Populate Schema Builder
    const container = document.getElementById('schemaBuilder');
    container.innerHTML = ''; 
    
    if (endpoint.bodySchema && endpoint.bodySchema.properties) {
        const props = endpoint.bodySchema.properties;
        const reqs = endpoint.bodySchema.required || [];

        Object.keys(props).forEach(key => {
            addBodyField(); 
            const rows = container.children;
            const lastRow = rows[rows.length - 1];
            
            lastRow.querySelector('.schema-name').value = key;
            lastRow.querySelector('.schema-type').value = props[key].type;
            if (reqs.includes(key)) {
                lastRow.querySelector('.schema-required').checked = true;
            }
        });
    }

    // Update UI to "Edit Mode"
    document.getElementById('formTitle').innerText = "Edit API";
    document.getElementById('submitBtn').innerText = "Update API";
    document.getElementById('submitBtn').className = "w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 font-bold";
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('createForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('schemaBuilder').innerHTML = '';
    
    document.getElementById('formTitle').innerText = "Create New API";
    document.getElementById('submitBtn').innerText = "Create Virtual API";
    document.getElementById('submitBtn').className = "w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold";
    document.getElementById('cancelEditBtn').classList.add('hidden');
}

// ==========================================
// 5. API LIST & LOGS
// ==========================================

async function loadEndpoints() {
    try {
        const res = await fetch(`${API_BASE}/_system/endpoints`, { headers: getHeaders() });
        const data = await res.json();
        
        endpointsData = data; // Save for editing

        const list = document.getElementById('endpointList');
        list.innerHTML = '';

        data.forEach(ep => {
            const hasSchema = ep.bodySchema ? '🔒' : '';
            const row = document.createElement('tr');
            row.className = "border-b hover:bg-gray-50";
            row.innerHTML = `
                <td class="p-2 font-bold text-blue-600 text-sm">${ep.method}</td>
                <td class="p-2 font-mono text-sm text-gray-700">${ep.path} <span title="Has Validation">${hasSchema}</span></td>
                <td class="p-2 flex gap-2">
                    <button onclick="editEndpoint('${ep._id}')" class="text-orange-500 text-xs border border-orange-200 px-2 py-1 rounded hover:bg-orange-50">Edit</button>
                    <button onclick="deleteEndpoint('${ep._id}')" class="text-red-500 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                </td>
            `;
            list.appendChild(row);
        });
    } catch(e) { console.error("Error loading endpoints", e); }
}

async function deleteEndpoint(id) {
    if(!confirm('Are you sure you want to delete this API?')) return;
    await fetch(`${API_BASE}/_system/endpoints/${id}`, { method: 'DELETE', headers: getHeaders() });
    loadEndpoints();
}

async function loadLogs() {
    try {
        const res = await fetch(`${API_BASE}/_system/logs`, { headers: getHeaders() });
        const logs = await res.json();

        const container = document.getElementById('logsList');
        container.innerHTML = '';

        logs.forEach(log => {
            const isError = log.responseStatus >= 400;
            const div = document.createElement('div');
            div.className = `p-2 rounded text-xs border mb-2 ${isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`;
            
            div.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="font-bold uppercase">${log.method}</span>
                    <span class="${isError ? 'text-red-700' : 'text-green-700'} font-bold">${log.responseStatus}</span>
                </div>
                <div class="font-mono text-gray-600 truncate" title="${log.path}">${log.path}</div>
                ${log.error ? `<div class="text-red-600 mt-1 italic border-t border-red-200 pt-1">${log.error}</div>` : ''}
                <div class="text-[10px] text-gray-400 mt-1 text-right">${new Date(log.timestamp).toLocaleTimeString()}</div>
            `;
            container.appendChild(div);
        });
    } catch(e) { console.error("Error loading logs", e); }
}

function loadAll() {
    loadEndpoints();
    loadLogs();
}

// ==========================================
// 6. INITIALIZATION
// ==========================================

// Use DOMContentLoaded to ensure HTML is ready before JS runs
window.addEventListener('DOMContentLoaded', () => {
    renderVariableChips();
    loadAll();
    
    // Refresh logs every 3 seconds
    setInterval(loadLogs, 3000);
});