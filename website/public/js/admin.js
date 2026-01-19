let allUsers = [];
let currentModerationUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    const searchInput = document.getElementById('user-search');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
});

async function loadUsers(searchQuery = '') {
    try {
        const url = searchQuery 
            ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
            : '/api/admin/users';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            allUsers = data.users;
            renderUsers();
        } else {
            showError('Failed to load users');
        }
    } catch (error) {
        showError('Error loading users');
    }
}

function renderUsers() {
    const container = document.getElementById('users-container');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="loading-spinner">
                No users found
            </div>
        `;
        return;
    }
    
    container.innerHTML = allUsers.map(user => {
        const badges = [];
        if (user.is_admin) {
            badges.push('<span class="user-badge badge-admin">Admin</span>');
        }
        if (user.moderationStatus.isLocked) {
            badges.push('<span class="user-badge badge-locked">Locked</span>');
        }
        if (user.moderationStatus.isDisabled) {
            badges.push('<span class="user-badge badge-disabled">Disabled</span>');
        }
        if (user.moderationStatus.isRatelimited) {
            badges.push('<span class="user-badge badge-ratelimited">Ratelimited</span>');
        }
        
        const isModerated = user.moderationStatus.isLocked || 
                           user.moderationStatus.isDisabled || 
                           user.moderationStatus.isRatelimited;
        
        return `
            <div class="user-card">
                <div class="user-card-info">
                    <img src="https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png" 
                         alt="Avatar" class="user-card-avatar">
                    <div class="user-card-details">
                        <h3>${escapeHtml(user.discord_username)}</h3>
                        <div class="user-card-meta">
                            <span>ID: ${user.discord_id}</span>
                            <span>Joined: ${formatDate(user.created_at)}</span>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            ${badges.join(' ')}
                        </div>
                    </div>
                </div>
                <div class="user-card-actions">
                    <button class="btn-moderate" onclick="openModerationModal(${user.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z"/>
                            <path d="M12 1v6m0 0L9 4m3 3l3-3"/>
                        </svg>
                        Moderate
                    </button>
                    ${isModerated ? `
                        <button class="btn-unmoderate" onclick="openUnmoderateModal(${user.id})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            Unmoderate
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function openModerationModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentModerationUser = user;
    
    const modal = document.getElementById('moderate-modal');
    const userInfoCard = document.getElementById('moderate-user-info');
    
    userInfoCard.innerHTML = `
        <img src="https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png" alt="Avatar">
        <div class="user-info-card-details">
            <h4>${escapeHtml(user.discord_username)}</h4>
            <p>Discord ID: ${user.discord_id}</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/admin/moderation-history/${userId}`);
        const data = await response.json();
        
        if (response.ok && data.history.length > 0) {
            const historyContainer = document.getElementById('moderation-history');
            historyContainer.innerHTML = `
                <h4>Moderation History</h4>
                ${data.history.slice(0, 5).map(item => `
                    <div class="history-item ${item.action_type}">
                        <div class="history-header">
                            <span class="history-type">${item.action_type}</span>
                            <span class="history-date">${formatDate(item.created_at)}</span>
                        </div>
                        <div class="history-reason">${escapeHtml(item.reason)}</div>
                        <div class="history-moderator">
                            By: ${escapeHtml(item.moderator_username || 'Unknown')} 
                            <span class="${item.is_active ? 'status-active' : 'status-inactive'}">
                                ${item.is_active ? '(Active)' : '(Inactive)'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            `;
        } else {
            document.getElementById('moderation-history').innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load moderation history');
    }
    
    document.getElementById('action-type').value = '';
    document.getElementById('moderation-reason').value = '';
    document.getElementById('ratelimit-duration').style.display = 'none';
    
    modal.classList.add('active');
}

function handleActionTypeChange() {
    const actionType = document.getElementById('action-type').value;
    const durationContainer = document.getElementById('ratelimit-duration');
    
    if (actionType === 'ratelimit') {
        durationContainer.style.display = 'block';
    } else {
        durationContainer.style.display = 'none';
    }
}

async function confirmModeration() {
    const actionType = document.getElementById('action-type').value;
    const reason = document.getElementById('moderation-reason').value;
    
    if (!actionType) {
        showError('Please select an action type');
        return;
    }
    
    if (!reason.trim()) {
        showError('Please provide a reason for moderation');
        return;
    }
    
    let durationSeconds = null;
    
    if (actionType === 'ratelimit') {
        const days = parseInt(document.getElementById('duration-days').value) || 0;
        const hours = parseInt(document.getElementById('duration-hours').value) || 0;
        const seconds = parseInt(document.getElementById('duration-seconds').value) || 0;
        
        durationSeconds = (days * 86400) + (hours * 3600) + seconds;
        
        if (durationSeconds <= 0) {
            showError('Please specify a duration for ratelimit');
            return;
        }
    }
    
    try {
        const response = await fetch('/api/admin/moderate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentModerationUser.id,
                actionType,
                reason,
                durationSeconds
            })
        });
        
        if (response.ok) {
            closeModerationModal();
            await loadUsers();
            showSuccess('User moderated successfully');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to moderate user');
        }
    } catch (error) {
        showError('Error moderating user');
    }
}

function closeModerationModal() {
    const modal = document.getElementById('moderate-modal');
    modal.classList.remove('active');
    currentModerationUser = null;
}

function openUnmoderateModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentModerationUser = user;
    
    const modal = document.getElementById('unmoderate-modal');
    modal.classList.add('active');
}

async function confirmUnmoderation() {
    const actionType = document.getElementById('unmoderate-action-type').value;
    
    if (!actionType) {
        showError('Please select an action type to remove');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/unmoderate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentModerationUser.id,
                actionType
            })
        });
        
        if (response.ok) {
            closeUnmoderateModal();
            await loadUsers();
            showSuccess('User unmoderated successfully');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to unmoderate user');
        }
    } catch (error) {
        showError('Error unmoderating user');
    }
}

function closeUnmoderateModal() {
    const modal = document.getElementById('unmoderate-modal');
    modal.classList.remove('active');
    currentModerationUser = null;
}

function handleSearch(e) {
    const query = e.target.value.trim();
    loadUsers(query);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

document.getElementById('moderate-modal').addEventListener('click', (e) => {
    if (e.target.id === 'moderate-modal') {
        closeModerationModal();
    }
});

document.getElementById('unmoderate-modal').addEventListener('click', (e) => {
    if (e.target.id === 'unmoderate-modal') {
        closeUnmoderateModal();
    }
});
