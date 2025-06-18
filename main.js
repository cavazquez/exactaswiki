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

// Mapeo de nombres de carpetas a sus respectivos logos
const LOGO_MAP = {
    'compu': 'computacion.png',
    'fisica': 'fisica.png',
    'matematica': 'matematica.png',
    'quimica': 'quimica.png',
    'biologia': 'biologia.png'
};

// Base URL para los logos (ajusta según la ubicación de tus logos)
const LOGOS_BASE_URL = 'https://raw.githubusercontent.com/cavazquez/exactaswiki/main/assets/logos/';

// Create HTML for an item card
function createItemCard(item) {
    const isDir = item.type === 'dir';
    const isPdf = item.name.toLowerCase().endsWith('.pdf');
    const isCarrera = isDir && item.path.split('/').length === 2; // Verifica si es una carpeta de primer nivel en carreras/
    
    const clickAction = isDir 
        ? `onclick="loadDirectory('${item.path}')"` 
        : `onclick="window.open('${item.download_url || item.html_url}', '_blank')"`;
    
    // Generate a unique ID for the PDF container
    const pdfId = 'pdf-preview-' + Math.random().toString(36).substr(2, 9);
    
    // If it's a PDF, we'll load the preview after the element is created
    if (isPdf) {
        setTimeout(() => loadPdfPreview(pdfId, item.download_url || item.html_url), 100);
    }
    
    const iconSvg = getIconSvg(isDir ? 'folder' : 'file');
    const logoName = LOGO_MAP[item.name.toLowerCase()];
    const logoUrl = logoName ? `${LOGOS_BASE_URL}${logoName}` : null;
    
    return `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 h-full flex flex-col" ${clickAction}>
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
                <div class="h-40 bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                    <img src="${logoUrl}" alt="${item.name}" class="max-h-32 max-w-full object-contain">
                </div>
            ` : ''}
            <div class="p-4 flex-1 flex flex-col">
                <div class="flex items-start">
                    ${!isPdf && !isCarrera ? `
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
        </div>`;
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
