/* global bootstrap, formatNumber */

if (typeof window.formatNumber !== 'function') {
    window.formatNumber = function(value) {
        return value.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    };
}

function saveDraft() {
    const form = document.getElementById('boqForm');
    const projectName = form.project_name.value.trim() || 'Untitled Project';
    
    const data = {
        id: Date.now(),
        name: projectName,
        timestamp: new Date().toISOString(),
        projectInfo: Object.fromEntries(new FormData(form)),
        categories: []
    };

    document.querySelectorAll('.category-block').forEach(categoryDiv => {
        const category = {
            name: categoryDiv.querySelector('h6').textContent,
            items: []
        };
        categoryDiv.querySelectorAll('tbody tr').forEach(row => {
            const cells = row.querySelectorAll('input');
            category.items.push({
                description: cells[0].value,
                unit: cells[1].value,
                qty: parseFloat(cells[2].value) || 0,
                rate: parseFloat(cells[3].value) || 0
            });
        });
        data.categories.push(category);
    });

    // Get existing drafts
    let drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    
    // Check if draft with same name exists
    const existingIndex = drafts.findIndex(d => d.name === projectName);
    if (existingIndex >= 0) {
        createOverwriteModal(projectName, () => {
            drafts[existingIndex] = data;
            localStorage.setItem('boqDrafts', JSON.stringify(drafts));
            showNotification(`Draft "${projectName}" saved successfully!`, 'success');
            setTimeout(() => location.reload(), 1500);
        });
        return;
    } else {
        drafts.push(data);
    }

    localStorage.setItem('boqDrafts', JSON.stringify(drafts));
    
    // Show success message
    showNotification(`Draft "${projectName}" saved successfully!`, 'success');
    
    // Auto-refresh after saving
    setTimeout(() => {
        location.reload();
    }, 1500);
}

function createOverwriteModal(projectName, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Draft Exists</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Draft "<strong>${projectName}</strong>" already exists.</p>
                    <p>Do you want to overwrite it?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning" id="confirmOverwriteBtn">
                        <i class="bi bi-check-circle me-1"></i> Overwrite
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    document.getElementById('confirmOverwriteBtn').onclick = () => {
        onConfirm();
        modalInstance.hide();
    };
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function loadDraft() {
    // Open draft preview modal instead of directly loading
    openDraftPreview();
}

function viewDraftByIndex(index) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    if (index < 0 || index >= drafts.length) {
        showNotification('Draft not found!', 'error');
        return;
    }
    
    const draft = drafts[index];
    createViewDraftModal(draft);
}

function loadSelectedDraftByIndex(index) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    if (index < 0 || index >= drafts.length) {
        showNotification('Draft not found!', 'error');
        return;
    }
    
    const draft = drafts[index];
    loadSelectedDraft(draft.id); // Use the existing function with ID
}

function deleteDraftByIndex(index) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    if (index < 0 || index >= drafts.length) {
        showNotification('Draft not found!', 'error');
        return;
    }
    
    const draftId = drafts[index].id;
    deleteDraft(draftId); // Use the existing function with ID
}

// Keep the original viewDraft function but make it safer
function viewDraft(draftId) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) {
        showNotification('Draft not found!', 'error');
        return;
    }
    
    createViewDraftModal(draft);
}

// Extract the modal creation to a separate function
function createViewDraftModal(draft) {
    // Create view modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'viewDraftModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title"><i class="bi bi-file-text me-2"></i>${draft.name} - Preview</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6>Project Information</h6>
                            <table class="table table-sm">
                                ${Object.entries(draft.projectInfo).map(([key, value]) => 
                                    value ? `<tr><td><strong>${key.replace(/_/g, ' ')}:</strong></td><td>${value}</td></tr>` : ''
                                ).join('')}
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6>Summary</h6>
                            <p>Categories: ${draft.categories.length}</p>
                            <p>Total Items: ${draft.categories.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
                            <p>Last Saved: ${new Date(draft.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <h6>Categories & Items</h6>
                    ${draft.categories.map(category => `
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0">${category.name}</h6>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Unit</th>
                                            <th>Qty</th>
                                            <th>Rate (₱)</th>
                                            <th>Amount (₱)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${category.items.map(item => {
                                            const amount = (item.rate || 0) * (item.qty || 0);
                                            return `
                                            <tr>
                                                <td>${item.description || ''}</td>
                                                <td>${item.unit || ''}</td>
                                                <td>${item.qty || 0}</td>
                                                <td>${formatNumber(item.rate || 0)}</td>
                                                <td>${formatNumber(amount)}</td>
                                            </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary load-from-view-btn" data-draft-id="${draft.id}">
                        <i class="bi bi-check-circle me-1"></i> Load This Draft
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Add event listener for the Load button
    modal.querySelector('.load-from-view-btn').addEventListener('click', function() {
        const draftId = parseInt(this.getAttribute('data-draft-id'));
        loadSelectedDraft(draftId);
        modalInstance.hide();
    });
    
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}

function openDraftPreview() {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    
    if (drafts.length === 0) {
        showNotification('No saved drafts found.', 'warning');
        return;
    }

    // Create modal for draft preview
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'draftPreviewModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="bi bi-folder2-open me-2"></i>Saved Drafts</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Client</th>
                                    <th>Last Saved</th>
                                    <th>Items</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="draftsTableBody">
                                ${drafts.map((draft, index) => `
                                    <tr data-draft-id="${draft.id}">
                                        <td><strong>${draft.name}</strong></td>
                                        <td>${draft.projectInfo.client_name || 'N/A'}</td>
                                        <td>${new Date(draft.timestamp).toLocaleString()}</td>
                                        <td>${draft.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items</td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary view-draft-btn" data-draft-index="${index}">
                                                    <i class="bi bi-eye"></i> View
                                                </button>
                                                <button class="btn btn-outline-success load-draft-btn" data-draft-index="${index}">
                                                    <i class="bi bi-check-circle"></i> Load
                                                </button>
                                                <button class="btn btn-outline-danger delete-draft-btn" data-draft-index="${index}">
                                                    <i class="bi bi-trash"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-danger" id="clearAllDraftsBtn">
                        <i class="bi bi-trash"></i> Clear All Drafts
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Add event listeners AFTER modal is added to DOM
    setTimeout(() => {
        // View buttons
        modal.querySelectorAll('.view-draft-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-draft-index'));
                const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
                if (drafts[index]) {
                    viewDraftByIndex(index);
                }
            });
        });
        
        // Load buttons
        modal.querySelectorAll('.load-draft-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-draft-index'));
                const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
                if (drafts[index]) {
                    loadSelectedDraftByIndex(index);
                }
            });
        });
        
        // Delete buttons
        modal.querySelectorAll('.delete-draft-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-draft-index'));
                deleteDraftByIndex(index);
            });
        });
        
        // Clear all button
        modal.querySelector('#clearAllDraftsBtn').addEventListener('click', clearAllDrafts);
    }, 100);
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}

// ============ DELETE THE DUPLICATE viewDraft FUNCTION (LINES 300-350) ============
// Remove this entire second viewDraft function:

/*
function viewDraft(draftId) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    // Create view modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'viewDraftModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title"><i class="bi bi-file-text me-2"></i>${draft.name} - Preview</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6>Project Information</h6>
                            <table class="table table-sm">
                                ${Object.entries(draft.projectInfo).map(([key, value]) => 
                                    value ? `<tr><td><strong>${key.replace(/_/g, ' ')}:</strong></td><td>${value}</td></tr>` : ''
                                ).join('')}
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6>Summary</h6>
                            <p>Categories: ${draft.categories.length}</p>
                            <p>Total Items: ${draft.categories.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
                            <p>Last Saved: ${new Date(draft.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <h6>Categories & Items</h6>
                    ${draft.categories.map(category => `
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0">${category.name}</h6>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Unit</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${category.items.map(item => {
                                            const amount = item.rate * item.qty;
                                            return `
                                            <tr>
                                                <td>${item.description}</td>
                                                <td>${item.unit}</td>
                                                <td>${item.qty}</td>
                                                <td>${formatNumber(item.rate)}</td>
                                                <td>${formatNumber(amount)}</td>
                                            </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="loadSelectedDraft(${draftId})" data-bs-dismiss="modal">
                        <i class="bi bi-check-circle me-1"></i> Load This Draft
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}
*/

function loadSelectedDraft(draftId) {
    const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) {
        showNotification('Draft not found!', 'error');
        return;
    }

    // Clear current form
    const form = document.getElementById('boqForm');
    Object.keys(draft.projectInfo).forEach(key => {
        if (form[key]) form[key].value = draft.projectInfo[key] || '';
    });

    // Clear categories container
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    window.categoryCount = 0;

    // Recreate categories
    draft.categories.forEach(cat => {
        window.addCategory();
        const categoryDiv = container.lastElementChild;
        categoryDiv.querySelector('h6').textContent = cat.name;

        cat.items.forEach(item => {
            window.addItemToCategory(parseInt(categoryDiv.dataset.categoryId));
            const row = categoryDiv.querySelector('tbody tr:last-child');
            const inputs = row.querySelectorAll('input');
            inputs[0].value = item.description;
            inputs[1].value = item.unit;
            inputs[2].value = item.qty;
            inputs[3].value = item.rate;
            
            // Trigger calculation for this row
            if (inputs[2]) inputs[2].dispatchEvent(new Event('input'));
        });
    });

    window.calculateTotals();
    
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    });
    
    showNotification(`Draft "${draft.name}" loaded successfully!`, 'success');
}

function deleteDraft(draftId) {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal fade';
    confirmModal.id = 'deleteConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirm Delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this draft?</p>
                    <p class="text-muted small">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn" data-draft-id="${draftId}">
                        <i class="bi bi-trash me-1"></i> Delete Draft
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
    
    const modalInstance = new bootstrap.Modal(confirmModal);
    modalInstance.show();
    
    // Handle delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        const draftIdToDelete = parseInt(this.getAttribute('data-draft-id'));
        performDelete(draftIdToDelete);
        modalInstance.hide();
    });
    
    // Remove modal from DOM when hidden
    confirmModal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(confirmModal);
    });
}

function performDelete(draftId) {    
    let drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
    const draftIndex = drafts.findIndex(d => d.id === draftId);
    
    if (draftIndex >= 0) {
        const draftName = drafts[draftIndex].name;
        drafts.splice(draftIndex, 1);
        localStorage.setItem('boqDrafts', JSON.stringify(drafts));
        
        // Update the preview table
        const row = document.querySelector(`[data-draft-id="${draftId}"]`);
        if (row) row.remove();
        
        showNotification(`Draft "${draftName}" deleted!`, 'warning');
        
        // If no drafts left, close modal
        if (drafts.length === 0) {
            const modalEl = document.getElementById('draftPreviewModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }
    }
}

function clearAllDrafts() {
    // Create confirmation modal for clearing all drafts
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal fade';
    confirmModal.id = 'clearAllConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title"><i class="bi bi-exclamation-triangle-fill me-2"></i>Warning!</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="fw-bold">Are you sure you want to delete ALL saved drafts?</p>
                    <p class="text-danger">This action cannot be undone!</p>
                    <p class="text-muted small">All your saved BOQ drafts will be permanently deleted.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmClearAllBtn">
                        <i class="bi bi-trash-fill me-1"></i> Delete All Drafts
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
    
    const modalInstance = new bootstrap.Modal(confirmModal);
    modalInstance.show();
    
    // Handle clear all confirmation
    document.getElementById('confirmClearAllBtn').addEventListener('click', function() {
        performClearAll();
        modalInstance.hide();
    });
    
    // Remove modal from DOM when hidden
    confirmModal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(confirmModal);
    });
}

function performClearAll() {
    localStorage.removeItem('boqDrafts');
    
    // Close the main preview modal
    const mainModalEl = document.getElementById('draftPreviewModal');
    if (mainModalEl) {
        const mainModal = bootstrap.Modal.getInstance(mainModalEl);
        if (mainModal) mainModal.hide();
    }
    
    showNotification('All drafts have been cleared!', 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Expose globally
window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.openDraftPreview = openDraftPreview;
window.viewDraft = viewDraft;
window.viewDraftByIndex = viewDraftByIndex;
window.loadSelectedDraft = loadSelectedDraft;
window.loadSelectedDraftByIndex = loadSelectedDraftByIndex;
window.deleteDraft = deleteDraft;
window.deleteDraftByIndex = deleteDraftByIndex;
window.clearAllDrafts = clearAllDrafts;
window.showNotification = showNotification;