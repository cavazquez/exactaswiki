// Configuration
const REPO_OWNER = 'cavazquez';
const REPO_NAME = 'exactaswiki';
const BRANCH = 'main';

// State
let currentPath = '';

// DOM Elements
const contentEl = document.getElementById('content');
const loadingEl = document.getElementById('loading');
const breadcrumbEl = document.getElementById('breadcrumb-path');

// Initialize the application
function init() {
    loadDirectory('carreras');
    
    // Add global error handler for folder downloads
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', event.reason);
        alert(`Error al descargar la carpeta: ${event.reason.message || 'Error desconocido'}`);
    });
}

// Load directory contents
async function loadDirectory(path) {
    showLoading(true);
    currentPath = path;
    updateBreadcrumb(currentPath);
    
    try {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // If the path doesn't exist, try with a trailing slash
            if (response.status === 404 && !path.endsWith('/')) {
                return loadDirectory(`${path}/`);
            }
            throw new Error(`Error: ${response.status}`);
        }
        
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error loading directory:', error);
        contentEl.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-500">Error al cargar el directorio: ${error.message}</p>
                <button onclick="loadDirectory('carreras')" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Volver al inicio
                </button>
            </div>`;
    } finally {
        showLoading(false);
    }
}

// Display items in the content area
function displayItems(items) {
    if (!Array.isArray(items)) {
        contentEl.innerHTML = '<p class="col-span-full text-center">No se encontraron archivos.</p>';
        return;
    }

    contentEl.innerHTML = items
        .filter(item => item.type === 'dir' || item.name.endsWith('.pdf'))
        .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)
        .map(item => createItemCard(item))
        .join('');
}

// Mapeo de nombres de carpetas a sus respectivos logos y nombres completos
const CARRERAS_INFO = {
    'compu': {
        logo: 'computacion.png',
        nombre: 'Ciencias de la Computación'
    },
    'fisica': {
        logo: 'fisica.png',
        nombre: 'Física'
    },
    'matematica': {
        logo: 'matematica.png',
        nombre: 'Matemática'
    },
    'quimica': {
        logo: 'quimica.png',
        nombre: 'Química'
    },
    'biologia': {
        logo: 'biologia.png',
        nombre: 'Biología'
    }
};

// Base URL para los logos (ajusta según la ubicación de tus logos)
const LOGOS_BASE_URL = 'https://raw.githubusercontent.com/cavazquez/exactaswiki/main/assets/logos/';

// Download a folder as a ZIP file
async function downloadFolderAsZip(folderPath, folderName) {
    try {
        showLoading(true);
        
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // Start the recursive process of adding files to the zip
        await addFolderToZip(zip, folderPath, '');
        
        // Generate the zip file
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Create a download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showLoading(false);
        }, 0);
        
    } catch (error) {
        console.error('Error creating zip file:', error);
        alert(`Error al crear el archivo ZIP: ${error.message}`);
        showLoading(false);
        throw error;
    }
}

// Recursively add folder contents to zip
async function addFolderToZip(zip, folderPath, relativePath) {
    try {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}?ref=${BRANCH}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Error al cargar el directorio: ${response.status}`);
        }
        
        const items = await response.json();
        
        // Process each item in the folder
        for (const item of items) {
            const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
            
            if (item.type === 'dir') {
                // Recursively add subdirectories
                await addFolderToZip(zip, item.path, itemPath);
            } else if (item.type === 'file') {
                // Add files to the zip
                try {
                    const fileResponse = await fetch(item.download_url);
                    if (!fileResponse.ok) throw new Error(`Error al descargar ${item.name}`);
                    
                    const fileBlob = await fileResponse.blob();
                    zip.file(itemPath, fileBlob);
                } catch (fileError) {
                    console.error(`Error al procesar el archivo ${item.name}:`, fileError);
                    // Continue with other files even if one fails
                }
            }
        }
    } catch (error) {
        console.error('Error adding folder to zip:', error);
        throw error;
    }
}

// Create download button for folders
function createDownloadButton(path, name) {
    const button = document.createElement('button');
    button.className = 'download-folder-btn absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100';
    button.title = `Descargar ${name} como ZIP`;
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    `;
    
    // Prevent event propagation to avoid triggering the folder click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFolderAsZip(path, name);
    });
    
    return button;
}

// Create HTML for an item card
function createItemCard(item) {
    const isDir = item.type === 'dir';
    const isPdf = item.name.toLowerCase().endsWith('.pdf');
    const isCarrera = isDir && item.path.split('/').length === 2; // Verifica si es una carpeta de primer nivel en carreras/
    
    const iconSvg = getIconSvg(isDir ? 'folder' : 'file');
    const carreraInfo = isCarrera ? CARRERAS_INFO[item.name.toLowerCase()] : null;
    const logoUrl = carreraInfo ? `${LOGOS_BASE_URL}${carreraInfo.logo}` : null;
    
    // Generate a unique ID for the PDF container
    const pdfId = 'pdf-preview-' + Math.random().toString(36).substr(2, 9);
    
    // Create card HTML
    let cardHTML = `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 h-full flex flex-col relative group" 
             onclick="${isDir ? `loadDirectory('${item.path}')` : `window.open('${item.download_url || item.html_url}', '_blank')'`}">
            ${isDir ? `
                <div class="absolute top-2 right-2">
                    <button class="download-folder-btn bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100" 
                            onclick="event.stopPropagation(); downloadFolderAsZip('${item.path}', '${item.name.replace(/'/g, '\'')}')"
                            title="Descargar ${item.name} como ZIP">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>` : ''}
            ${isCarrera && carreraInfo ? `
                <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                    <div class="text-white text-center p-4">
                        <p class="text-xl font-bold">${carreraInfo.nombre}</p>
                    </div>
                </div>
            ` : ''}
            ${isPdf ? `
                <div id="${pdfId}" class="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <div class="text-center p-4">
                        <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${iconSvg}
                        </svg>
                        <p class="mt-2 text-xs text-gray-500">Cargando vista previa...</p>
                    </div>
                </div>
            ` : isCarrera && logoUrl ? `
                <div class="h-40 bg-gray-50 flex items-center justify-center overflow-hidden p-4 relative">
                    <img src="${logoUrl}" alt="${item.name}" class="max-h-32 max-w-full object-contain">
                </div>
            ` : ''}
            ${!isCarrera ? `
                <div class="p-4 flex-1 flex flex-col">
                    <div class="flex items-start">
                        ${!isPdf ? `
                            <div class="mr-3 text-blue-500 mt-1">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    ${iconSvg}
                                </svg>
                            </div>
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 break-words">
                                ${item.name.replace(/\.\w+$/, '')}
                            </p>
                            <p class="text-xs text-gray-500 mt-1">
                                ${formatDate(item.updated_at)}
                                ${!isDir ? ' • ' + formatFileSize(item.size) : ''}
                            </p>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>`;
        
    // Load PDF preview after a short delay
    if (isPdf) {
        setTimeout(() => {
            const container = document.getElementById(pdfId);
            if (container) {
                loadPdfPreview(pdfId, item.download_url || item.html_url);
            }
        }, 100);
    }
    
    return cardHTML;
}

// Load PDF preview in the given container
async function loadPdfPreview(containerId, pdfUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        // Initialize PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        
        // Create canvas for the preview
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = 160; // Fixed height for consistency
        canvas.width = (canvas.height / viewport.height) * viewport.width;
        
        // Render PDF page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: page.getViewport({ scale: canvas.width / viewport.width })
        };
        
        await page.render(renderContext).promise;
        
        // Clear loading state and show preview
        container.innerHTML = '';
        container.appendChild(canvas);
        
        // Add a subtle overlay for better text contrast
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/20 to-transparent';
        container.appendChild(overlay);
        
    } catch (error) {
        console.error('Error loading PDF preview:', error);
        container.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                <div class="text-center p-4">
                    <svg class="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${getIconSvg('file')}
                    </svg>
                    <p class="mt-2 text-xs text-gray-500">No se pudo cargar la vista previa</p>
                </div>
            </div>`;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper function to get SVG icons
function getIconSvg(icon) {
    const icons = {
        folder: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />',
        file: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
    };
    return icons[icon] || '';
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
}

// Update breadcrumb navigation
function updateBreadcrumb(currentPath) {
    if (!breadcrumbEl) return;
    if (currentPath === '') {
        breadcrumbEl.innerHTML = '';
        return;
    }

    let breadcrumbHtml = '';
    const parts = currentPath.split('/').filter(part => part !== '');
    let pathSoFar = '';

    parts.forEach((part, index) => {
        pathSoFar += (pathSoFar ? '/' : '') + part;
        
        // Add chevron icon before each part except the first one
        if (index > 0) {
            breadcrumbHtml += `
                <li class="flex items-center">
                    <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                    </svg>
                    <a href="#" onclick="loadDirectory('${pathSoFar}')" class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                        ${part}
                    </a>
                </li>`;
        } else {
            breadcrumbHtml += `
                <li class="inline-flex items-center">
                    <a href="#" onclick="loadDirectory('${pathSoFar}')" class="text-sm font-medium text-gray-700 hover:text-blue-600">
                        ${part}
                    </a>
                </li>`;
        }
    });

    breadcrumbEl.innerHTML = breadcrumbHtml;
}

// Toggle loading state
function showLoading(show) {
    loadingEl.style.display = show ? 'block' : 'none';
    contentEl.style.display = show ? 'none' : 'grid';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make loadDirectory available globally for HTML onclick handlers
window.loadDirectory = loadDirectory;
