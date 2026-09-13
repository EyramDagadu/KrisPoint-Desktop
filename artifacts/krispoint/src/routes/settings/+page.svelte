<!-- src/routes/settings/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import LetterheadManager from '$lib/components/letterhead/LetterheadManager.svelte';
  import SignatureManager from '$lib/components/settings/SignatureManager.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { authActions, currentUser, permissions } from '$lib/stores/authStore.js';
  import { toastSuccess, toastError, toastInfo } from '$lib/utils/toast.js';
  import { ollamaService } from '$lib/services/OllamaService.js';
  import { licenseState, licenseActions, isLicenseActive, isLicenseExpired, licenseFeatures } from '$lib/stores/licenseStore.js';
  import { isSoloEdition } from '$lib/config/edition';
  
  // Load last active tab from localStorage, default to 'general'
  let activeTab = typeof window !== 'undefined' ? (localStorage.getItem('settings_active_tab') || 'general') : 'general';
  let settingsService = null;
  
  // Save active tab to localStorage whenever it changes
  $: if (typeof window !== 'undefined' && activeTab) {
    localStorage.setItem('settings_active_tab', activeTab);
  }
  
  // Settings will be loaded from SettingsService
  let settings = getDefaultSettings();
  let unsavedChanges = false;
  let saveStatus = '';

  function getDefaultSettings() {
    return {
      general: {
        theme: 'light',
        autoSave: true,
        autoSaveInterval: 30,
        showConfirmation: true
      },
      voice: {
        enabled: true,
        language: 'en-US',
        continuous: true,
        confidenceThreshold: 0.7,
        autoCorrection: true,
        medicalTerms: true,
        contributeTrainingData: false
      },
      ai: {
        providerMode: 'hosted',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'mistral:7b',
        enabled: true
      },
      reports: {
        defaultTemplate: 'blank',
        includeTechnique: true,
        includeComparison: true,
        pdfFormat: 'standard',
        exportQuality: 'high'
      },
      interface: {
        fontSize: 'medium',
        tooltips: true,
        animations: true
      },
      clinical: {
        institutionName: '',
        designation: 'Radiologist',
        userName: '',
        credentials: 'MD',
        signature: '',
        worklistIntegration: false,
        pacsIntegration: false
      },
    };
  }

  // Organization institution (set by admin, shared with all users)
  let organizationInstitution = '';
  
  async function fetchOrganizationInstitution() {
    try {
      const response = await fetch('/api/organization', { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        organizationInstitution = result.institution || '';
      }
    } catch (error) {
      console.error('Failed to fetch organization institution:', error);
    }
  }

  async function saveOrganizationInstitution() {
    try {
      const response = await fetch('/api/organization', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution: organizationInstitution })
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save organization institution:', result.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to save organization institution:', error);
      return false;
    }
  }

  onMount(async () => {
    await loadSettingsService();
    await fetchHostedGatewayStatus();
    await checkSecurityQuestion();
    await fetchOrganizationInstitution();
    
    // Handle forced password change from admin reset
    const urlParams = $page.url.searchParams;
    if (urlParams.get('changePassword') === 'required') {
      activeTab = 'profile';
      toastInfo('Your password was reset by an administrator. Please set a new password.');
      // Scroll to password section after a short delay
      setTimeout(() => {
        const passwordSection = document.querySelector('.password-section');
        if (passwordSection) {
          passwordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    } else if (urlParams.get('tab')) {
      activeTab = urlParams.get('tab');
    }
  });

  async function loadSettingsService() {
    if (!browser) return;
    
    try {
      const { settingsService: ss } = await import('$lib/services/SettingsService.js');
      settingsService = ss;
      if (settingsService) {
        settings = settingsService.getAllSettings();
      }
    } catch (error) {
      console.error('Failed to load SettingsService:', error);
      // Settings are already initialized with defaults
    }
  }

  function saveSettings() {
    if (!browser || !settingsService) return;
    
    try {
      const success = settingsService.saveSettings(settings);
      if (success) {
        unsavedChanges = false;
        saveStatus = 'Settings saved and applied successfully!';
        setTimeout(() => saveStatus = '', 3000);
      } else {
        saveStatus = 'Failed to save settings';
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      saveStatus = 'Failed to save settings';
    }
  }

  function resetSettings() {
    showResetConfirm = true;
  }

  function confirmResetSettings() {
    if (browser && settingsService) {
      settingsService.resetToDefaults();
      settings = settingsService.getAllSettings();
      unsavedChanges = false;
      toastSuccess('Settings reset to defaults and applied!');
    }
  }

  // Profile management functions
  let profileUpdating = false;
  let profileData = {
    fullName: '',
    email: '',
    specialty: '',
    department: '',
    institution: '',
    designation: ''
  };

  // Password change state
  let passwordChangeData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  let passwordChanging = false;
  let passwordStatus = '';
  let showToast = false;
  let toastMessage = '';
  let toastType = 'success'; // 'success' or 'error'

  // Security question state
  let securityQuestionData = {
    question: '',
    answer: ''
  };
  let hasSecurityQuestion = false;
  let securityQuestionSaving = false;
  
  const SECURITY_QUESTIONS = [
    "What was the name of your first patient?",
    "In which city did you complete your medical degree?",
    "What is your medical school mentor's last name?",
    "What was your first hospital rotation specialty?",
    "What is your favorite medical textbook?",
    "What was the name of your first clinical supervisor?",
    "In which year did you complete your medical internship?",
    "What is your mother's maiden name?"
  ];

  // Confirm dialog state
  let showResetConfirm = false;
  let showLogoutConfirm = false;
  let backupPassword = '';
  let backupPasswordConfirm = '';
  let backupAccountPassword = '';
  let backupBusy = false;

  /**
   * @param {string} command
   * @param {Record<string, unknown>=} args
   */
  async function tauriInvoke(command, args) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke(command, args);
  }

  async function exportSoloBackup() {
    if (backupPassword.length < 12) return toastError('Use a backup password of at least 12 characters.');
    if (backupPassword !== backupPasswordConfirm) return toastError('Backup passwords do not match.');
    backupBusy = true;
    try {
      const result = await tauriInvoke('export_solo_backup', {
        password: backupPassword,
        accountPassword: backupAccountPassword
      });
      backupPassword = '';
      backupPasswordConfirm = '';
      backupAccountPassword = '';
      toastSuccess(`Encrypted Solo backup saved as ${result.fileName}.`);
    } catch (error) {
      toastError(String(error));
    } finally {
      backupBusy = false;
    }
  }

  async function restoreSoloBackup() {
    if (backupPassword.length < 12) return toastError('Enter the backup password.');
    if (!backupAccountPassword) return toastError('Enter your KrisPoint account password.');
    if (!confirm('Restore will replace all current Solo data. The backup is validated before any data is changed. Continue?')) return;
    backupBusy = true;
    try {
      await tauriInvoke('restore_solo_backup', {
        password: backupPassword,
        accountPassword: backupAccountPassword
      });
      toastSuccess('Backup restored. KrisPoint Solo is restarting.');
      await tauriInvoke('restart_solo_backend');
    } catch (error) {
      toastError(String(error));
      try { await tauriInvoke('restart_solo_backend'); } catch {}
      backupBusy = false;
    }
  }

  // Update profile data when current user changes
  $: if ($currentUser) {
    profileData = {
      fullName: $currentUser.fullName || '',
      email: $currentUser.email || '',
      specialty: $currentUser.specialty || 'Radiology',
      department: $currentUser.department || '',
      institution: $currentUser.institution || '',
      designation: $currentUser.designation || ''
    };
  }

  async function updateProfile() {
    if (!$currentUser) return;
    
    profileUpdating = true;
    
    try {
      // For admins, save institution to organization-wide setting
      if (isAdmin) {
        const institutionSaved = await saveOrganizationInstitution();
        if (!institutionSaved) {
          saveStatus = 'Failed to update institution';
          setTimeout(() => saveStatus = '', 3000);
          profileUpdating = false;
          return;
        }
      }

      // Prepare profile data, excluding institution (now managed organization-wide)
      const { institution, ...profileDataWithoutInstitution } = profileData;
      const result = await authActions.updateProfile(profileDataWithoutInstitution);
      
      if (result.success) {
        saveStatus = 'Profile updated successfully!';
        setTimeout(() => saveStatus = '', 3000);
      } else {
        saveStatus = result.error || 'Failed to update profile';
        setTimeout(() => saveStatus = '', 3000);
      }
    } catch (error) {
      saveStatus = 'Failed to update profile';
      setTimeout(() => saveStatus = '', 3000);
    } finally {
      profileUpdating = false;
    }
  }


  function logout() {
    showLogoutConfirm = true;
  }

  async function confirmLogout() {
    await authActions.logout();
  }

  async function changePassword(event) {
    // Prevent any default behavior or page reload
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!passwordChangeData.currentPassword || !passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
      passwordStatus = '❌ Please fill in all password fields';
      setTimeout(() => passwordStatus = '', 4000);
      return;
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      passwordStatus = '❌ New password and confirm password do not match';
      setTimeout(() => passwordStatus = '', 4000);
      return;
    }

    passwordChanging = true;
    passwordStatus = '';

    try {
      const result = await authActions.changePassword(
        passwordChangeData.currentPassword,
        passwordChangeData.newPassword
      );

      if (result.success) {
        // Show success toast notification
        toastSuccess('Password changed successfully! You can now use your new password to login.');
        passwordChanging = false;
        
        // Clear the form immediately
        passwordChangeData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      } else {
        // Show error toast notification
        toastError(result.error || 'Failed to change password');
        passwordChanging = false;
      }
    } catch (error) {
      toastError('Failed to change password');
      passwordChanging = false;
    }
  }

  async function checkSecurityQuestion() {
    if (!$currentUser) return;
    
    try {
      const result = await authActions.getSecurityQuestion($currentUser.username);
      if (result.success && result.question) {
        hasSecurityQuestion = true;
        securityQuestionData.question = result.question;
      } else {
        hasSecurityQuestion = false;
        securityQuestionData.question = '';
      }
    } catch (error) {
      console.error('Failed to check security question:', error);
      hasSecurityQuestion = false;
    }
  }

  async function saveSecurityQuestion() {
    if (!$currentUser) return;
    
    if (!securityQuestionData.question) {
      toastError('Please select a security question');
      return;
    }
    
    if (!securityQuestionData.answer.trim()) {
      toastError('Please provide an answer to your security question');
      return;
    }
    
    securityQuestionSaving = true;
    
    try {
      const result = await authActions.updateSecurityQuestion({
        username: $currentUser.username,
        securityQuestion: securityQuestionData.question,
        securityAnswer: securityQuestionData.answer
      });
      
      if (result.success) {
        toastSuccess('Security question saved successfully! You can now use it to recover your password.');
        hasSecurityQuestion = true;
        // Clear the answer field for security
        securityQuestionData.answer = '';
      } else {
        toastError(result.error || 'Failed to save security question');
      }
    } catch (error) {
      toastError('Failed to save security question');
    } finally {
      securityQuestionSaving = false;
    }
  }

  function exportSettings() {
    if (!settingsService) return;
    
    const data = settingsService.exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'krispoint-settings.json';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  function importSettings(event) {
    const file = event.target.files[0];
    if (!file || !settingsService) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = settingsService.importSettings(e.target.result);
        if (success) {
          settings = settingsService.getAllSettings();
          unsavedChanges = false;
          saveStatus = 'Settings imported and applied successfully!';
        } else {
          saveStatus = 'Failed to import settings - invalid file format';
        }
        setTimeout(() => saveStatus = '', 3000);
      } catch (error) {
        saveStatus = 'Failed to import settings - invalid file format';
        setTimeout(() => saveStatus = '', 3000);
      }
    };
    reader.readAsText(file);
  }

  function handleSettingChange() {
    unsavedChanges = true;
  }

  // AI Configuration
  let testingConnection = false;
  let connectionStatus = '';
  let hostedGatewayStatus = 'unknown';
  let hostedGatewayMessage = '';

  // Hosted AI is reached through the authenticated gateway. The browser only
  // receives readiness metadata; provider credentials remain server-side.
  async function fetchHostedGatewayStatus() {
    try {
      const response = await fetch('/api/ai/status', { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        hostedGatewayStatus = 'not-ready';
        hostedGatewayMessage = payload.error || 'Hosted AI is not ready';
        return;
      }
      hostedGatewayStatus = payload.ready === true || payload.status === 'ready'
        ? 'ready'
        : 'not-ready';
      hostedGatewayMessage = payload.message || (hostedGatewayStatus === 'ready'
        ? 'Hosted AI gateway ready'
        : 'Hosted AI gateway is not ready');
    } catch (error) {
      hostedGatewayStatus = 'not-ready';
      hostedGatewayMessage = 'Hosted AI status is unavailable';
    }
  }

  function handleProviderModeChange() {
    handleSettingChange();
    if (settings.ai?.providerMode === 'hosted') {
      fetchHostedGatewayStatus();
    }
  }

  async function testOllamaConnection() {
    testingConnection = true;
    connectionStatus = '';
    
    try {
      ollamaService.setConfig(settings.ai.ollamaUrl, settings.ai.ollamaModel);
      const available = await ollamaService.checkAvailability();
      
      if (available) {
        connectionStatus = 'success';
        toastSuccess(`✅ Connected to Ollama! Model: ${settings.ai.ollamaModel}`);
      } else {
        connectionStatus = 'error';
        toastError('❌ Cannot connect to Ollama. Make sure Ollama is running.');
      }
    } catch (error) {
      connectionStatus = 'error';
      toastError(`Error: ${error.message}`);
    } finally {
      testingConnection = false;
      setTimeout(() => connectionStatus = '', 3000);
    }
  }

  function applyAISettings() {
    if (settings.ai) {
      ollamaService.setConfig(settings.ai.ollamaUrl, settings.ai.ollamaModel);
    }
  }

  // Apply AI settings when saved
  $: if (settings.ai && !unsavedChanges) {
    applyAISettings();
  }

  // Role-based permissions check
  $: isFrontDeskOnly = !$permissions?.includes('reports.create') && !$permissions?.includes('templates.read');
  $: isAdmin = $permissions?.includes('users.manage');
  
  // License activation state
  let licenseKey = '';
  let licenseServerUrl = '';
  let licenseActivating = false;
  let licenseError = '';
  let subscriptionStatus = null;
  let subscriptionLoading = false;
  let autoRenewToggling = false;
  let selectedAutoRenewPlanId = null;
  let setupAutoRenewLoading = false;
  let changePlanLoading = false;
  let selectedTopUpPlanId = null;
  
  // Initialize license server URL
  $: if (browser && $licenseState) {
    licenseServerUrl = $licenseState.serverUrl || '';
  }
  
  async function activateLicense() {
    if (!licenseKey.trim()) {
      licenseError = 'Please enter a license key';
      return;
    }
    
    licenseActivating = true;
    licenseError = '';
    
    const result = await licenseActions.activate(licenseKey.trim());
    
    licenseActivating = false;
    
    if (result.success) {
      toastSuccess('License activated successfully!');
      licenseKey = '';
    } else {
      licenseError = result.error || 'Activation failed';
    }
  }
  
  async function deactivateLicense() {
    const result = await licenseActions.deactivate();
    if (result.success) {
      toastSuccess('License deactivated');
    }
  }
  
  function saveLicenseServerUrl() {
    licenseActions.setServerUrl(licenseServerUrl);
    toastSuccess('License server URL saved');
  }

  async function fetchSubscriptionStatus() {
    subscriptionLoading = true;
    subscriptionStatus = await licenseActions.getSubscriptionStatus();
    subscriptionLoading = false;
  }

  $: if ($isLicenseActive && $licenseState.serverUrl && $licenseState.license?.key) {
    fetchSubscriptionStatus();
  }

  async function toggleAutoRenew() {
    if (!subscriptionStatus?.hasSubscription) return;
    autoRenewToggling = true;
    const newState = !subscriptionStatus.autoRenew;
    const result = await licenseActions.toggleAutoRenew(newState);
    if (result.success) {
      subscriptionStatus = { ...subscriptionStatus, autoRenew: result.autoRenew };
      toastSuccess(newState ? 'Auto-renewal enabled' : 'Auto-renewal disabled');
    } else {
      toastError(result.error || 'Failed to update auto-renewal');
    }
    autoRenewToggling = false;
  }

  async function setupAutoRenew() {
    if (!selectedAutoRenewPlanId) {
      toastError('Please select a plan');
      return;
    }
    setupAutoRenewLoading = true;
    const result = await licenseActions.setupAutoRenew(selectedAutoRenewPlanId);
    if (result.success) {
      if (result.requiresPayment) {
        toastSuccess('A payment page has opened. Complete the payment to activate auto-renewal.');
      } else {
        toastSuccess('Auto-renewal set up successfully!');
        await fetchSubscriptionStatus();
      }
    } else {
      toastError(result.error || 'Failed to set up auto-renewal');
    }
    setupAutoRenewLoading = false;
  }

  async function changeAutoRenewPlan() {
    if (!selectedAutoRenewPlanId) {
      toastError('Please select a plan');
      return;
    }
    changePlanLoading = true;
    const result = await licenseActions.changeAutoRenewPlan(selectedAutoRenewPlanId);
    if (result.success) {
      toastSuccess('Auto-renewal plan changed successfully!');
      await fetchSubscriptionStatus();
    } else {
      toastError(result.error || 'Failed to change plan');
    }
    changePlanLoading = false;
  }

  function openTopUp() {
    const url = licenseActions.getTopUpUrl(selectedTopUpPlanId);
    if (url) {
      window.open(url, '_blank');
    } else {
      toastError('License server URL not configured');
    }
  }

  // Full tabs for admins only (includes system configuration)
  const adminTabs = [
    { id: 'profile', label: 'Admin Profile', icon: '👨‍⚕️' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'voice', label: 'Voice Recognition', icon: '🎤' },
    { id: 'ai', label: 'AI Assistant', icon: '✨' },
    { id: 'letterheads', label: 'Letterheads', icon: '🏥' },
    { id: 'clinical', label: 'External Integrations', icon: '🔗' },
    { id: 'license', label: 'License', icon: '🔑' },
    ...(isSoloEdition ? [{ id: 'backup', label: 'Backup & Restore', icon: '💾' }] : [])
  ];
  
  // Tabs for medical staff (doctors, residents) - no system config
  // Includes voice tab for training data opt-in (personal consent setting)
  const medicalStaffTabs = [
    { id: 'profile', label: 'Doctor Profile', icon: '👨‍⚕️' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'voice', label: 'Voice Settings', icon: '🎤' },
    { id: 'license', label: 'License', icon: '🔑' }
  ];
  
  // Limited tabs for Front Desk users
  const frontDeskTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'license', label: 'License', icon: '🔑' }
  ];
  
  // Choose tabs based on role
  $: tabs = isFrontDeskOnly ? frontDeskTabs : (isAdmin ? adminTabs : medicalStaffTabs);
  
  // Ensure activeTab is valid for current role
  $: {
    const validTabIds = tabs.map(t => t.id);
    if (!validTabIds.includes(activeTab)) {
      activeTab = 'profile';
    }
  }
</script>

<svelte:head>
  <title>Settings - KrisPoint</title>
</svelte:head>

<!-- Toast notifications are now created directly in DOM via JavaScript -->

<div class="settings-page">

    <div class="settings-container">
      <div class="settings-sidebar">
        <nav class="settings-nav">
          {#each tabs as tab}
            <button 
              class="nav-item" 
              class:active={activeTab === tab.id}
              on:click={() => activeTab = tab.id}
            >
              <span class="nav-icon">{tab.icon}</span>
              <span class="nav-label">{tab.label}</span>
            </button>
          {/each}
        </nav>
      </div>

      <div class="settings-content">
        {#if activeTab === 'profile'}
          <div class="settings-section">
            <h2>{isFrontDeskOnly ? '👤 Profile' : (isAdmin ? '👨‍⚕️ Admin Profile' : '👨‍⚕️ Doctor Profile')}</h2>
            
            <div class="profile-info">
              <div class="setting-group">
                <label for="profile-username">Username</label>
                <input 
                  id="profile-username"
                  type="text" 
                  value={$currentUser?.username || 'Not available'}
                  disabled
                  class="readonly-field"
                />
                <p class="setting-description">Your username cannot be changed</p>
              </div>
              
              <div class="setting-group">
                <label for="profile-fullname">Full Name</label>
                <input 
                  id="profile-fullname"
                  type="text" 
                  bind:value={profileData.fullName}
                  placeholder={isFrontDeskOnly ? "Your full name" : "Dr. Full Name"}
                  disabled={profileUpdating}
                />
              </div>
              
              <div class="setting-group">
                <label for="profile-email">Email</label>
                <input 
                  id="profile-email"
                  type="email" 
                  bind:value={profileData.email}
                  placeholder={isFrontDeskOnly ? "email@hospital.com" : "doctor@hospital.com"}
                  disabled={profileUpdating}
                />
              </div>
              
              {#if !isFrontDeskOnly}
              <div class="setting-row">
                <div class="setting-group">
                  <label for="profile-specialty">Specialty</label>
                  {#if isAdmin}
                    <select 
                      id="profile-specialty" 
                      bind:value={profileData.specialty}
                      disabled={profileUpdating}
                    >
                      <option value="Radiology">Radiology</option>
                      <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                      <option value="Interventional Radiology">Interventional Radiology</option>
                      <option value="Nuclear Medicine">Nuclear Medicine</option>
                      <option value="Radiation Oncology">Radiation Oncology</option>
                    </select>
                  {:else}
                    <input
                      id="profile-specialty"
                      type="text"
                      value={profileData.specialty || 'Not assigned'}
                      disabled
                      class="readonly-field"
                    />
                    <p class="setting-description">Specialty is set by the administrator</p>
                  {/if}
                </div>
                
                <div class="setting-group">
                  <label for="profile-designation">Designation</label>
                  {#if isSoloEdition}
                    <input
                      id="profile-designation"
                      type="text"
                      bind:value={profileData.designation}
                      placeholder="e.g., Consultant Radiologist"
                      disabled={profileUpdating}
                    />
                    <p class="setting-description">Shown on your reports and PDF signatures</p>
                  {:else}
                    <input
                      id="profile-designation"
                      type="text"
                      value={$currentUser?.designation || $currentUser?.roleDisplayName || 'Not assigned'}
                      disabled
                      class="readonly-field"
                    />
                    <p class="setting-description">Designation is set by the administrator</p>
                  {/if}
                </div>
              </div>
              
              <div class="setting-group">
                <label for="profile-department">Department</label>
                {#if isAdmin}
                  <input 
                    id="profile-department"
                    type="text" 
                    bind:value={profileData.department}
                    placeholder="e.g., Radiology Department"
                    disabled={profileUpdating}
                  />
                {:else}
                  <input 
                    id="profile-department"
                    type="text"
                    value={profileData.department || 'Not assigned'}
                    disabled
                    class="readonly-field"
                  />
                  <p class="setting-description">Department is set by the administrator</p>
                {/if}
              </div>
              {/if}
              
              <div class="setting-group">
                <label for="profile-institution">Facility/Institution</label>
                {#if isAdmin}
                  <input 
                    id="profile-institution"
                    type="text" 
                    bind:value={organizationInstitution}
                    placeholder="Hospital or medical institution name"
                    disabled={profileUpdating}
                  />
                  <p class="setting-description">This institution name is shared across all users in the system</p>
                {:else}
                  <input 
                    id="profile-institution"
                    type="text" 
                    value={organizationInstitution || 'Not set by administrator'}
                    disabled
                    class="readonly-field"
                  />
                  <p class="setting-description">Institution is set by the system administrator</p>
                {/if}
              </div>
            </div>
            
            {#if !isFrontDeskOnly}
            <div class="signature-section">
              <h3>🖋️ Digital Signature</h3>
              <p class="setting-description">
                Upload your signature image. White backgrounds are automatically removed for professional PDF reports.
              </p>
              
              <SignatureManager />
            </div>
            {/if}
            
            <div class="password-section">
              <h3>🔒 Change Password</h3>
              <p class="setting-description">
                Update your password to keep your account secure. Requirements: at least 8 characters, including uppercase, lowercase, number, and special character.
              </p>
              
              <div class="password-form">
                <div class="setting-group">
                  <label for="current-password">Current Password</label>
                  <input 
                    id="current-password"
                    type="password" 
                    bind:value={passwordChangeData.currentPassword}
                    placeholder="Enter current password"
                    disabled={passwordChanging}
                  />
                </div>
                
                <div class="setting-group">
                  <label for="new-password">New Password</label>
                  <input 
                    id="new-password"
                    type="password" 
                    bind:value={passwordChangeData.newPassword}
                    placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                    disabled={passwordChanging}
                  />
                </div>
                
                <div class="setting-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <input 
                    id="confirm-password"
                    type="password" 
                    bind:value={passwordChangeData.confirmPassword}
                    placeholder="Re-enter new password"
                    disabled={passwordChanging}
                  />
                </div>
                
                <button 
                  type="button"
                  class="btn btn-primary" 
                  on:click={changePassword}
                  disabled={passwordChanging}
                >
                  {#if passwordChanging}
                    <span class="loading-spinner"></span>
                    Changing Password...
                  {:else}
                    🔑 Change Password
                  {/if}
                </button>
                
                {#if passwordStatus}
                  <div class="password-status" class:success={passwordStatus.includes('✅')} class:error={passwordStatus.includes('❌')}>
                    {passwordStatus}
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="security-question-section">
              <h3>🔐 Password Recovery Setup</h3>
              <p class="setting-description">
                {#if hasSecurityQuestion}
                  ✅ You have a security question set up. You can update it below if needed.
                {:else}
                  Set up a security question to recover your password if you forget it. This works completely offline - no email required!
                {/if}
              </p>
              
              <div class="security-question-form">
                <div class="setting-group">
                  <label for="security-question">Security Question</label>
                  <select 
                    id="security-question"
                    bind:value={securityQuestionData.question}
                    disabled={securityQuestionSaving}
                  >
                    <option value="">-- Select a question --</option>
                    {#each SECURITY_QUESTIONS as question}
                      <option value={question}>{question}</option>
                    {/each}
                  </select>
                </div>
                
                <div class="setting-group">
                  <label for="security-answer">Your Answer</label>
                  <input 
                    id="security-answer"
                    type="text" 
                    bind:value={securityQuestionData.answer}
                    placeholder={hasSecurityQuestion ? "Enter new answer to update" : "Enter your answer (case-insensitive)"}
                    disabled={securityQuestionSaving}
                  />
                  <p class="setting-description-small">
                    💡 Answers are case-insensitive. "John Smith" and "john smith" will both work.
                  </p>
                </div>
                
                <button 
                  type="button"
                  class="btn btn-primary" 
                  on:click={saveSecurityQuestion}
                  disabled={securityQuestionSaving}
                >
                  {#if securityQuestionSaving}
                    <span class="loading-spinner"></span>
                    Saving...
                  {:else}
                    {hasSecurityQuestion ? '🔄 Update Security Question' : '✅ Set Up Security Question'}
                  {/if}
                </button>
              </div>
            </div>
            
            <div class="profile-actions">
              <button 
                class="btn btn-primary" 
                on:click={updateProfile}
                disabled={profileUpdating}
              >
                {#if profileUpdating}
                  <span class="loading-spinner"></span>
                  Updating...
                {:else}
                  💾 Save Profile
                {/if}
              </button>
              
              <button class="btn btn-outline btn-logout" on:click={logout}>
                🚪 Logout
              </button>
            </div>
          </div>
        {/if}
        
        {#if activeTab === 'general'}
          <div class="settings-section">
            <h2>General Settings</h2>
            
            <div class="setting-group">
              <label for="theme-select">Theme</label>
              <select id="theme-select" bind:value={settings.general.theme} on:change={handleSettingChange}>
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
            
            <div class="setting-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  bind:checked={settings.general.showConfirmation} 
                  on:change={handleSettingChange}
                />
                Show confirmation dialogs
              </label>
            </div>
            
            <div class="setting-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  bind:checked={settings.interface.tooltips} 
                  on:change={handleSettingChange}
                />
                Show tooltips
              </label>
            </div>
            
            <div class="setting-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  bind:checked={settings.interface.animations} 
                  on:change={handleSettingChange}
                />
                Enable animations
              </label>
            </div>
          </div>
        {/if}

        {#if isSoloEdition && activeTab === 'backup'}
          <div class="settings-section">
            <h2>Backup & Restore</h2>
            <div class="backup-warning">
              <strong>Keep your backup password safe.</strong>
              If you lose both this workstation and the backup password, encrypted patient data cannot be recovered.
              The backup includes the database and the protected recovery keys required on a replacement computer.
            </div>
            <div class="backup-panel">
              <h3>Create encrypted backup</h3>
              <div class="setting-group">
                <label for="backup-password">Backup password</label>
                <input id="backup-password" type="password" bind:value={backupPassword} minlength="12" disabled={backupBusy} autocomplete="new-password" />
                <p class="setting-description">Use at least 12 characters. This password is not stored by KrisPoint.</p>
              </div>
              <div class="setting-group">
                <label for="backup-password-confirm">Confirm backup password</label>
                <input id="backup-password-confirm" type="password" bind:value={backupPasswordConfirm} minlength="12" disabled={backupBusy} autocomplete="new-password" />
              </div>
              <div class="setting-group">
                <label for="backup-account-password">KrisPoint account password</label>
                <input id="backup-account-password" type="password" bind:value={backupAccountPassword} disabled={backupBusy} autocomplete="current-password" />
                <p class="setting-description">Required to authorize backup and restore operations.</p>
              </div>
              <button class="btn btn-primary" on:click={exportSoloBackup} disabled={backupBusy}>Create encrypted backup</button>
            </div>
            <div class="backup-panel">
              <h3>Restore from backup</h3>
              <p class="setting-description">The backup is decrypted and fully validated before current data is replaced. If replacement fails, current data is restored automatically.</p>
              <button class="btn btn-danger" on:click={restoreSoloBackup} disabled={backupBusy}>Choose backup and restore</button>
            </div>
          </div>
        {/if}

        {#if activeTab === 'voice'}
          <div class="settings-section">
            <h2>{isAdmin ? 'Voice Recognition Settings' : 'Voice Training Consent'}</h2>
            
            {#if isAdmin}
              <!-- Admin-only: Full voice recognition configuration -->
              <div class="setting-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    bind:checked={settings.voice.enabled} 
                    on:change={handleSettingChange}
                  />
                  Enable voice recognition
                </label>
              </div>
              
              {#if settings.voice.enabled}
                <div class="setting-group">
                  <label for="voice-confidence">Confidence Threshold</label>
                  <input 
                    id="voice-confidence"
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1"
                    bind:value={settings.voice.confidenceThreshold}
                    on:input={handleSettingChange}
                  />
                  <span class="range-value">{settings.voice.confidenceThreshold}</span>
                </div>
                
                <div class="section-info">
                  <p><strong>Smart Punctuation:</strong> Periods, commas, and question marks are automatically inserted by AI as you speak. Manual voice commands are available for special punctuation (semicolons, colons, quotes, brackets, etc.).</p>
                </div>
              {/if}
            {/if}
            
            <!-- Training data consent - visible to ALL medical staff -->
            <div class="training-data-section">
              <h3>Training Data Collection</h3>
              <div class="setting-group checkbox-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    bind:checked={settings.voice.contributeTrainingData} 
                    on:change={handleSettingChange}
                  />
                  Contribute to voice recognition training
                </label>
              </div>
              <div class="section-info training-info">
                <p>Help improve voice recognition for medical terminology by contributing your dictation data. When enabled:</p>
                <ul>
                  <li>Audio recordings and transcripts are collected during dictation</li>
                  <li>Administrators review and verify transcripts for training</li>
                  <li>Data is only accessible to administrators</li>
                  <li>You can opt out at any time</li>
                </ul>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'ai'}
          <div class="settings-section">
            <h2>✨ AI Assistant Settings</h2>
            <p class="section-info">
              Choose how optional AI drafting assistance is provided. Reports,
              dictation, templates, and ordinary reporting controls work without
              selecting or configuring a provider.
            </p>

            <div class="setting-group">
              <label for="ai-provider-mode">Provider mode</label>
              <select id="ai-provider-mode" bind:value={settings.ai.providerMode} on:change={handleProviderModeChange}>
                <option value="hosted">Hosted (recommended)</option>
                <option value="disabled">Disabled</option>
                <option value="ollama">Private Ollama (advanced)</option>
                <option value="byo">Bring your own provider (advanced)</option>
              </select>
            </div>

             {#if settings.ai.providerMode === 'hosted'}
               <div class="connection-status {hostedGatewayStatus === 'ready' ? 'success' : hostedGatewayStatus === 'not-ready' ? 'error' : ''}">
                 {#if hostedGatewayStatus === 'ready'}✅{:else if hostedGatewayStatus === 'not-ready'}⚠️{:else}⏳{/if}
                 {hostedGatewayMessage || 'Checking hosted AI gateway…'}
               </div>
               <p class="setting-description">
                 Hosted readiness is checked through the authenticated gateway.
                 Provider credentials are never sent to or stored by this browser.
               </p>
             {:else if settings.ai.providerMode === 'disabled'}
               <div class="section-info"><p>AI assistance is disabled. No provider is contacted.</p></div>
             {:else if settings.ai.providerMode === 'byo'}
               <div class="section-info warning">
                 <p><strong>Advanced option:</strong> BYO providers are managed by your deployment administrator. Do not enter provider API keys here; KrisPoint never stores provider keys in browser storage.</p>
               </div>
             {:else}
              <div class="section-info">
                 <p><strong>Private Ollama:</strong> Processing stays on the configured local Ollama service. Confirm its network and data handling settings before use.</p>
               </div>
            
            <div class="setting-group">
              <label for="ollama-url">Ollama Server URL</label>
              <input 
                id="ollama-url"
                type="text" 
                bind:value={settings.ai.ollamaUrl}
                on:change={handleSettingChange}
                placeholder="http://localhost:11434"
              />
              <p class="setting-description">
                The URL where Ollama is running. Default is http://localhost:11434
              </p>
            </div>
            
            <div class="setting-group">
              <label for="ai-model">AI Model</label>
              <input 
                id="ai-model"
                type="text" 
                bind:value={settings.ai.ollamaModel}
                on:change={handleSettingChange}
                placeholder="mistral:7b"
              />
              <p class="setting-description">
                The Ollama model to use. Popular options: mistral:7b, llama3.1:8b, gemma2:9b
                <br/>Make sure you've downloaded the model first: <code>ollama pull {settings.ai.ollamaModel || 'mistral:7b'}</code>
              </p>
            </div>
            
            <div class="setting-group">
              <button 
                class="btn btn-primary"
                on:click={testOllamaConnection}
                disabled={testingConnection}
              >
                {#if testingConnection}
                  <span class="spinner"></span> Testing Connection...
                {:else}
                  🔗 Test Connection
                {/if}
              </button>
              
              {#if connectionStatus === 'success'}
                <div class="connection-status success">
                  ✅ Successfully connected to Ollama!
                </div>
              {:else if connectionStatus === 'error'}
                <div class="connection-status error">
                  ❌ Connection failed. Make sure Ollama is running and the model is downloaded.
                </div>
              {/if}
            </div>
            
            <div class="ai-info">
              <h3>📖 Quick Start Guide</h3>
              <ol>
                <li>Install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener">ollama.com</a></li>
                <li>Open terminal and run: <code>ollama pull {settings.ai.ollamaModel || 'mistral:7b'}</code></li>
                <li>Start Ollama: <code>ollama serve</code></li>
                <li>Click "Test Connection" above to verify</li>
                <li>Use the ✨ button in the report editor to generate or polish reports!</li>
              </ol>
              
              <p><strong>Privacy Note:</strong> All AI processing happens locally on your computer. No data is sent to external servers.</p>
             </div>
             {/if}
          </div>
        {/if}

        {#if activeTab === 'clinical'}
          <div class="settings-section">
            <h2>External Integrations</h2>
            <p class="section-info">
              These integrations are planned for future releases and will enable seamless connection with hospital systems.
            </p>
            
            <div class="setting-group checkbox-group">
              <label class="disabled-option">
                <input 
                  type="checkbox" 
                  disabled
                  checked={false}
                />
                Enable worklist integration (RIS/HIS) <span class="coming-soon">— Coming Soon</span>
              </label>
              <p class="setting-description">
                Connect with Radiology Information System or Hospital Information System for patient worklist management.
              </p>
            </div>
            
            <div class="setting-group checkbox-group">
              <label class="disabled-option">
                <input 
                  type="checkbox" 
                  disabled
                  checked={false}
                />
                Enable PACS integration <span class="coming-soon">— Coming Soon</span>
              </label>
              <p class="setting-description">
                Connect with Picture Archiving and Communication System for medical image viewing and retrieval.
              </p>
            </div>
          </div>
        {/if}

        {#if activeTab === 'letterheads'}
          <div class="settings-section letterhead-section">
            <LetterheadManager {isAdmin} />
          </div>
        {/if}

        {#if activeTab === 'license'}
          <div class="settings-section">
            <h2>🔑 License Management</h2>
            
            {#if $isLicenseActive}
              <div class="license-status license-active">
                <div class="license-badge">
                  <span class="badge-icon">✓</span>
                  <span class="badge-text">Premium Active</span>
                </div>
                
                <div class="license-details">
                  <div class="detail-row">
                    <span class="detail-label">License Key:</span>
                    <span class="detail-value license-key-display">{$licenseState.license?.key || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Plan:</span>
                    <span class="detail-value">{$licenseState.license?.plan || 'Premium'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Expires:</span>
                    <span class="detail-value">{$licenseState.expiresAt ? new Date($licenseState.expiresAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Days Remaining:</span>
                    <span class="detail-value">{licenseActions.getDaysRemaining() || 0} days</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Features:</span>
                    <span class="detail-value features-list">
                      {#each $licenseFeatures as feature}
                        <span class="feature-tag">{feature}</span>
                      {/each}
                    </span>
                  </div>
                </div>
                
                {#if subscriptionLoading}
                  <div class="detail-row">
                    <span class="detail-label">Auto-Renewal:</span>
                    <span class="detail-value">Checking...</span>
                  </div>
                {:else if subscriptionStatus?.hasSubscription}
                  <div class="auto-renewal-section">
                    <div class="detail-row">
                      <span class="detail-label">Auto-Renewal:</span>
                      <span class="detail-value" class:auto-renew-on={subscriptionStatus.autoRenew} class:auto-renew-off={!subscriptionStatus.autoRenew}>
                        {subscriptionStatus.autoRenew ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Current Plan:</span>
                      <span class="detail-value">{subscriptionStatus.planName || 'N/A'} ({subscriptionStatus.planInterval || 'N/A'})</span>
                    </div>
                    {#if subscriptionStatus.nextPaymentDate && subscriptionStatus.autoRenew}
                      <div class="detail-row">
                        <span class="detail-label">Next Payment:</span>
                        <span class="detail-value">{new Date(subscriptionStatus.nextPaymentDate).toLocaleDateString()}</span>
                      </div>
                    {/if}
                    <button
                      class="btn btn-auto-renew"
                      class:btn-danger={subscriptionStatus.autoRenew}
                      on:click={toggleAutoRenew}
                      disabled={autoRenewToggling}
                    >
                      {autoRenewToggling ? 'Updating...' : (subscriptionStatus.autoRenew ? 'Turn Off Auto-Renewal' : 'Turn On Auto-Renewal')}
                    </button>

                    {#if subscriptionStatus.availablePlans?.length > 1}
                      <div class="change-plan-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e2e8f0);">
                        <label for="change-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;">Change Auto-Renewal Plan</label>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                          <select
                            id="change-plan-select"
                            bind:value={selectedAutoRenewPlanId}
                            style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);"
                          >
                            <option value={null}>Select a different plan...</option>
                            {#each subscriptionStatus.availablePlans.filter(p => p.id !== subscriptionStatus.planId) as plan}
                              <option value={plan.id}>{plan.name} - GH₵{(plan.price_cedis / 100).toFixed(2)}/{plan.interval}</option>
                            {/each}
                          </select>
                          <button
                            class="btn btn-primary"
                            on:click={changeAutoRenewPlan}
                            disabled={changePlanLoading || !selectedAutoRenewPlanId}
                            style="white-space: nowrap;"
                          >
                            {changePlanLoading ? 'Changing...' : 'Change Plan'}
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div class="auto-renewal-section">
                    <div class="detail-row">
                      <span class="detail-label">Auto-Renewal:</span>
                      <span class="detail-value auto-renew-off">Not set up</span>
                    </div>
                    {#if subscriptionStatus?.availablePlans?.length > 0}
                      <div class="setup-auto-renew" style="margin-top: 0.75rem;">
                        <label for="setup-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;">Set Up Auto-Renewal</label>
                        <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.5rem;">
                          Automatically renew your license when it expires. You'll be charged on the expiration date.
                        </p>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                          <select
                            id="setup-plan-select"
                            bind:value={selectedAutoRenewPlanId}
                            style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);"
                          >
                            <option value={null}>Select a plan...</option>
                            {#each subscriptionStatus.availablePlans as plan}
                              <option value={plan.id}>{plan.name} - GH₵{(plan.price_cedis / 100).toFixed(2)}/{plan.interval}</option>
                            {/each}
                          </select>
                          <button
                            class="btn btn-primary"
                            on:click={setupAutoRenew}
                            disabled={setupAutoRenewLoading || !selectedAutoRenewPlanId}
                            style="white-space: nowrap;"
                          >
                            {setupAutoRenewLoading ? 'Setting up...' : 'Set Up Auto-Renewal'}
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if !subscriptionLoading && subscriptionStatus?.availablePlans?.length > 0 && $licenseState.serverUrl}
                  <div class="top-up-section" style="margin-top: 1.5rem; padding: 1rem; border-radius: 8px; background: var(--card-bg-alt, rgba(102,126,234,0.05)); border: 1px solid var(--border-color, #e2e8f0);">
                    <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Top Up License</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.75rem;">
                      Add time to your license immediately with a one-time payment. The extra time is added to your current expiration date.
                    </p>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                      <select
                        bind:value={selectedTopUpPlanId}
                        style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);"
                      >
                        <option value={null}>Select a plan...</option>
                        {#each subscriptionStatus.availablePlans as plan}
                          <option value={plan.id}>{plan.name} - GH₵{(plan.price_cedis / 100).toFixed(2)}/{plan.interval}</option>
                        {/each}
                      </select>
                      <button
                        class="btn btn-primary"
                        on:click={openTopUp}
                        disabled={!selectedTopUpPlanId}
                        style="white-space: nowrap;"
                      >
                        Top Up Now
                      </button>
                    </div>
                  </div>
                {/if}

                <button class="btn btn-secondary" on:click={deactivateLicense} style="margin-top: 1rem;">
                  Deactivate License
                </button>
              </div>
            {:else if $isLicenseExpired}
              <div class="license-status license-expired">
                <div class="license-badge expired">
                  <span class="badge-icon">⏰</span>
                  <span class="badge-text">License Expired</span>
                </div>

                <div class="license-details">
                  <div class="detail-row">
                    <span class="detail-label">License Key:</span>
                    <span class="detail-value license-key-display">{$licenseState.license?.key || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Expired On:</span>
                    <span class="detail-value expired-date">{$licenseState.expiresAt ? new Date($licenseState.expiresAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <p class="license-description">
                  Your premium license has expired. Renew it to restore access to voice dictation,
                  AI report polishing, inter-user chat, templates, and macros.
                </p>

                <div class="renewal-actions">
                  {#if $licenseState.serverUrl}
                    <button class="btn btn-renew" on:click={() => {
                      const key = $licenseState.license?.key || '';
                      const url = key ? `${$licenseState.serverUrl}?license_key=${encodeURIComponent(key)}` : $licenseState.serverUrl;
                      window.open(url, '_blank');
                    }}>
                      Renew License
                    </button>
                  {/if}
                  <button class="btn btn-secondary" on:click={() => { licenseActions.clear(); }}>
                    Enter Different Key
                  </button>
                </div>

                <div class="setting-group" style="margin-top: 1rem;">
                  <label for="license-key-reactivate">Or re-activate with a new key</label>
                  <input
                    id="license-key-reactivate"
                    type="text"
                    bind:value={licenseKey}
                    placeholder="KP-XXXX-XXXX-XXXX-XXXX"
                    disabled={licenseActivating || !$licenseState.serverUrl}
                  />
                </div>

                {#if licenseError}
                  <div class="license-error">
                    {licenseError}
                  </div>
                {/if}

                <button
                  class="btn btn-primary"
                  on:click={activateLicense}
                  disabled={licenseActivating || !$licenseState.serverUrl || !licenseKey.trim()}
                >
                  {licenseActivating ? 'Activating...' : 'Activate New Key'}
                </button>
              </div>
            {:else}
              <div class="license-status license-inactive">
                <div class="license-badge inactive">
                  <span class="badge-icon">!</span>
                  <span class="badge-text">Free Version</span>
                </div>
                
                <p class="license-description">
                  Activate a license to unlock premium features including voice dictation, 
                  AI report polishing, inter-user chat, templates, and macros.
                </p>
                
                {#if isAdmin}
                  <div class="setting-group">
                    <label for="license-server-url">License Server URL</label>
                    <div class="input-with-button">
                      <input 
                        id="license-server-url"
                        type="text" 
                        bind:value={licenseServerUrl}
                        placeholder="https://your-license-server.com or /license-server"
                      />
                      <button class="btn btn-secondary" on:click={saveLicenseServerUrl}>
                        Save
                      </button>
                    </div>
                    <p class="setting-description">
                      The URL of your self-hosted license server
                    </p>
                  </div>
                {/if}
                
                <div class="setting-group">
                  <label for="license-key-input">License Key</label>
                  <input 
                    id="license-key-input"
                    type="text" 
                    bind:value={licenseKey}
                    placeholder="KP-XXXX-XXXX-XXXX-XXXX"
                    disabled={licenseActivating || !$licenseState.serverUrl}
                  />
                  {#if !$licenseState.serverUrl}
                    <p class="setting-description warning">
                      Please configure the license server URL first (admin required)
                    </p>
                  {/if}
                </div>
                
                {#if licenseError}
                  <div class="license-error">
                    {licenseError}
                  </div>
                {/if}
                
                <button 
                  class="btn btn-primary" 
                  on:click={activateLicense}
                  disabled={licenseActivating || !$licenseState.serverUrl || !licenseKey.trim()}
                >
                  {licenseActivating ? 'Activating...' : 'Activate License'}
                </button>
              </div>
            {/if}
          </div>
        {/if}

      </div>
    </div>
    
    <!-- Save Controls at Bottom -->
    <div class="save-controls">
      <button class="btn btn-primary save-button" on:click={saveSettings}>
        <span class="save-icon">💾</span> Save Changes
      </button>
      {#if unsavedChanges}
        <div class="unsaved-indicator">
          ⚠️ You have unsaved changes
        </div>
      {:else}
        <div class="saved-indicator">
          ✅ All Changes Saved
        </div>
      {/if}
      {#if saveStatus}
        <div class="save-status" class:success={saveStatus.includes('success')} class:error={saveStatus.includes('Failed')}>
          {saveStatus}
        </div>
      {/if}
    </div>
  </div>

<!-- Confirmation Dialogs -->
<ConfirmDialog
  bind:show={showResetConfirm}
  title="Reset All Settings?"
  message="Are you sure you want to reset all settings to defaults? This cannot be undone."
  confirmText="Reset"
  cancelText="Cancel"
  danger={true}
  on:confirm={confirmResetSettings}
/>

<ConfirmDialog
  bind:show={showLogoutConfirm}
  title="Logout?"
  message="Are you sure you want to logout?"
  confirmText="Logout"
  cancelText="Cancel"
  on:confirm={confirmLogout}
/>

<style>
  .settings-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
  }


  .save-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    margin-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #f9fafb);
    border-radius: 0 0 12px 12px;
  }

  .save-status {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .save-status.success {
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .save-status.error {
    background: var(--color-error-light);
    color: var(--color-error);
  }

  .save-button {
    background: #22c55e !important;
    color: white !important;
    border: 1px solid #22c55e !important;
  }

  .save-button:hover {
    background: #16a34a !important;
    border-color: #16a34a !important;
  }

  .save-icon {
    filter: none;
    opacity: 1;
    font-size: 1rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    display: inline-block;
    margin-right: 0.5rem;
  }

  .unsaved-indicator {
    color: var(--color-warning);
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background: var(--color-warning-light);
    border-radius: 8px;
    border: 1px solid var(--color-warning);
    animation: warning-pulse 2s infinite;
  }


  @keyframes warning-pulse {
    0%, 100% { 
      background: var(--color-warning-light);
      border-color: var(--color-warning);
    }
    50% { 
      background: var(--color-warning-light);
      border-color: var(--color-warning);
      opacity: 0.8;
    }
  }

  .settings-container {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
  }

  .settings-sidebar {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .settings-nav {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.5rem;
  }

  .nav-item {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .nav-item:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  .nav-item.active {
    background: var(--color-primary);
    color: white;
  }

  .nav-icon {
    font-size: 1rem;
  }

  .nav-label {
    font-weight: 500;
  }

  .sidebar-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .settings-section h2 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .section-info {
    margin: -0.5rem 0 1.5rem 0;
    padding: 0.75rem 1rem;
    background: var(--color-primary-light, #eff6ff);
    border-left: 3px solid var(--color-primary, #3b82f6);
    border-radius: 4px;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .training-data-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .training-data-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-primary, #374151);
  }

  .training-info {
    margin-top: 0.75rem;
  }

  .training-info ul {
    margin: 0.5rem 0 0 1.25rem;
    padding: 0;
  }

  .training-info li {
    margin-bottom: 0.25rem;
  }

  .setting-group {
    margin-bottom: 1.5rem;
  }

  .setting-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary, #374151);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0;
    cursor: pointer;
  }

  .checkbox-group label.disabled-option {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .coming-soon {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #6b7280);
    font-style: italic;
    font-weight: normal;
  }

  .setting-group select,
  .setting-group input[type="text"],
  .setting-group input[type="range"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
  }

  .setting-group select:focus,
  .setting-group input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .range-value {
    display: inline-block;
    margin-left: 0.5rem;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .setting-description {
    margin: 0.5rem 0 0 0;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    text-align: center;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: #3b82f6 !important; /* Solid blue background */
    color: #ffffff !important; /* White text */
    border: 2px solid #3b82f6 !important; /* Solid border */
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .btn-primary:hover {
    background: #2563eb !important; /* Darker blue on hover */
    border-color: #2563eb !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  .btn-outline {
    background: transparent;
    border-color: var(--border);
    color: var(--text-primary);
  }

  .btn-outline:hover {
    background: var(--surface-hover);
  }

  .btn-danger {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .btn-danger:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #7f1d1d;
  }

  .backup-warning {
    margin: 1rem 0 1.5rem;
    padding: 1rem 1.25rem;
    color: #7c2d12;
    background: #fff7ed;
    border: 1px solid #fdba74;
    border-radius: 8px;
    line-height: 1.5;
  }

  .backup-warning strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .backup-panel {
    max-width: 680px;
    margin-top: 1.25rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .backup-panel h3 {
    margin-top: 0;
  }

  /* Profile section styles */
  .profile-info {
    margin-bottom: 2rem;
  }
  
  .setting-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .signature-section {
    background: var(--color-background-tertiary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  
  .signature-section h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #1e293b);
  }
  
  .signature-preview {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-background-secondary, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 6px;
  }
  
  .signature-image {
    max-width: 200px;
    max-height: 80px;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 4px;
    object-fit: contain;
  }
  
  .signature-info {
    flex: 1;
  }
  
  .signature-info p {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .signature-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .signature-upload {
    text-align: center;
    padding: 2rem;
    border: 2px dashed var(--color-border, #e2e8f0);
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .upload-btn {
    margin-bottom: 0.5rem;
  }
  
  .upload-hint {
    color: var(--color-text-secondary, #64748b);
    font-size: 0.875rem;
    margin: 0;
  }
  
  /* Password change section styles */
  .password-section {
    background: var(--color-background-tertiary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  
  .password-section h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #1e293b);
  }
  
  .password-form {
    margin-top: 1rem;
  }
  
  .password-form input[type="password"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
  }
  
  .password-form input[type="password"]:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .password-form input[type="password"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .password-status {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .password-status.success {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 2px solid #10b981;
    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
  }
  
  .password-status.error {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    border: 2px solid #ef4444;
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
  }
  
  /* Security question section styles */
  .security-question-section {
    background: var(--color-background-tertiary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  
  .security-question-section h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #1e293b);
  }
  
  .security-question-form {
    margin-top: 1rem;
  }
  
  .setting-description-small {
    color: var(--color-text-secondary, #64748b);
    font-size: 0.8rem;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }
  
  .profile-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
  }
  
  .btn-logout {
    margin-left: auto;
  }

  .import-btn {
    position: relative;
    cursor: pointer;
  }

  /* Toast Notification Styles - Created via Direct DOM */
  :global(.kp-toast) {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 350px;
    max-width: 500px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  :global(.kp-toast-success) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  :global(.kp-toast-error) {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  :global(.kp-toast-content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  :global(.kp-toast-message) {
    flex: 1;
    font-size: 1rem;
    line-height: 1.4;
  }

  :global(.kp-toast-close) {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
    line-height: 1;
    padding: 0;
  }

  :global(.kp-toast-close:hover) {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    .settings-page {
      padding: 1rem;
    }

    .settings-container {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* License Tab Styles */
  .license-status {
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .license-active {
    background: linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(56, 161, 105, 0.1) 100%);
    border: 1px solid rgba(72, 187, 120, 0.3);
  }

  .license-inactive {
    background: var(--color-surface-2, #f3f4f6);
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .license-expired {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .license-badge.expired {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .expired-date {
    color: #dc2626;
    font-weight: 600;
  }

  .renewal-actions {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .btn-renew {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-renew:hover {
    opacity: 0.9;
  }

  .auto-renewal-section {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .auto-renew-on {
    color: #48bb78;
    font-weight: 600;
  }

  .auto-renew-off {
    color: #a0aec0;
    font-weight: 600;
  }

  .btn-auto-renew {
    margin-top: 0.75rem;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(66, 153, 225, 0.15);
    color: #63b3ed;
    transition: all 0.2s ease;
  }

  .btn-auto-renew:hover:not(:disabled) {
    background: rgba(66, 153, 225, 0.25);
  }

  .btn-auto-renew.btn-danger {
    background: rgba(245, 101, 101, 0.15);
    color: #fc8181;
    border-color: rgba(245, 101, 101, 0.2);
  }

  .btn-auto-renew.btn-danger:hover:not(:disabled) {
    background: rgba(245, 101, 101, 0.25);
  }

  .btn-auto-renew:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .license-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .license-badge.inactive {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
  }

  .badge-icon {
    font-size: 1rem;
  }

  .license-details {
    background: var(--color-surface, #fff);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-weight: 500;
    color: var(--color-text-secondary, #6b7280);
    min-width: 140px;
  }

  .detail-value {
    color: var(--color-text, #1f2937);
  }

  .license-key-display {
    font-family: monospace;
    letter-spacing: 1px;
    background: var(--color-surface-2, #f3f4f6);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .features-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .feature-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    text-transform: capitalize;
  }

  .license-description {
    color: var(--color-text-secondary, #6b7280);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .license-error {
    background: rgba(245, 101, 101, 0.1);
    color: #c53030;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid rgba(245, 101, 101, 0.3);
  }

  .input-with-button {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-button input {
    flex: 1;
  }

  .setting-description.warning {
    color: #c53030;
  }
</style>

