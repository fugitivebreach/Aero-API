let currentApiKeys = [];

document.addEventListener('DOMContentLoaded', () => {
    loadApiKeys();
    
    // Handle regular sidebar links
    const tabs = document.querySelectorAll('.sidebar-link[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Handle dropdown toggle
    const dropdownLinks = document.querySelectorAll('.sidebar-link[data-dropdown]');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdownId = link.dataset.dropdown;
            toggleDropdown(dropdownId, link);
        });
    });
    
    // Handle dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            switchTab(tabName);
            
            // Update active state for dropdown items
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});

function toggleDropdown(dropdownId, link) {
    const menu = document.getElementById(`${dropdownId}-menu`);
    if (!menu) return;
    
    const isOpen = menu.classList.contains('open');
    
    // Close all dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.sidebar-link[data-dropdown]').forEach(l => l.classList.remove('active'));
    
    // Toggle current dropdown
    if (!isOpen) {
        menu.classList.add('open');
        link.classList.add('active');
    }
}

function switchTab(tabName) {
    // Remove active from regular sidebar links
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
        link.classList.remove('active');
    });
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate the selected tab
    const activeLink = document.querySelector(`.sidebar-link[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeLink) activeLink.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

async function loadApiKeys() {
    if (moderationStatus.isLocked || moderationStatus.isDisabled) {
        return;
    }
    
    try {
        const response = await fetch('/api/user/keys');
        const data = await response.json();
        
        if (response.ok) {
            currentApiKeys = data.keys;
            renderApiKeys();
        } else {
            showError('Failed to load API keys');
        }
    } catch (error) {
        showError('Error loading API keys');
    }
}

function renderApiKeys() {
    const container = document.getElementById('api-keys-container');
    
    if (currentApiKeys.length === 0) {
        container.innerHTML = `
            <div class="loading-spinner">
                No API keys yet. Generate your first key to get started!
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentApiKeys.map(key => `
        <div class="api-key-card">
            <div class="api-key-header">
                <div class="api-key-name">${escapeHtml(key.name || 'API Key')}</div>
                <div class="api-key-actions">
                    <button class="btn-icon" onclick="copyToClipboard('${key.api_key}')" title="Copy">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteApiKey(${key.id})" title="Delete">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="api-key-value">${key.api_key}</div>
            <div class="api-key-meta">
                <span>Created: ${formatDate(key.created_at)}</span>
                <span>${key.last_used ? 'Last used: ' + formatDate(key.last_used) : 'Never used'}</span>
            </div>
        </div>
    `).join('');
}

function generateApiKey() {
    if (moderationStatus.isLocked || moderationStatus.isDisabled) {
        showError('Your account is moderated and cannot generate API keys');
        return;
    }
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'Generate API Key';
    modalBody.innerHTML = `
        <div class="form-group">
            <label for="key-name">Key Name (Optional)</label>
            <input type="text" id="key-name" placeholder="My API Key" class="form-input">
        </div>
    `;
    
    modal.classList.add('active');
}

async function confirmGenerate() {
    const keyName = document.getElementById('key-name').value || 'Default';
    
    try {
        const response = await fetch('/api/user/keys/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: keyName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal();
            await loadApiKeys();
            showSuccess('API key generated successfully!');
        } else {
            showError(data.error || 'Failed to generate API key');
        }
    } catch (error) {
        showError('Error generating API key');
    }
}

async function deleteApiKey(keyId) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/user/keys/${keyId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadApiKeys();
            showSuccess('API key deleted successfully');
        } else {
            showError('Failed to delete API key');
        }
    } catch (error) {
        showError('Error deleting API key');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Copied to clipboard!');
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});
