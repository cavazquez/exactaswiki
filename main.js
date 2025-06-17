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
                <button onclick="loadDirectory('')" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
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

// Create HTML for an item card
function createItemCard(item) {
    const isDir = item.type === 'dir';
    const icon = isDir ? 'folder' : 'file';
    const clickAction = isDir 
        ? `onclick="loadDirectory('${item.path}')"` 
        : `onclick="window.open('${item.download_url || item.html_url}', '_blank')"`;
    
    return `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer" ${clickAction}>
            <div class="p-4 flex items-center">
                <div class="mr-4 text-blue-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${getIconSvg(icon)}
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${item.name}</p>
                    <p class="text-xs text-gray-500 truncate">${formatDate(item.updated_at)}</p>
                </div>
            </div>
        </div>`;
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
    if (!currentPath) {
        breadcrumbEl.innerHTML = '';
        return;
    }
    
    const parts = currentPath.split('/');
    let breadcrumbHtml = '';
    let pathSoFar = '';
    
    parts.forEach((part, index) => {
        if (!part) return;
        pathSoFar = pathSoFar ? `${pathSoFar}/${part}` : part;
        if (index > 0) breadcrumbHtml += ' / ';
        breadcrumbHtml += `<button onclick="loadDirectory('${pathSoFar}')" class="text-blue-500 hover:underline">${part}</button>`;
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
