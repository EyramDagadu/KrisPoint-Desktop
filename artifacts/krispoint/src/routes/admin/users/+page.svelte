<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authState, permissions } from '$lib/stores/authStore.js';
    
    let users = [];
    let roles = [];
    let loading = true;
    let error = '';
    let searchQuery = '';
    let selectedRole = '';
    let showCreateModal = false;
    let showEditModal = false;
    let editingUser = null;
    
    let newUser = {
        username: '',
        password: '',
        fullName: '',
        email: '',
        roleId: null,
        title: 'Dr.',
        specialty: 'Radiology',
        department: ''
    };
    
    const titles = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Miss'];
    
    $: filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery || 
            user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !selectedRole || user.roleName === selectedRole;
        return matchesSearch && matchesRole;
    });
    
    $: canManageUsers = $permissions?.includes('users.manage');
    $: canDeleteUsers = $permissions?.includes('users.delete');
    
    let showDeleteModal = false;
    let deletingUser = null;
    let showResetPasswordModal = false;
    let resetPasswordUser = null;
    let temporaryPassword = '';
    let resetPasswordLoading = false;
    
    onMount(async () => {
        if (!$authState.isAuthenticated) {
            goto('/auth');
            return;
        }
        
        if (!canManageUsers) {
            goto('/');
            return;
        }
        
        await loadData();
    });
    
    async function loadData() {
        loading = true;
        error = '';
        
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch('/api/admin/users', {
                    credentials: 'include'
                }),
                fetch('/api/auth/roles')
            ]);
            
            const usersData = await usersRes.json();
            const rolesData = await rolesRes.json();
            
            if (usersData.success) {
                users = usersData.users;
            } else {
                error = usersData.error || 'Failed to load users';
            }
            
            if (rolesData.success) {
                roles = (rolesData.roles || []).filter(r => r.name !== 'owner');
            }
        } catch (err) {
            console.error('Load data error:', err);
            error = 'Failed to load data';
        } finally {
            loading = false;
        }
    }
    
    async function createUser() {
        if (!newUser.username || !newUser.password || !newUser.fullName || !newUser.roleId) {
            error = 'Please fill in all required fields';
            return;
        }
        
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });
            
            const data = await res.json();
            
            if (data.success) {
                showCreateModal = false;
                resetNewUser();
                await loadData();
            } else {
                error = data.error || 'Failed to create user';
            }
        } catch (err) {
            console.error('Create user error:', err);
            error = 'Failed to create user';
        }
    }
    
    async function updateUser() {
        if (!editingUser) return;
        
        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: editingUser.fullName,
                    email: editingUser.email,
                    roleId: editingUser.roleId,
                    title: editingUser.title,
                    specialty: editingUser.specialty,
                    department: editingUser.department
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                showEditModal = false;
                editingUser = null;
                await loadData();
            } else {
                error = data.error || 'Failed to update user';
            }
        } catch (err) {
            console.error('Update user error:', err);
            error = 'Failed to update user';
        }
    }
    
    async function toggleUserStatus(userId) {
        try {
            const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                await loadData();
            } else {
                error = data.error || 'Failed to toggle user status';
            }
        } catch (err) {
            console.error('Toggle status error:', err);
            error = 'Failed to toggle user status';
        }
    }
    
    function openEditModal(user) {
        editingUser = { ...user };
        showEditModal = true;
    }
    
    function resetNewUser() {
        newUser = {
            username: '',
            password: '',
            fullName: '',
            email: '',
            roleId: null,
            title: 'Dr.',
            specialty: 'Radiology',
            department: ''
        };
    }
    
    function openDeleteModal(user) {
        deletingUser = user;
        showDeleteModal = true;
    }
    
    async function deleteUser() {
        if (!deletingUser) return;
        
        try {
            const res = await fetch(`/api/users/${deletingUser.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                showDeleteModal = false;
                deletingUser = null;
                await loadData();
            } else {
                error = data.error || 'Failed to delete user';
            }
        } catch (err) {
            console.error('Delete user error:', err);
            error = 'Failed to delete user';
        }
    }
    
    function openResetPasswordModal(user) {
        resetPasswordUser = user;
        temporaryPassword = '';
        showResetPasswordModal = true;
    }
    
    async function resetUserPassword() {
        if (!resetPasswordUser) return;
        
        resetPasswordLoading = true;
        error = '';
        
        try {
            const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                temporaryPassword = data.temporaryPassword;
            } else {
                error = data.error || 'Failed to reset password';
                showResetPasswordModal = false;
            }
        } catch (err) {
            console.error('Reset password error:', err);
            error = 'Failed to reset password';
            showResetPasswordModal = false;
        } finally {
            resetPasswordLoading = false;
        }
    }
    
    function closeResetPasswordModal() {
        showResetPasswordModal = false;
        resetPasswordUser = null;
        temporaryPassword = '';
    }
    
    function formatDate(date) {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function getRoleBadgeClass(roleName) {
        switch (roleName) {
            case 'admin': return 'badge-admin';
            case 'radiologist': return 'badge-radiologist';
            case 'resident': return 'badge-resident';
            case 'front_desk': return 'badge-frontdesk';
            default: return 'badge-default';
        }
    }
</script>

<svelte:head>
    <title>User Management - KrisPoint Admin</title>
</svelte:head>

<div class="admin-container">
                <div class="page-header">
                    <button class="btn-primary" on:click={() => showCreateModal = true}>
                        <span class="btn-icon">+</span>
                        Add New User
                    </button>
                </div>
                
                {#if error}
                    <div class="error-banner">
                        <span class="error-icon">!</span>
                        {error}
                        <button class="dismiss-btn" on:click={() => error = ''}>Dismiss</button>
                    </div>
                {/if}
                
                <div class="filters-bar">
                    <div class="search-box">
                        <input 
                            type="text" 
                            placeholder="Search users..."
                            bind:value={searchQuery}
                        />
                    </div>
                    <select bind:value={selectedRole} class="filter-select">
                        <option value="">All Roles</option>
                        {#each roles as role}
                            <option value={role.name}>{role.displayName}</option>
                        {/each}
                    </select>
                </div>
                
                {#if loading}
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading users...</p>
                    </div>
                {:else}
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Last Login</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each filteredUsers as user}
                                    <tr class:inactive={!user.isActive}>
                                        <td class="user-cell">
                                            <div class="user-avatar" class:deleted={user.deletedAt}>
                                                {user.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div class="user-info">
                                                <span class="user-name" class:deleted={user.deletedAt}>
                                                    {user.title} {user.fullName}{#if user.deletedAt} *{/if}
                                                </span>
                                                <span class="user-username">@{user.username}</span>
                                                {#if user.email}
                                                    <span class="user-email">{user.email}</span>
                                                {/if}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="role-badge {getRoleBadgeClass(user.roleName)}">
                                                {user.roleDisplayName}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="department-text">
                                                {user.department || '-'}
                                            </span>
                                            {#if user.specialty && user.specialty !== 'Radiology'}
                                                <span class="specialty-text">{user.specialty}</span>
                                            {/if}
                                        </td>
                                        <td class="date-cell">
                                            {formatDate(user.lastLoginAt)}
                                        </td>
                                        <td>
                                            {#if user.deletedAt}
                                                <span class="status-badge deleted">Deleted</span>
                                            {:else}
                                                <span class="status-badge" class:active={user.isActive} class:inactive={!user.isActive}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            {/if}
                                        </td>
                                        <td class="actions-cell">
                                            {#if !user.deletedAt}
                                                <button 
                                                    class="action-btn edit-btn" 
                                                    on:click={() => openEditModal(user)}
                                                    title="Edit user"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    class="action-btn toggle-btn" 
                                                    class:deactivate={user.isActive}
                                                    class:activate={!user.isActive}
                                                    on:click={() => toggleUserStatus(user.id)}
                                                    title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                {#if canDeleteUsers && !user.isActive}
                                                    <button 
                                                        class="action-btn delete-btn" 
                                                        on:click={() => openDeleteModal(user)}
                                                        title="Permanently delete user"
                                                    >
                                                        Delete
                                                    </button>
                                                {/if}
                                            {:else}
                                                <span class="deleted-label">Deleted</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {:else}
                                    <tr>
                                        <td colspan="6" class="empty-state">
                                            <p>No users found</p>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-footer">
                        <span class="user-count">
                            Showing {filteredUsers.length} of {users.length} users
                        </span>
                    </div>
                {/if}
</div>

{#if showCreateModal}
    <div class="modal-overlay" on:click={() => showCreateModal = false}>
        <div class="modal" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Create New User</h2>
                <button class="close-btn" on:click={() => showCreateModal = false}>X</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="new-title">Title</label>
                        <select id="new-title" bind:value={newUser.title}>
                            {#each titles as title}
                                <option value={title}>{title}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="form-group flex-grow">
                        <label for="new-fullName">Full Name *</label>
                        <input type="text" id="new-fullName" bind:value={newUser.fullName} placeholder="Full name" />
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="new-username">Username *</label>
                        <input type="text" id="new-username" bind:value={newUser.username} placeholder="Username" />
                    </div>
                    <div class="form-group">
                        <label for="new-email">Email</label>
                        <input type="email" id="new-email" bind:value={newUser.email} placeholder="Email" />
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="new-password">Password *</label>
                    <input type="password" id="new-password" bind:value={newUser.password} placeholder="Min. 8 characters" />
                </div>
                
                <div class="form-group">
                    <label for="new-role">Role *</label>
                    <select id="new-role" bind:value={newUser.roleId}>
                        <option value={null}>-- Select a role --</option>
                        {#each roles as role}
                            <option value={role.id}>{role.displayName}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="new-specialty">Specialty</label>
                        <select id="new-specialty" bind:value={newUser.specialty}>
                            <option value="Radiology">Radiology</option>
                            <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                            <option value="Interventional Radiology">Interventional Radiology</option>
                            <option value="Nuclear Medicine">Nuclear Medicine</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new-department">Department</label>
                        <input type="text" id="new-department" bind:value={newUser.department} placeholder="e.g., Radiology Dept" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" on:click={() => showCreateModal = false}>Cancel</button>
                <button class="btn-primary" on:click={createUser}>Create User</button>
            </div>
        </div>
    </div>
{/if}

{#if showEditModal && editingUser}
    <div class="modal-overlay" on:click={() => showEditModal = false}>
        <div class="modal" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Edit User</h2>
                <button class="close-btn" on:click={() => showEditModal = false}>X</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-title">Title</label>
                        <select id="edit-title" bind:value={editingUser.title}>
                            {#each titles as title}
                                <option value={title}>{title}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="form-group flex-grow">
                        <label for="edit-fullName">Full Name</label>
                        <input type="text" id="edit-fullName" bind:value={editingUser.fullName} />
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" bind:value={editingUser.email} />
                </div>
                
                <div class="form-group">
                    <label for="edit-role">Role</label>
                    <select id="edit-role" bind:value={editingUser.roleId}>
                        {#each roles as role}
                            <option value={role.id}>{role.displayName}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-specialty">Specialty</label>
                        <select id="edit-specialty" bind:value={editingUser.specialty}>
                            <option value="Radiology">Radiology</option>
                            <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                            <option value="Interventional Radiology">Interventional Radiology</option>
                            <option value="Nuclear Medicine">Nuclear Medicine</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-department">Department</label>
                        <input type="text" id="edit-department" bind:value={editingUser.department} />
                    </div>
                </div>
            </div>
            <div class="modal-footer edit-modal-footer">
                <button class="btn-warning" on:click={() => { showEditModal = false; openResetPasswordModal(editingUser); }}>
                    Reset Password
                </button>
                <div class="footer-right">
                    <button class="btn-secondary" on:click={() => showEditModal = false}>Cancel</button>
                    <button class="btn-primary" on:click={updateUser}>Save Changes</button>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if showResetPasswordModal && resetPasswordUser}
    <div class="modal-overlay" on:click={closeResetPasswordModal}>
        <div class="modal reset-modal" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Reset Password</h2>
                <button class="close-btn" on:click={closeResetPasswordModal}>X</button>
            </div>
            <div class="modal-body">
                {#if !temporaryPassword}
                    <div class="reset-warning">
                        <span class="warning-icon">!</span>
                        <p>This will generate a new temporary password for the user. They will be required to change it on their next login.</p>
                    </div>
                    <p class="reset-user-info">
                        User: <strong>{resetPasswordUser.title} {resetPasswordUser.fullName}</strong> (@{resetPasswordUser.username})
                    </p>
                    <p class="reset-note">
                        All active sessions for this user will be terminated immediately.
                    </p>
                {:else}
                    <div class="success-message">
                        <span class="success-icon">&#10003;</span>
                        <p>Password reset successful!</p>
                    </div>
                    <div class="temp-password-box">
                        <label>Temporary Password:</label>
                        <div class="password-display">
                            <code>{temporaryPassword}</code>
                        </div>
                        <p class="password-note">
                            Please share this password securely with the user. They must change it immediately after logging in.
                        </p>
                    </div>
                {/if}
            </div>
            <div class="modal-footer">
                {#if !temporaryPassword}
                    <button class="btn-secondary" on:click={closeResetPasswordModal}>Cancel</button>
                    <button class="btn-warning" on:click={resetUserPassword} disabled={resetPasswordLoading}>
                        {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                {:else}
                    <button class="btn-primary" on:click={closeResetPasswordModal}>Done</button>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if showDeleteModal && deletingUser}
    <div class="modal-overlay" on:click={() => showDeleteModal = false}>
        <div class="modal delete-modal" on:click|stopPropagation>
            <div class="modal-header delete-header">
                <h2>Permanently Delete User</h2>
                <button class="close-btn" on:click={() => showDeleteModal = false}>X</button>
            </div>
            <div class="modal-body">
                <div class="delete-warning">
                    <span class="warning-icon">!</span>
                    <p>This action cannot be undone. The user account will be permanently marked as deleted.</p>
                </div>
                <p class="delete-user-info">
                    You are about to delete: <strong>{deletingUser.title} {deletingUser.fullName}</strong> (@{deletingUser.username})
                </p>
                <p class="delete-note">
                    Reports created by this user will remain in the system but the user's name will show with a * to indicate deletion.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" on:click={() => showDeleteModal = false}>Cancel</button>
                <button class="btn-danger" on:click={deleteUser}>Delete Permanently</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .admin-container {
        max-width: 1400px;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }
    
    .header-left h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #1f2937);
        margin: 0 0 0.25rem 0;
    }
    
    .subtitle {
        color: var(--text-secondary, #6b7280);
        font-size: 0.95rem;
        margin: 0;
    }
    
    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .btn-icon {
        font-size: 1.25rem;
        font-weight: 700;
    }
    
    .error-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
        margin-bottom: 1.5rem;
    }
    
    .error-icon {
        width: 24px;
        height: 24px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .dismiss-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        text-decoration: underline;
    }
    
    .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .search-box {
        flex: 1;
        max-width: 400px;
        position: relative;
    }
    
    .search-box .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 0.75rem;
    }
    
    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 0.95rem;
        background: white;
    }
    
    .search-box input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .filter-select {
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 0.95rem;
        background: white;
        min-width: 150px;
    }
    
    .loading-state {
        text-align: center;
        padding: 4rem 2rem;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .users-table-container {
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-color, #e5e7eb);
        overflow: hidden;
    }
    
    .users-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }
    
    .users-table th {
        background: #f9fafb;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    .users-table th:nth-child(1) { width: 25%; }
    .users-table th:nth-child(2) { width: 12%; }
    .users-table th:nth-child(3) { width: 15%; }
    .users-table th:nth-child(4) { width: 15%; }
    .users-table th:nth-child(5) { width: 10%; }
    .users-table th:nth-child(6) { width: 23%; }
    
    .users-table td {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        vertical-align: middle;
    }
    
    .users-table tr:last-child td {
        border-bottom: none;
    }
    
    .users-table tr.inactive {
        opacity: 0.6;
    }
    
    .users-table tr:hover:not(.inactive) {
        background: #f9fafb;
    }
    
    .user-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .user-avatar {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        flex-shrink: 0;
    }
    
    .user-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
    }
    
    .user-name {
        font-weight: 600;
        color: var(--text-primary, #1f2937);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .user-username {
        font-size: 0.85rem;
        color: var(--text-secondary, #6b7280);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .user-email {
        font-size: 0.8rem;
        color: var(--text-tertiary, #9ca3af);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .role-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .badge-admin {
        background: #fef3c7;
        color: #92400e;
    }
    
    .badge-radiologist {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .badge-resident {
        background: #dcfce7;
        color: #166534;
    }
    
    .badge-frontdesk {
        background: #f3e8ff;
        color: #6b21a8;
    }
    
    .badge-default {
        background: #f3f4f6;
        color: #374151;
    }
    
    .department-text {
        color: var(--text-primary, #1f2937);
    }
    
    .specialty-text {
        display: block;
        font-size: 0.8rem;
        color: var(--text-secondary, #6b7280);
    }
    
    .date-cell {
        font-size: 0.9rem;
        color: var(--text-secondary, #6b7280);
    }
    
    .status-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status-badge.active {
        background: #dcfce7;
        color: #166534;
    }
    
    .status-badge.inactive {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .actions-cell {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .action-btn {
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid;
    }
    
    .edit-btn {
        background: white;
        border-color: #d1d5db;
        color: #374151;
    }
    
    .edit-btn:hover {
        background: #f3f4f6;
    }
    
    .toggle-btn.deactivate {
        background: white;
        border-color: #fecaca;
        color: #dc2626;
    }
    
    .toggle-btn.deactivate:hover {
        background: #fef2f2;
    }
    
    .toggle-btn.activate {
        background: white;
        border-color: #bbf7d0;
        color: #16a34a;
    }
    
    .toggle-btn.activate:hover {
        background: #f0fdf4;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem !important;
        color: var(--text-secondary, #6b7280);
    }
    
    .table-footer {
        padding: 1rem;
        text-align: right;
    }
    
    .user-count {
        font-size: 0.9rem;
        color: var(--text-secondary, #6b7280);
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 550px;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: var(--text-secondary, #6b7280);
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .close-btn:hover {
        color: var(--text-primary, #1f2937);
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
    }
    
    .form-row:has(.flex-grow) {
        grid-template-columns: auto 1fr;
    }
    
    .form-group {
        margin-bottom: 1.25rem;
    }
    
    .form-group.flex-grow {
        grid-column: span 1;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary, #374151);
        font-size: 0.9rem;
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 6px;
        font-size: 0.95rem;
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid var(--border-color, #e5e7eb);
    }
    
    .btn-secondary {
        padding: 0.75rem 1.5rem;
        background: white;
        color: var(--text-primary, #374151);
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .btn-secondary:hover {
        background: #f3f4f6;
    }
    
    @media (max-width: 768px) {
        .content {
            margin-left: 0;
            padding: 1rem;
        }
        
        .page-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .filters-bar {
            flex-direction: column;
        }
        
        .search-box {
            max-width: none;
        }
        
        .users-table-container {
            overflow-x: auto;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
    }

    /* Dark theme support */
    :global([data-theme="dark"]) .search-box input {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .search-box input::placeholder {
        color: #64748b;
    }

    :global([data-theme="dark"]) .filter-select {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .users-table-container {
        background: #1e293b;
        border-color: #334155;
    }

    :global([data-theme="dark"]) .users-table th {
        background: #0f172a;
        color: #94a3b8;
        border-bottom-color: #334155;
    }

    :global([data-theme="dark"]) .users-table td {
        border-bottom-color: #334155;
    }

    :global([data-theme="dark"]) .users-table tr:hover:not(.inactive) {
        background: #334155;
    }

    :global([data-theme="dark"]) .modal-content {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .modal-header,
    :global([data-theme="dark"]) .modal-footer {
        border-color: #334155;
    }

    :global([data-theme="dark"]) .modal-header h2 {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .form-group label {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .form-group input,
    :global([data-theme="dark"]) .form-group select {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .btn-secondary {
        background: #334155;
        border-color: #475569;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .btn-secondary:hover {
        background: #475569;
    }

    :global([data-theme="dark"]) .table-info {
        color: #94a3b8;
    }

    .action-btn.delete-btn {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
    }

    .action-btn.delete-btn:hover {
        background: #fee2e2;
        border-color: #f87171;
    }

    .deleted-label {
        font-size: 0.75rem;
        color: #9ca3af;
        font-style: italic;
    }

    .user-avatar.deleted {
        opacity: 0.5;
        background: #9ca3af;
    }

    .user-name.deleted {
        color: #9ca3af;
        text-decoration: line-through;
    }

    .delete-modal {
        max-width: 500px;
    }

    .delete-header {
        background: #fef2f2;
        border-bottom: 1px solid #fecaca;
    }

    .delete-header h2 {
        color: #dc2626;
    }

    .delete-warning {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .warning-icon {
        width: 32px;
        height: 32px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .delete-warning p {
        margin: 0;
        color: #991b1b;
        font-size: 0.95rem;
    }

    .delete-user-info {
        margin: 1rem 0;
        color: var(--text-primary, #1f2937);
    }

    .delete-note {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 1rem 0 0;
    }

    .btn-danger {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-danger:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .btn-warning {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-warning:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    
    .btn-warning:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .edit-modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .footer-right {
        display: flex;
        gap: 0.75rem;
    }
    
    .reset-modal {
        max-width: 480px;
    }
    
    .reset-warning {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
    }
    
    .reset-warning .warning-icon {
        width: 24px;
        height: 24px;
        background: #f59e0b;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        flex-shrink: 0;
    }
    
    .reset-warning p {
        margin: 0;
        color: #92400e;
        font-size: 0.9rem;
    }
    
    .reset-user-info {
        margin: 12px 0;
        color: var(--color-text-secondary, #6b7280);
    }
    
    .reset-note {
        font-size: 0.85rem;
        color: var(--color-text-secondary, #9ca3af);
        font-style: italic;
    }
    
    .success-message {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #d1fae5;
        border: 1px solid #10b981;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
    }
    
    .success-message .success-icon {
        width: 24px;
        height: 24px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        flex-shrink: 0;
    }
    
    .success-message p {
        margin: 0;
        color: #065f46;
        font-weight: 600;
    }
    
    .temp-password-box {
        background: var(--color-surface-secondary, #f3f4f6);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        padding: 16px;
    }
    
    .temp-password-box label {
        display: block;
        font-size: 0.85rem;
        color: var(--color-text-secondary, #6b7280);
        margin-bottom: 8px;
    }
    
    .password-display {
        background: #1e293b;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 12px;
    }
    
    .password-display code {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 1.25rem;
        color: #22d3ee;
        letter-spacing: 2px;
    }
    
    .password-note {
        font-size: 0.8rem;
        color: var(--color-text-secondary, #9ca3af);
        margin: 0;
    }
    
    :global([data-theme="dark"]) .reset-warning {
        background: #451a03;
        border-color: #92400e;
    }
    
    :global([data-theme="dark"]) .reset-warning p {
        color: #fcd34d;
    }
    
    :global([data-theme="dark"]) .success-message {
        background: #064e3b;
        border-color: #10b981;
    }
    
    :global([data-theme="dark"]) .success-message p {
        color: #6ee7b7;
    }
    
    :global([data-theme="dark"]) .temp-password-box {
        background: #1e293b;
        border-color: #334155;
    }

    :global([data-theme="dark"]) .delete-warning {
        background: #450a0a;
        border-color: #7f1d1d;
    }

    :global([data-theme="dark"]) .delete-warning p {
        color: #fca5a5;
    }

    :global([data-theme="dark"]) .delete-header {
        background: #450a0a;
        border-color: #7f1d1d;
    }

    .status-badge.deleted {
        background: #9ca3af;
        color: white;
    }

    :global([data-theme="dark"]) .user-name {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .department-text {
        color: #e2e8f0;
    }

    :global([data-theme="dark"]) .user-username {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .user-email {
        color: #64748b;
    }
</style>
