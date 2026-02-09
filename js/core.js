/* global bootstrap */

function parseNumber(value) {
    return parseFloat(String(value).replace(/,/g, '')) || 0;
}

function formatNumber(value) {
    return value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// ============ GLOBAL VARIABLES ============
let categoryCount = 0;  // ADD THIS LINE
// ==========================================

const standardCategories = [
    "Concrete Works",
    "Reinforcement Works", 
    "Formworks",
    "Masonry Works",
    "Carpentry Works",
    "Steel Works",
    "Roofing Works",
    "Ceiling Works",
    "Tile Works",
    "Painting Works",
    "Plumbing Works",
    "Electrical Works",
    "Doors & Windows",
    "Flooring Works",
    "Glass & Aluminum Works",
    "Earthworks",
    "Labor Rates",
    "Equipment Rental",
    "Safety & Accessories",
    "Sanitary Works",
    "Landscaping Works",
    "Demolition Works",
    "Waterproofing Works",
    "Insulation Works",
    "Fire Protection Works",
    "Structural Works"
];

const CUSTOM_DATA_STORAGE_KEY = 'boqCustomData';

let customData = {
    categories: [],  // Custom categories users create
    descriptions: [] // Custom descriptions users create
};

function showNotification(message, type = 'info') {
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getAllExistingDescriptions() {
    const descriptions = new Set();
    
    // Get from current BOQ items
    document.querySelectorAll('.item-description').forEach(input => {
        if (input.value) descriptions.add(input.value);
    });
    
    // Get from pricelist
    if (window.CONSTRUCTION_PRICELIST) {
        window.CONSTRUCTION_PRICELIST.labor.forEach(item => descriptions.add(item.description));
        window.CONSTRUCTION_PRICELIST.materials.forEach(item => descriptions.add(item.description));
    }
    
    // Get from saved drafts
    try {
        const drafts = JSON.parse(localStorage.getItem('boqDrafts') || '[]');
        drafts.forEach(draft => {
            draft.categories.forEach(category => {
                category.items.forEach(item => {
                    if (item.description) descriptions.add(item.description);
                });
            });
        });
    } catch (e) {
        console.log('Error loading draft descriptions:', e);
    }
    
    return Array.from(descriptions).sort();
}

// ============ CUSTOM DATA FUNCTIONS ============
function loadCustomData() {
    try {
        const saved = localStorage.getItem(CUSTOM_DATA_STORAGE_KEY);
        if (saved) {
            customData = JSON.parse(saved);
            console.log('Loaded custom data:', customData);
        }
    } catch (e) {
        console.error('Error loading custom data:', e);
    }
}

function saveCustomData() {
    try {
        localStorage.setItem(CUSTOM_DATA_STORAGE_KEY, JSON.stringify(customData));
        console.log('Saved custom data:', customData);
    } catch (e) {
        console.error('Error saving custom data:', e);
    }
}

function getAllCategories() {
    const categories = new Set();
    
    // 1. Add standard categories
    standardCategories.forEach(cat => categories.add(cat));
    
    // 2. Add custom categories
    customData.categories.forEach(cat => categories.add(cat));
    
    // 3. Add from current BOQ (real-time)
    document.querySelectorAll('.category-block h6').forEach(h6 => {
        if (h6.textContent && h6.textContent.trim()) {
            categories.add(h6.textContent.trim());
        }
    });
    
    return Array.from(categories).sort();
}

function getAllDescriptions() {
    const customDescriptions = new Set();
    
    // Add custom descriptions (user-added)
    customData.descriptions.forEach(desc => {
        if (desc && desc.trim()) {
            customDescriptions.add(desc.trim());
        }
    });
    
    // Add from current BOQ items (real-time)
    document.querySelectorAll('.item-description').forEach(input => {
        const value = input.value.trim();
        if (value) {
            // Check if it's NOT in pricelist
            const isInPricelist = window.CONSTRUCTION_PRICELIST && 
                [...window.CONSTRUCTION_PRICELIST.labor, ...window.CONSTRUCTION_PRICELIST.materials]
                .some(item => item.description === value);
            
            if (!isInPricelist) {
                customDescriptions.add(value);
            }
        }
    });
    
    return Array.from(customDescriptions).sort();
}

// ============ DROPDOWN REFRESH FUNCTION ============
function refreshAllDropdowns() {
    console.log('🔄 Refreshing all dropdowns...');
    updateCategoryDropdown();
    updateDescriptionDropdown();
    
    // Also refresh pricelist if modal is open
    if (window.filterPricelist) {
        setTimeout(() => {
            if (document.getElementById('pricelistSearch')) {
                window.filterPricelist();
            }
        }, 100);
    }
}

function initializeDescriptionDatalist() {
    const datalist = document.getElementById('descriptionDatalist');
    if (!datalist) {
        console.error('descriptionDatalist not found for initialization');
        return;
    }
    
    // Clear datalist
    datalist.innerHTML = '';
    
    // Add ALL pricelist items FIRST (one-time)
    if (window.CONSTRUCTION_PRICELIST) {
        const allPricelistItems = [
            ...window.CONSTRUCTION_PRICELIST.labor,
            ...window.CONSTRUCTION_PRICELIST.materials
        ];
        
        // Use Set to avoid duplicates
        const uniqueItems = new Set();
        allPricelistItems.forEach(item => {
            if (item.description && item.description.trim()) {
                uniqueItems.add(item.description.trim());
            }
        });
        
        // Add pricelist items
        Array.from(uniqueItems).sort().forEach(desc => {
            const option = document.createElement('option');
            option.value = desc;
            option.textContent = desc;
            option.setAttribute('data-source', 'pricelist');
            datalist.appendChild(option);
        });
        
        console.log(`✅ Initialized datalist with ${uniqueItems.size} pricelist items`);
    }
}

function updateDescriptionDropdown() {
    const datalist = document.getElementById('descriptionDatalist');
    if (!datalist) {
        console.error('descriptionDatalist not found');
        return;
    }
    
    // Get custom descriptions
    const customDescriptions = getAllDescriptions();
    
    // Remove ONLY custom options (marked with ✩)
    const customOptions = Array.from(datalist.querySelectorAll('option')).filter(opt => {
        return opt.textContent.includes('✩');
    });
    
    customOptions.forEach(opt => opt.remove());
    
    // Add custom descriptions
    customDescriptions.forEach(desc => {
        if (desc && desc.trim()) {
            // Check if this option already exists as pricelist item
            const exists = Array.from(datalist.querySelectorAll('option'))
                .some(opt => opt.value === desc.trim() && !opt.textContent.includes('✩'));
            
            if (!exists) {
                const option = document.createElement('option');
                option.value = desc.trim();
                option.textContent = `${desc.trim()} ✩`;
                option.setAttribute('data-source', 'custom');
                datalist.appendChild(option);
            }
        }
    });
    
    console.log(`📝 Description dropdown updated. Total options: ${datalist.childElementCount}`);
}

function addToDescriptionDatalist(description) {
    const datalist = document.getElementById('descriptionDatalist');
    if (!datalist) return;
    
    // Check if already exists
    const exists = Array.from(datalist.querySelectorAll('option'))
        .some(opt => opt.value === description);
    
    if (!exists) {
        const option = document.createElement('option');
        option.value = description;
        option.textContent = `${description} ✩`;
        option.setAttribute('data-source', 'custom');
        datalist.appendChild(option);
    }
}

function updateCategoryDropdown() {
    const datalist = document.getElementById('categoryOptions');
    if (!datalist) return;

    // Save current input value
    const categoryInput = document.getElementById('newCategoryName');
    const currentValue = categoryInput ? categoryInput.value : '';

    // Clear current options
    datalist.innerHTML = '';
    
    // Get ALL categories
    const allCategories = getAllCategories();
    
    console.log(`📁 Updating category dropdown with ${allCategories.length} categories`);
    
    // Add all categories (standard + custom + current)
    allCategories.forEach(cat => {
        if (cat && cat.trim()) {
            const option = document.createElement('option');
            option.value = cat.trim();
            
            // Mark custom categories with a star
            if (!standardCategories.includes(cat.trim())) {
                option.textContent = `${cat.trim()} ✩`;
            } else {
                option.textContent = cat.trim();
            }
            datalist.appendChild(option);
        }
    });
    
    // Restore input value
    if (categoryInput && categoryInput.value !== currentValue) {
        categoryInput.value = currentValue;
    }
}

function setupCategoryDropdown() {
    const input = document.getElementById('newCategoryName');
    if (!input) return;
    
    // Create datalist if not exists
    let datalist = document.getElementById('categoryOptions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'categoryOptions';
        document.body.appendChild(datalist);
    }
    
    // Load custom data first
    loadCustomData();
    updateCategoryDropdown();
    
    // Link to input
    input.setAttribute('list', 'categoryOptions');
    
    // ============ DESKTOP: RIGHT-CLICK + MOBILE: LONG PRESS ============
    setupCustomItemRemoval(input, 'category');
    // ============ END ============
}

function addCategory() {
    const categoryInput = document.getElementById('newCategoryName');
    let name = categoryInput.value.trim();
    
    // If empty, use a default
    if (!name) {
        name = "General Requirements";
    }
    
    // Don't add duplicate category
    const existingCategories = Array.from(document.querySelectorAll('.category-block h6'))
        .map(h6 => h6.textContent);
    if (existingCategories.includes(name)) {
        showNotification(`Category "${name}" already exists!`, 'warning');
        return;
    }

    // ✅ SAVE CUSTOM CATEGORY IF NEW
    if (!standardCategories.includes(name) && !customData.categories.includes(name)) {
        customData.categories.push(name);
        saveCustomData();
        updateCategoryDropdown();
        showNotification(`New category "${name}" saved for future use!`, 'info');
    }
    
    categoryCount++;
    const container = document.getElementById('categoriesContainer');

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-block border rounded p-3';
    categoryDiv.dataset.categoryId = categoryCount;

    categoryDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
        <h6>${name}</h6>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeCategory(this)">
            <i class="bi bi-trash me-1"></i> Delete Category
        </button>
    </div>
    <div class="table-scroll-container">
        <div class="table-responsive">
            <table class="table table-bordered mb-2">
                <thead class="table-light">
                    <tr>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Rate (₱)</th>
                        <th>Amount (₱)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
    </div>
    </div>
    <div class="text-center mt-2">
        <button type="button" class="btn btn-success btn-sm" onclick="addItemToCategory(${categoryCount})">
            <i class="bi bi-plus-circle me-1"></i> Add Item
        </button>
    </div>
`;
container.appendChild(categoryDiv);
    
    // CLEAR THE INPUT HERE
    categoryInput.value = '';
    
    showNotification(`Category "${name}" added`, 'success');
}

function addItemToCategory(categoryId) {
    const categoryDiv = document.querySelector(`.category-block[data-category-id='${categoryId}']`);
    const tbody = categoryDiv.querySelector('tbody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" 
                   class="form-control item-description" 
                   placeholder="Type or select from list" 
                   list="descriptionDatalist">
        </td>
        <td><input type="text" class="form-control item-unit" placeholder="Unit"></td>
        <td><input type="number" class="form-control item-qty" value="1" min="0" step="0.01"></td>
        <td><input type="number" class="form-control item-rate" value="0" min="0" step="0.01"></td>
        <td><input type="text" class="form-control item-amount" value="0" readonly></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removeItem(this)">Delete</button></td>
    `;
    tbody.appendChild(row);

    // Add event listeners for calculation
    row.querySelectorAll('.item-qty, .item-rate').forEach(input => {
        input.addEventListener('input', calculateItemAmount);
    });

    // Get the description input
    const descInput = row.querySelector('.item-description');
    
    // ============ DESKTOP: RIGHT-CLICK + MOBILE: LONG PRESS ============
    setupCustomItemRemoval(descInput, 'description');
    // ============ END ============
    
    // Existing change event for description (for autofill)
    descInput.addEventListener('change', function() {
        const selectedDesc = this.value.trim();
        
        // If from pricelist, auto-fill unit and rate
        if (window.CONSTRUCTION_PRICELIST && selectedDesc) {
            const allItems = [...window.CONSTRUCTION_PRICELIST.labor, ...window.CONSTRUCTION_PRICELIST.materials];
            const item = allItems.find(i => i.description === selectedDesc);
            
            if (item) {
                row.querySelector('.item-unit').value = item.unit;
                row.querySelector('.item-rate').value = item.rate;
                row.querySelector('.item-qty').dispatchEvent(new Event('input'));
            }
        }

        // ✅ SAVE CUSTOM DESCRIPTION IF NEW
        if (selectedDesc) {
            const isInPricelist = window.CONSTRUCTION_PRICELIST && 
                [...window.CONSTRUCTION_PRICELIST.labor, ...window.CONSTRUCTION_PRICELIST.materials]
                .some(item => item.description === selectedDesc);
            
            // Only save if NOT in pricelist and NOT already saved
            if (!isInPricelist && !customData.descriptions.includes(selectedDesc)) {
                customData.descriptions.push(selectedDesc);
                saveCustomData();
                
                // Add to datalist immediately
                addToDescriptionDatalist(selectedDesc);
                showNotification(`New item "${selectedDesc}" saved for future use!`, 'info');
            }
        }

        // Category suggestion logic (existing code)
        if (selectedDesc) {
            const categoryMap = {
                'manager': 'Preliminaries',
                'engineer': 'Preliminaries',
                'officer': 'Preliminaries',
                'surveyor': 'Preliminaries',
                'laborer': 'Labor',
                'mason': 'Masonry Works',
                'carpenter': 'Carpentry',
                'welder': 'Structural Steel Works',
                'electrician': 'Electrical Works',
                'plumber': 'Plumbing',
                'painter': 'Painting Works',
                'technician': 'Mechanical Works (HVAC, Firefighting)',
                'cement': 'Concrete Works',
                'concrete': 'Concrete Works',
                'steel': 'Structural Steel Works',
                'rebar': 'Structural Steel Works',
                'timber': 'Carpentry',
                'plywood': 'Carpentry',
                'roofing': 'Roofing Works',
                'waterproofing': 'Waterproofing',
                'insulation': 'Insulation',
                'paint': 'Painting Works',
                'tile': 'Tiling',
                'flooring': 'Flooring',
                'pipe': 'Plumbing',
                'electrical': 'Electrical Works',
                'HVAC': 'Mechanical Works (HVAC, Firefighting)',
                'firefighting': 'Mechanical Works (HVAC, Firefighting)',
                'excavator': 'Earthworks',
                'bulldozer': 'Earthworks',
                'truck': 'Earthworks',
                'crane': 'Structural Steel Works',
                'mixer': 'Concrete Works',
                'scaffolding': 'General Requirements',
                'compactor': 'Earthworks',
                'machine': 'General Requirements',
                'tools': 'General Requirements',
                'PPE': 'General Requirements'
            };
    
            const descLower = selectedDesc.toLowerCase();
            let suggestedCategory = '';
    
            for (const [keyword, category] of Object.entries(categoryMap)) {
                if (descLower.includes(keyword)) {
                    suggestedCategory = category;
                    break;
                }
            }
    
            if (suggestedCategory) {
                console.log(`Suggested category for "${selectedDesc}": ${suggestedCategory}`);
            }
        }
    });
    
    calculateTotals();
}

function removeItem(button) {
    button.closest('tr').remove();
    calculateTotals();
}

function removeCategory(button) {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal fade';
    confirmModal.id = 'deleteCategoryConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle me-2"></i>Delete Category
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this category and all its items?</p>
                    <div class="alert alert-warning mt-2">
                        <i class="bi bi-exclamation-circle me-1"></i>
                        All items in this category will be permanently removed.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteCategoryBtn">
                        <i class="bi bi-trash me-1"></i> Delete Category
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
    
    const modalInstance = new bootstrap.Modal(confirmModal);
    modalInstance.show();
    
    document.getElementById('confirmDeleteCategoryBtn').addEventListener('click', function() {
        button.closest('.category-block').remove();
        calculateTotals();
        modalInstance.hide();
        
        if (window.showNotification) {
            showNotification('Category deleted successfully', 'warning');
        }
    });
    
    confirmModal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(confirmModal);
    });
}

function calculateItemAmount() {
    const row = this.closest('tr');
    const qty = parseNumber(row.querySelector('.item-qty').value);
    const rate = parseNumber(row.querySelector('.item-rate').value);
    const amount = rate * qty;
    
    row.querySelector('.item-amount').value = formatNumber(amount);
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;
    document.querySelectorAll('.item-amount').forEach(input => {
        subtotal += parseNumber(input.value);
    });

    const markupRate = parseNumber(document.getElementById('taxRate').value) || 18;
    const markupAmount = subtotal * (markupRate / 100);
    const grandTotal = subtotal + markupAmount;

    document.getElementById('subtotal').textContent = formatNumber(subtotal);
    document.getElementById('taxAmount').textContent = formatNumber(markupAmount);
    document.getElementById('grandTotal').textContent = formatNumber(grandTotal);
}

function refreshPage() {
    if (confirm('Refresh page? Any unsaved changes will be lost.')) {
        location.reload();
    }
}

function refreshWithNotification() {
    if (window.showNotification) {
        window.showNotification('Refreshing page...', 'info');
    }
    
    setTimeout(() => {
        location.reload();
    }, 1000);
}

function showRefreshConfirmation() {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal fade';
    confirmModal.id = 'refreshConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title"><i class="bi bi-arrow-clockwise me-2"></i>Refresh Page</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to refresh the page?</p>
                    <div class="alert alert-warning mt-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Warning:</strong> Any unsaved changes will be lost.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmRefreshBtn">
                        <i class="bi bi-check-circle me-1"></i> Refresh Page
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
    
    const modalInstance = new bootstrap.Modal(confirmModal);
    modalInstance.show();
    
    document.getElementById('confirmRefreshBtn').addEventListener('click', function() {
        modalInstance.hide();
        setTimeout(() => {
            location.reload();
        }, 300);
    });
    
    confirmModal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(confirmModal);
    });
}

function setupCustomItemRemoval(inputElement, type = 'description') {
    let pressTimer = null;
    
    // ============ DESKTOP: RIGHT-CLICK ============
    inputElement.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        handleItemRemoval(this.value.trim(), e, type);
    });
    
    // ============ MOBILE: LONG PRESS ============
    inputElement.addEventListener('touchstart', function(e) {
        // Start long press timer
        pressTimer = setTimeout(() => {
            handleItemRemoval(this.value.trim(), e, type);
            pressTimer = null;
        }, 800); // 800ms = long press
        
        // Prevent default touch behaviors
        e.preventDefault();
    }, { passive: false });
    
    inputElement.addEventListener('touchend', function() {
        // Cancel long press if finger lifted
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
    
    inputElement.addEventListener('touchmove', function() {
        // Cancel long press if finger moves
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
    
    // ============ VISUAL FEEDBACK FOR LONG PRESS ============
    inputElement.addEventListener('touchstart', function() {
        this.style.backgroundColor = '#f0f8ff'; // Light blue background
    });
    
    inputElement.addEventListener('touchend', function() {
        this.style.backgroundColor = ''; // Reset background
    });
    
    inputElement.addEventListener('touchmove', function() {
        this.style.backgroundColor = ''; // Reset background
    });
}

function handleItemRemoval(value, event, type) {
    if (!value) return;
    
    let isCustomItem = false;
    let itemType = '';
    
    if (type === 'description') {
        isCustomItem = customData.descriptions.includes(value);
        itemType = 'item';
    } else if (type === 'category') {
        isCustomItem = !standardCategories.includes(value) && 
                      customData.categories.includes(value);
        itemType = 'category';
    }
    
    if (!isCustomItem) return;
    
    // Create popup modal
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'position-fixed bg-white border rounded shadow p-3';
    
    // Position based on event type
    if (event.type.includes('touch')) {
        // For touch events
        const touch = event.touches[0] || event.changedTouches[0];
        confirmDiv.style.cssText = `
            top: ${touch.clientY}px;
            left: ${touch.clientX}px;
            z-index: 9999;
            min-width: 250px;
            transform: translate(-50%, -120%);
        `;
    } else {
        // For mouse events
        confirmDiv.style.cssText = `
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            z-index: 9999;
            min-width: 250px;
        `;
    }
    
    confirmDiv.innerHTML = `
        <p class="mb-2">Remove ${itemType} "<strong>${value}</strong>" from custom list?</p>
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-danger flex-fill" id="confirmRemoveBtn">
                <i class="bi bi-trash me-1"></i> Remove
            </button>
            <button class="btn btn-sm btn-secondary flex-fill" id="cancelRemoveBtn">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(confirmDiv);
    
    // Remove on confirm
    document.getElementById('confirmRemoveBtn').addEventListener('click', () => {
        if (type === 'description') {
            const index = customData.descriptions.indexOf(value);
            if (index > -1) {
                customData.descriptions.splice(index, 1);
                saveCustomData();
                updateDescriptionDropdown();
                
                // Also remove from datalist immediately
                const datalist = document.getElementById('descriptionDatalist');
                const options = datalist.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value === value && opt.textContent.includes('✩')) {
                        opt.remove();
                    }
                });
                
                showNotification(`"${value}" removed from custom list`, 'warning');
            }
        } else if (type === 'category') {
            const index = customData.categories.indexOf(value);
            if (index > -1) {
                customData.categories.splice(index, 1);
                saveCustomData();
                updateCategoryDropdown();
                
                // Also remove from datalist immediately
                const datalist = document.getElementById('categoryOptions');
                const options = datalist.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value === value && opt.textContent.includes('✩')) {
                        opt.remove();
                    }
                });
                
                showNotification(`"${value}" removed from custom categories`, 'warning');
            }
        }
        document.body.removeChild(confirmDiv);
    });
    
    // Cancel
    document.getElementById('cancelRemoveBtn').addEventListener('click', () => {
        document.body.removeChild(confirmDiv);
    });
    
    // Remove popup if clicking/touching outside
    setTimeout(() => {
        const clickOutsideHandler = (e) => {
            if (!confirmDiv.contains(e.target)) {
                document.body.removeChild(confirmDiv);
                document.removeEventListener('click', clickOutsideHandler);
                document.removeEventListener('touchstart', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
        document.addEventListener('touchstart', clickOutsideHandler);
    }, 100);
}

// Expose globally
window.addCategory = addCategory;
window.addItemToCategory = addItemToCategory;
window.removeItem = removeItem;
window.removeCategory = removeCategory;
window.calculateItemAmount = calculateItemAmount;
window.calculateTotals = calculateTotals;
window.refreshWithNotification = refreshWithNotification;
window.showRefreshConfirmation = showRefreshConfirmation;
window.showNotification = showNotification;
window.refreshPage = refreshPage;
window.getAllExistingDescriptions = getAllExistingDescriptions;
window.updateCategoryDropdown = updateCategoryDropdown;
window.updateDescriptionDropdown = updateDescriptionDropdown;
window.addToDescriptionDatalist = addToDescriptionDatalist;
window.initializeDescriptionDatalist = initializeDescriptionDatalist;
window.refreshAllDropdowns = refreshAllDropdowns;
window.refreshAllDropdowns = refreshAllDropdowns;
window.setupCustomItemRemoval = setupCustomItemRemoval; // NEW
window.handleItemRemoval = handleItemRemoval; // NEW

// Update DOMContentLoaded event:
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('taxRate').addEventListener('input', calculateTotals);
    
    // Load custom data
    loadCustomData();
    
    // Setup category dropdown
    setupCategoryDropdown();
    
    // Initialize description datalist ONCE (pricelist items)
    setTimeout(() => {
        if (window.CONSTRUCTION_PRICELIST) {
            initializeDescriptionDatalist();
            
            // Then update with custom items
            setTimeout(() => {
                updateDescriptionDropdown();
                console.log('✅ Description dropdown loaded with custom items');
            }, 100);
        } else {
            console.log('⚠️ Pricelist not loaded yet, will try again...');
            setTimeout(() => {
                if (window.CONSTRUCTION_PRICELIST) {
                    initializeDescriptionDatalist();
                    updateDescriptionDropdown();
                }
            }, 1000);
        }
    }, 300);
    
    // Refresh dropdowns after everything loads
    setTimeout(() => {
        refreshAllDropdowns();
        console.log('✅ All dropdowns refreshed on page load');
    }, 500);
});