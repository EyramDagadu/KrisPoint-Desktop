<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { currentUser, permissions } from '$lib/stores/authStore';
    import { patientData } from '$lib/stores/reportStore.js';
    import { customOptionsService } from '$lib/services/CustomOptionsService.js';
    import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
    import { SSEManager } from '$lib/services/SSEManager';
    
    const SSE_ID = 'worklist-reports';
    let reportEventSource: EventSource | null = null;
    
    let worklistItems: any[] = [];
    let filteredItems: any[] = [];
    let loading = true;
    let error = '';
    let selectedModality = '';
    let selectedStatus = 'ALL';
    let selectedPriority = 'ALL';
    let searchQuery = '';
    let dateStartFilter = '';
    let dateEndFilter = '';
    let datePreset = 'all';
    
    const priorityOptions = [
        { value: 'ALL', label: 'All Priorities' },
        { value: 'STAT', label: 'STAT' },
        { value: 'URGENT', label: 'Urgent' },
        { value: 'ROUTINE', label: 'Routine' }
    ];
    
    const worklistStatuses = [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'SIGNED', label: 'Signed Off' }
    ];
    let showAddModal = false;
    let showCustomModal = false;
    let customModality = '';
    let customRegion = '';
    let selectedCustomModalities: string[] = [];
    
    const baseModalities = ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'PET-CT'];
    let modalities = [...baseModalities];
    
    const modalityCodeToName: Record<string, string> = {
        'CT': 'CT', 'MRI': 'MRI', 'XR': 'X-Ray', 'X-RAY': 'X-Ray', 'XRAY': 'X-Ray',
        'US': 'Ultrasound', 'ULTRASOUND': 'Ultrasound',
        'MG': 'Mammography', 'MAMMOGRAPHY': 'Mammography', 
        'FL': 'Fluoroscopy', 'FLUOROSCOPY': 'Fluoroscopy',
        'NM': 'Nuclear Medicine', 'NUCLEAR MEDICINE': 'Nuclear Medicine', 
        'PETCT': 'PET-CT', 'PET-CT': 'PET-CT'
    };
    
    function formatModality(modality: string): string {
        if (!modality) return '';
        const upper = modality.toUpperCase();
        return modalityCodeToName[upper] || modality;
    }
    
    const availableModalitiesForCustomRegion = [
        { value: 'CT', label: 'CT' },
        { value: 'MRI', label: 'MRI' },
        { value: 'X-Ray', label: 'X-Ray' },
        { value: 'Ultrasound', label: 'Ultrasound' },
        { value: 'Mammography', label: 'Mammography' },
        { value: 'Fluoroscopy', label: 'Fluoroscopy' },
        { value: 'Nuclear Medicine', label: 'Nuclear Medicine' },
        { value: 'PET-CT', label: 'PET-CT' }
    ];
    
    const baseBodyRegionsByModality: Record<string, string[]> = {
        'CT': ['Head', 'Neck', 'Chest', 'Abdomen', 'Pelvis', 'Spine', 'Extremity', 'Angio', 'Cardiac'],
        'MRI': ['Brain', 'Spine', 'MSK', 'Body', 'Breast', 'Cardiac', 'Pelvis'],
        'X-Ray': ['Chest', 'Abdomen', 'Spine', 'Extremity', 'Pelvis'],
        'Ultrasound': ['Abdominal', 'Pelvic', 'Vascular', 'Small Parts', 'Obstetric'],
        'Mammography': ['Screening', 'Diagnostic'],
        'Fluoroscopy': ['GI Series', 'GU Studies', 'Arthrography'],
        'Nuclear Medicine': ['Bone Scan', 'Cardiac', 'Thyroid', 'Renal'],
        'PET-CT': ['Whole Body', 'Brain', 'Cardiac']
    };
    
    let bodyRegionsByModality: Record<string, string[]> = { ...baseBodyRegionsByModality };
    
    let newPatient = {
        firstName: '',
        lastName: '',
        hospitalNumber: '',
        dateOfBirth: '',
        age: '',
        ageUnit: 'years',
        sex: '',
        modality: '',
        bodyRegion: '',
        priority: 'ROUTINE',
        indication: '',
        referringPhysician: '',
        studyDate: new Date().toISOString().split('T')[0]
    };
    
    let validationErrors: string[] = [];
    
    function calculateAgeFromDOB(dob: string) {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        
        if (isNaN(birthDate.getTime())) return null;
        
        let years = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            years--;
        }
        
        if (years < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                          (today.getMonth() - birthDate.getMonth());
            if (months < 1) {
                const days = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
                return { age: days, unit: 'days' };
            }
            return { age: months, unit: 'months' };
        }
        
        return { age: years, unit: 'years' };
    }
    
    function handleDateOfBirthChange() {
        const calculated = calculateAgeFromDOB(newPatient.dateOfBirth);
        if (calculated) {
            newPatient.age = calculated.age.toString();
            newPatient.ageUnit = calculated.unit;
        }
    }
    
    function loadCustomOptions() {
        const customMods = customOptionsService.getCustomModalities();
        modalities = [...baseModalities, ...customMods];
        
        bodyRegionsByModality = { ...baseBodyRegionsByModality };
        
        Object.keys(baseBodyRegionsByModality).forEach(mod => {
            const modalityKey = mod.toLowerCase().replace('-', '').replace(' ', '');
            const customRegionsForMod = customOptionsService.getCustomRegionsForModality(modalityKey);
            if (customRegionsForMod.length > 0) {
                bodyRegionsByModality[mod] = [...baseBodyRegionsByModality[mod], ...customRegionsForMod];
            }
        });
        
        customMods.forEach(customMod => {
            const customRegionsForMod = customOptionsService.getCustomRegionsForModality(customMod);
            bodyRegionsByModality[customMod] = customRegionsForMod.length > 0 ? customRegionsForMod : [];
        });
    }
    
    $: availableBodyRegions = newPatient.modality ? (bodyRegionsByModality[newPatient.modality] || []) : [];
    $: canCreateWorklist = $permissions.includes('worklist.create');
    $: canPickup = $permissions.includes('worklist.pickup');
    $: canEditWorklist = $permissions.includes('worklist.update');
    $: canDeleteWorklist = $permissions.includes('worklist.delete');
    
    let showEditModal = false;
    let showDeleteConfirm = false;
    let editingItem: any = null;
    let deletingItem: any = null;
    let isAddingToWorklist = false;
    
    onMount(async () => {
        if (!$currentUser) {
            goto('/auth');
            return;
        }
        loadCustomOptions();
        await loadData();
        
        // Set up SSE for real-time report status updates
        setupReportEventSource();
    });
    
    onDestroy(() => {
        SSEManager.unregister(SSE_ID);
        reportEventSource = null;
    });
    
    function setupReportEventSource() {
        SSEManager.unregister(SSE_ID);
        
        reportEventSource = new EventSource('/api/reports/events');
        SSEManager.register(SSE_ID, reportEventSource);
        
        reportEventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'report_status_changed') {
                    // Update the worklist item with the new status
                    worklistItems = worklistItems.map(item => {
                        if (item.reportId === data.reportId || item.id === data.worklistId) {
                            return {
                                ...item,
                                status: data.newStatus,
                                reportStatus: data.reportStatus
                            };
                        }
                        return item;
                    });
                } else if (data.type === 'worklist_updated') {
                    // Update specific worklist item
                    worklistItems = worklistItems.map(item => {
                        if (item.id === data.worklistId) {
                            return { ...item, ...data.updates };
                        }
                        return item;
                    });
                }
            } catch (e) {
                // Ignore parse errors (e.g., heartbeat messages)
            }
        };
        
        reportEventSource.onerror = () => {
            // Reconnect after a delay on error
            if (reportEventSource) {
                reportEventSource.close();
                reportEventSource = null;
            }
            setTimeout(() => {
                if ($currentUser) {
                    setupReportEventSource();
                }
            }, 5000);
        };
    }
    
    async function loadData() {
        loading = true;
        error = '';
        
        try {
            let url = `/api/worklist?status=${selectedStatus}`;
            if (selectedModality) {
                url += `&modality=${selectedModality}`;
            }
            
            const worklistRes = await fetch(url, { 
                credentials: 'include'
            });
            
            const worklistData = await worklistRes.json();
            
            if (worklistData.success) {
                worklistItems = worklistData.items;
            } else {
                error = worklistData.error || 'Failed to load worklist';
            }
        } catch (err) {
            error = 'Failed to load worklist';
            console.error(err);
        } finally {
            loading = false;
        }
    }
    
    function handleDateFilterChange(e: CustomEvent) {
        dateStartFilter = e.detail.startDate;
        dateEndFilter = e.detail.endDate;
        datePreset = e.detail.preset;
    }
    
    // Client-side filtering for search, date, and priority
    $: {
        filteredItems = worklistItems.filter(item => {
            // Search filter - match patient name or hospital number
            const searchLower = searchQuery.toLowerCase().trim();
            const matchesSearch = !searchLower || 
                `${item.patientFirstName || ''} ${item.patientLastName || ''}`.toLowerCase().includes(searchLower) ||
                (item.patientHospitalNumber || '').toLowerCase().includes(searchLower);
            
            // Date range filter - match study date
            let matchesDate = true;
            if (dateStartFilter || dateEndFilter) {
                const itemDate = item.studyDate ? new Date(item.studyDate).toISOString().split('T')[0] : '';
                if (dateStartFilter && dateEndFilter) {
                    matchesDate = itemDate >= dateStartFilter && itemDate <= dateEndFilter;
                } else if (dateStartFilter) {
                    matchesDate = itemDate >= dateStartFilter;
                } else if (dateEndFilter) {
                    matchesDate = itemDate <= dateEndFilter;
                }
            }
            
            // Priority filter
            const matchesPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
            
            return matchesSearch && matchesDate && matchesPriority;
        });
    }
    
    function applyFilters() {
        // Trigger reactivity - the $: block handles the actual filtering
        filteredItems = filteredItems;
    }
    
    function clearFilters() {
        searchQuery = '';
        dateStartFilter = '';
        dateEndFilter = '';
        datePreset = 'all';
        selectedPriority = 'ALL';
    }
    
    function getDisplayStatus(item: any): { label: string; class: string } {
        if (item.status === 'PENDING') {
            return { label: 'Pending', class: 'status-pending' };
        }
        if (item.status === 'COMPLETED') {
            return { label: 'Signed Off', class: 'status-signed' };
        }
        if (item.status === 'IN_PROGRESS') {
            if (item.reportStatus === 'SUBMITTED') {
                return { label: 'Submitted', class: 'status-submitted' };
            }
            if (item.reportStatus === 'DRAFT') {
                return { label: 'Draft', class: 'status-in-progress' };
            }
            return { label: 'Draft', class: 'status-in-progress' };
        }
        return { label: item.status, class: 'status-default' };
    }
    
    function validateForm(): boolean {
        validationErrors = [];
        
        if (!newPatient.firstName.trim()) {
            validationErrors.push('First name is required');
        }
        if (!newPatient.lastName.trim()) {
            validationErrors.push('Last name is required');
        }
        if (!newPatient.hospitalNumber.trim()) {
            validationErrors.push('Hospital Number is required');
        }
        if (!newPatient.sex) {
            validationErrors.push('Sex is required');
        }
        if (!newPatient.modality) {
            validationErrors.push('Modality is required');
        }
        if (!newPatient.age && !newPatient.dateOfBirth) {
            validationErrors.push('Either age or date of birth is required');
        }
        
        return validationErrors.length === 0;
    }
    
    async function addToWorklist() {
        console.log('[Worklist] Add to Worklist button clicked');
        console.log('[Worklist] newPatient:', JSON.stringify(newPatient, null, 2));
        console.log('[Worklist] isAddingToWorklist:', isAddingToWorklist);
        
        // Prevent duplicate submissions
        if (isAddingToWorklist) {
            console.log('[Worklist] Already adding, ignoring duplicate click');
            return;
        }
        
        if (!validateForm()) {
            console.log('[Worklist] Validation failed:', validationErrors);
            return;
        }
        
        console.log('[Worklist] Validation passed, making API call...');
        isAddingToWorklist = true;
        error = '';
        
        // Close SSE connection to free up browser connection slot
        if (reportEventSource) {
            console.log('[Worklist] Temporarily closing SSE to free connection');
            reportEventSource.close();
            reportEventSource = null;
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('[Worklist] Request timed out after 15 seconds');
                controller.abort();
            }, 15000);
            
            const requestBody = {
                patient: {
                    firstName: newPatient.firstName.trim(),
                    lastName: newPatient.lastName.trim(),
                    hospitalNumber: newPatient.hospitalNumber.trim(),
                    dateOfBirth: newPatient.dateOfBirth || null,
                    age: newPatient.age ? parseInt(newPatient.age as string) : null,
                    ageUnit: newPatient.ageUnit,
                    sex: newPatient.sex
                },
                modality: newPatient.modality,
                bodyRegion: newPatient.bodyRegion,
                priority: newPatient.priority,
                indication: newPatient.indication,
                referringPhysician: newPatient.referringPhysician,
                studyDate: newPatient.studyDate
            };
            
            console.log('[Worklist] Request body:', JSON.stringify(requestBody, null, 2));
            console.log('[Worklist] About to call fetch...');
            
            // Try fetch without AbortController first to isolate the issue
            const res = await fetch('/api/worklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            
            console.log('[Worklist] Fetch completed!');
            
            clearTimeout(timeoutId);
            
            console.log('[Worklist] API response status:', res.status);
            const data = await res.json();
            console.log('[Worklist] API response data:', data);
            if (data.success) {
                console.log('[Worklist] Success! Closing modal and reloading data...');
                showAddModal = false;
                resetForm();
                await loadData();
            } else {
                console.log('[Worklist] API returned error:', data.error);
                error = data.error || 'Failed to add to worklist';
            }
        } catch (err: any) {
            console.error('[Worklist] Exception caught:', err);
            if (err.name === 'AbortError') {
                error = 'Request timed out. Please try again.';
            } else {
                error = 'Failed to add to worklist: ' + (err.message || 'Network error');
            }
        } finally {
            isAddingToWorklist = false;
            // Reconnect SSE after API call completes
            if (!reportEventSource) {
                console.log('[Worklist] Reconnecting SSE');
                setupReportEventSource();
            }
        }
    }
    
    function resetForm() {
        newPatient = {
            firstName: '',
            lastName: '',
            hospitalNumber: '',
            dateOfBirth: '',
            age: '',
            ageUnit: 'years',
            sex: '',
            modality: '',
            bodyRegion: '',
            priority: 'ROUTINE',
            indication: '',
            referringPhysician: '',
            studyDate: new Date().toISOString().split('T')[0]
        };
        validationErrors = [];
    }
    
    function openAddModal() {
        resetForm();
        showAddModal = true;
    }
    
    function closeModal() {
        showAddModal = false;
        resetForm();
    }
    
    async function pickupItem(itemId: number) {
        try {
            const res = await fetch(`/api/worklist/${itemId}/pickup`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success && data.reportId) {
                goto(`/reporting?reportId=${data.reportId}`);
            } else {
                error = data.error || 'Failed to pickup item';
            }
        } catch (err) {
            error = 'Failed to pickup item';
            console.error(err);
        }
    }
    
    function formatDate(dateStr: string) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    function formatDoctorName(fullName: string | null): string {
        if (!fullName) return '-';
        const parts = fullName.trim().split(/\s+/);
        const surname = parts[parts.length - 1];
        return `Dr ${surname}`;
    }
    
    function getPriorityClass(priority: string) {
        switch (priority) {
            case 'STAT': return 'priority-stat';
            case 'URGENT': return 'priority-urgent';
            default: return 'priority-routine';
        }
    }
    
    function handleModalityChange() {
        if (newPatient.modality === 'custom') {
            showCustomModal = true;
            selectedCustomModalities = [];
        } else {
            newPatient.bodyRegion = '';
        }
    }
    
    function handleBodyRegionChange() {
        if (newPatient.bodyRegion === 'custom') {
            showCustomModal = true;
            if (newPatient.modality && newPatient.modality !== 'custom') {
                const modalityKey = newPatient.modality.toLowerCase().replace('-', '').replace(' ', '');
                selectedCustomModalities = [modalityKey];
            } else {
                selectedCustomModalities = [];
            }
        }
    }
    
    function toggleCustomModality(modalityValue: string) {
        if (selectedCustomModalities.includes(modalityValue)) {
            selectedCustomModalities = selectedCustomModalities.filter(m => m !== modalityValue);
        } else {
            selectedCustomModalities = [...selectedCustomModalities, modalityValue];
        }
    }
    
    function saveCustomSelections() {
        if (customModality.trim()) {
            const trimmedModality = customModality.trim();
            customOptionsService.addCustomModality(trimmedModality);
            newPatient.modality = trimmedModality;
            console.log('Saved custom modality:', trimmedModality);
        }
        
        if (customRegion.trim()) {
            const trimmedRegion = customRegion.trim();
            
            if (selectedCustomModalities.length === 0) {
                alert('Please select at least one modality for this body region');
                return;
            }
            
            customOptionsService.addCustomRegion(trimmedRegion, selectedCustomModalities);
            newPatient.bodyRegion = trimmedRegion;
            console.log('Saved custom region:', trimmedRegion, 'for modalities:', selectedCustomModalities);
        }
        
        loadCustomOptions();
        
        showCustomModal = false;
        customModality = '';
        customRegion = '';
        selectedCustomModalities = [];
    }
    
    function closeCustomModal() {
        showCustomModal = false;
        customModality = '';
        customRegion = '';
        selectedCustomModalities = [];
        
        if (newPatient.modality === 'custom') {
            newPatient.modality = '';
        }
        if (newPatient.bodyRegion === 'custom') {
            newPatient.bodyRegion = '';
        }
    }
    
    function openEditModal(item: any) {
        editingItem = {
            id: item.id,
            firstName: item.patientFirstName || '',
            lastName: item.patientLastName || '',
            hospitalNumber: item.patientHospitalNumber || '',
            modality: item.modality || '',
            bodyRegion: item.bodyRegion || '',
            priority: item.priority || 'ROUTINE',
            indication: item.indication || '',
            referringPhysician: item.referringPhysician || '',
            studyDate: item.studyDate ? new Date(item.studyDate).toISOString().split('T')[0] : ''
        };
        showEditModal = true;
    }
    
    function closeEditModal() {
        showEditModal = false;
        editingItem = null;
    }
    
    async function saveEdit() {
        if (!editingItem) return;
        
        try {
            const res = await fetch(`/api/worklist/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    modality: editingItem.modality,
                    bodyRegion: editingItem.bodyRegion,
                    priority: editingItem.priority,
                    indication: editingItem.indication,
                    referringPhysician: editingItem.referringPhysician,
                    studyDate: editingItem.studyDate
                })
            });
            
            const data = await res.json();
            if (data.success) {
                showEditModal = false;
                editingItem = null;
                await loadData();
            } else {
                error = data.error || 'Failed to update worklist item';
            }
        } catch (err) {
            error = 'Failed to update worklist item';
            console.error(err);
        }
    }
    
    function confirmDelete(item: any) {
        deletingItem = item;
        showDeleteConfirm = true;
    }
    
    function cancelDelete() {
        showDeleteConfirm = false;
        deletingItem = null;
    }
    
    async function deleteItem() {
        if (!deletingItem) return;
        
        try {
            const res = await fetch(`/api/worklist/${deletingItem.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                showDeleteConfirm = false;
                deletingItem = null;
                await loadData();
            } else {
                error = data.error || 'Failed to delete worklist item';
            }
        } catch (err) {
            error = 'Failed to delete worklist item';
            console.error(err);
        }
    }
</script>

<div class="worklist-page">
    <div class="page-header">
        <div class="header-actions">
            <input 
                type="text" 
                class="search-input" 
                placeholder="Search patient name or hospital no..." 
                bind:value={searchQuery}
            />
            <DateFilterDropdown 
                startDate={dateStartFilter}
                endDate={dateEndFilter}
                selectedPreset={datePreset}
                on:change={handleDateFilterChange}
            />
            <select class="status-filter" bind:value={selectedStatus} on:change={loadData}>
                {#each worklistStatuses as status}
                    <option value={status.value}>{status.label}</option>
                {/each}
            </select>
            <select class="priority-filter" bind:value={selectedPriority} on:change={applyFilters}>
                {#each priorityOptions as priority}
                    <option value={priority.value}>{priority.label}</option>
                {/each}
            </select>
            <select class="modality-filter" bind:value={selectedModality} on:change={loadData}>
                <option value="">All Modalities</option>
                {#each modalities as mod}
                    <option value={mod}>{mod}</option>
                {/each}
            </select>
            {#if searchQuery || datePreset !== 'all' || selectedPriority !== 'ALL'}
                <button class="btn-clear" on:click={clearFilters} title="Clear filters">
                    Clear
                </button>
            {/if}
            {#if canCreateWorklist}
                <button class="btn-primary" on:click={openAddModal}>
                    + Add Patient
                </button>
            {/if}
        </div>
    </div>
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
    
    {#if loading}
        <div class="loading">Loading worklist...</div>
    {:else if filteredItems.length === 0}
        <div class="empty-state">
            {#if worklistItems.length === 0}
                <p>No items in worklist{selectedStatus !== 'ALL' ? ` with status "${worklistStatuses.find(s => s.value === selectedStatus)?.label}"` : ''}</p>
            {:else}
                <p>No items match your filters</p>
                <button class="btn-clear" on:click={clearFilters}>Clear Filters</button>
            {/if}
        </div>
    {:else}
        <div class="worklist-table-container">
            <table class="worklist-table">
                <thead>
                    <tr>
                        <th>Report ID</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Patient</th>
                        <th>Hospital No</th>
                        <th>Modality</th>
                        <th>Body Region</th>
                        <th>Study Date</th>
                        <th>Picked Up By</th>
                        <th>Signed Off By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredItems as item}
                        {@const displayStatus = getDisplayStatus(item)}
                        <tr class={getPriorityClass(item.priority)}>
                            <td class="report-id-cell">{item.reportId ? `R-${item.reportId}` : '-'}</td>
                            <td>
                                <span class="priority-badge {getPriorityClass(item.priority)}">
                                    {item.priority}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge {displayStatus.class}">
                                    {displayStatus.label}
                                </span>
                            </td>
                            <td>{item.patientFirstName} {item.patientLastName}</td>
                            <td>{item.patientHospitalNumber}</td>
                            <td>{formatModality(item.modality)}</td>
                            <td>{item.bodyRegion || '-'}</td>
                            <td>{formatDate(item.studyDate)}</td>
                            <td>{formatDoctorName(item.pickedUpByName)}</td>
                            <td>{formatDoctorName(item.reviewedByName || item.signedByName)}</td>
                            <td class="actions-cell">
                                <div class="action-buttons">
                                    {#if item.status === 'PENDING' && canPickup}
                                        <button class="btn-action btn-pickup" on:click={() => pickupItem(item.id)} title="Start Report">
                                            Start Report
                                        </button>
                                    {:else if item.status === 'IN_PROGRESS' && item.reportId}
                                        <button class="btn-action btn-view" on:click={() => goto(`/reporting?reportId=${item.reportId}`)} title="View Report">
                                            View Report
                                        </button>
                                    {:else if item.status === 'COMPLETED' && item.reportId}
                                        <button class="btn-action btn-view" on:click={() => goto(`/reporting?reportId=${item.reportId}`)} title="View Report">
                                            View Report
                                        </button>
                                    {/if}
                                    {#if item.status === 'PENDING' && canEditWorklist}
                                        <button class="btn-action btn-edit" on:click={() => openEditModal(item)} title="Edit">
                                            Edit
                                        </button>
                                    {/if}
                                    {#if item.status === 'PENDING' && canDeleteWorklist}
                                        <button class="btn-action btn-delete" on:click={() => confirmDelete(item)} title="Delete">
                                            Delete
                                        </button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

{#if showAddModal}
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-container">
            <div class="modal-header">
                <h2 id="modal-title">Add Patient to Worklist</h2>
                <button class="modal-close" on:click={closeModal} aria-label="Close modal">&times;</button>
            </div>
            
            <div class="modal-body">
                {#if validationErrors.length > 0}
                    <div class="validation-errors">
                        <ul>
                            {#each validationErrors as err}
                                <li>{err}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                
                <div class="form-section">
                    <h3>Patient Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input 
                                type="text" 
                                id="firstName" 
                                bind:value={newPatient.firstName} 
                                placeholder="First name"
                                class:error={validationErrors.some(e => e.includes('First name'))}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                bind:value={newPatient.lastName} 
                                placeholder="Last name"
                                class:error={validationErrors.some(e => e.includes('Last name'))}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="hospitalNumber">Hospital Number *</label>
                            <input 
                                type="text" 
                                id="hospitalNumber" 
                                bind:value={newPatient.hospitalNumber} 
                                placeholder="Hospital Number"
                                class:error={validationErrors.some(e => e.includes('Hospital Number'))}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="sex">Sex *</label>
                            <select 
                                id="sex" 
                                bind:value={newPatient.sex}
                                class:error={validationErrors.some(e => e.includes('Sex'))}
                            >
                                <option value="">Select sex</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="dateOfBirth">Date of Birth</label>
                            <input 
                                type="date" 
                                id="dateOfBirth" 
                                bind:value={newPatient.dateOfBirth}
                                on:change={handleDateOfBirthChange}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="age">Age</label>
                            <div class="age-input-group">
                                <input 
                                    type="number" 
                                    id="age" 
                                    bind:value={newPatient.age} 
                                    placeholder="Age"
                                    min="0"
                                    class="age-number"
                                />
                                <select bind:value={newPatient.ageUnit} class="age-unit">
                                    <option value="years">Years</option>
                                    <option value="months">Months</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Study Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="modality">Modality *</label>
                            <select 
                                id="modality" 
                                bind:value={newPatient.modality}
                                on:change={handleModalityChange}
                                class:error={validationErrors.some(e => e.includes('Modality'))}
                            >
                                <option value="">Select modality</option>
                                {#each modalities as mod}
                                    <option value={mod}>{mod}</option>
                                {/each}
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="bodyRegion">Body Region</label>
                            <select 
                                id="bodyRegion" 
                                bind:value={newPatient.bodyRegion}
                                on:change={handleBodyRegionChange}
                                disabled={!newPatient.modality || newPatient.modality === 'custom'}
                            >
                                <option value="">Select body region</option>
                                {#each availableBodyRegions as region}
                                    <option value={region}>{region}</option>
                                {/each}
                                {#if newPatient.modality && newPatient.modality !== 'custom'}
                                    <option value="custom">Custom...</option>
                                {/if}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="priority">Priority</label>
                            <select id="priority" bind:value={newPatient.priority}>
                                <option value="ROUTINE">Routine</option>
                                <option value="URGENT">Urgent</option>
                                <option value="STAT">STAT</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="studyDate">Study Date</label>
                            <input 
                                type="date" 
                                id="studyDate" 
                                bind:value={newPatient.studyDate}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="referringPhysician">Referring Physician</label>
                            <input 
                                type="text" 
                                id="referringPhysician" 
                                bind:value={newPatient.referringPhysician}
                                placeholder="Dr. Name"
                            />
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="indication">Clinical Indication</label>
                        <textarea 
                            id="indication" 
                            bind:value={newPatient.indication}
                            rows="3"
                            placeholder="Reason for study, clinical history..."
                        ></textarea>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" on:click={closeModal}>Cancel</button>
                <button class="btn-primary" on:click|stopPropagation|preventDefault={addToWorklist} type="button">Add to Worklist</button>
            </div>
        </div>
    </div>
{/if}

{#if showCustomModal}
    <div class="modal-overlay custom-modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-container custom-modal">
            <div class="modal-header">
                <h2>Custom Entry</h2>
                <button class="modal-close" on:click={closeCustomModal} aria-label="Close modal">&times;</button>
            </div>
            
            <div class="modal-body">
                {#if newPatient.modality === 'custom'}
                <div class="form-group">
                    <label for="customModality">Custom Modality</label>
                    <input 
                        id="customModality" 
                        type="text" 
                        bind:value={customModality} 
                        placeholder="Enter custom modality"
                    />
                </div>
                {/if}
                
                {#if newPatient.bodyRegion === 'custom'}
                <div class="form-group">
                    <label for="customRegion">Custom Body Region</label>
                    <input 
                        id="customRegion" 
                        type="text" 
                        bind:value={customRegion} 
                        placeholder="Enter custom body region (e.g., Lumbosacral, Ankle)"
                    />
                </div>
                
                <div class="form-group">
                    <label>Select Modalities (where this region should appear) *</label>
                    <div class="modality-checkboxes">
                        {#each availableModalitiesForCustomRegion as modality}
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedCustomModalities.includes(modality.value.toLowerCase().replace('-', '').replace(' ', ''))}
                                on:change={() => toggleCustomModality(modality.value.toLowerCase().replace('-', '').replace(' ', ''))}
                            />
                            <span>{modality.label}</span>
                        </label>
                        {/each}
                    </div>
                    <small class="help-text">Check all modalities where "{customRegion || 'this region'}" should appear</small>
                </div>
                {/if}
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" on:click={closeCustomModal}>Cancel</button>
                <button class="btn-primary" on:click={saveCustomSelections}>Save</button>
            </div>
        </div>
    </div>
{/if}

{#if showEditModal && editingItem}
    <div class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-container edit-modal">
            <div class="modal-header">
                <h2>Edit Worklist Entry</h2>
                <button class="modal-close" on:click={closeEditModal} aria-label="Close modal">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="form-section">
                    <h3>Patient Information (Read-Only)</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Patient Name</label>
                            <input type="text" value="{editingItem.firstName} {editingItem.lastName}" disabled />
                        </div>
                        <div class="form-group">
                            <label>Hospital Number</label>
                            <input type="text" value={editingItem.hospitalNumber} disabled />
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Study Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-modality">Modality</label>
                            <select id="edit-modality" bind:value={editingItem.modality}>
                                {#each modalities as mod}
                                    <option value={mod}>{mod}</option>
                                {/each}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-bodyRegion">Body Region</label>
                            <select id="edit-bodyRegion" bind:value={editingItem.bodyRegion}>
                                <option value="">Select body region</option>
                                {#each (bodyRegionsByModality[editingItem.modality] || []) as region}
                                    <option value={region}>{region}</option>
                                {/each}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-priority">Priority</label>
                            <select id="edit-priority" bind:value={editingItem.priority}>
                                <option value="ROUTINE">Routine</option>
                                <option value="URGENT">Urgent</option>
                                <option value="STAT">STAT</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-studyDate">Study Date</label>
                            <input type="date" id="edit-studyDate" bind:value={editingItem.studyDate} />
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-referringPhysician">Referring Physician</label>
                            <input type="text" id="edit-referringPhysician" bind:value={editingItem.referringPhysician} placeholder="Dr. Name" />
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="edit-indication">Clinical Indication</label>
                        <textarea id="edit-indication" bind:value={editingItem.indication} rows="3" placeholder="Reason for study, clinical history..."></textarea>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" on:click={closeEditModal}>Cancel</button>
                <button class="btn-primary" on:click={saveEdit}>Save Changes</button>
            </div>
        </div>
    </div>
{/if}

{#if showDeleteConfirm && deletingItem}
    <div class="modal-overlay delete-confirm-overlay" role="dialog" aria-modal="true">
        <div class="modal-container delete-confirm-modal">
            <div class="modal-header delete-header">
                <h2>Confirm Delete</h2>
                <button class="modal-close" on:click={cancelDelete} aria-label="Close modal">&times;</button>
            </div>
            
            <div class="modal-body">
                <p class="delete-warning">Are you sure you want to delete this worklist entry?</p>
                <div class="delete-details">
                    <p><strong>Patient:</strong> {deletingItem.patientFirstName} {deletingItem.patientLastName}</p>
                    <p><strong>Hospital No:</strong> {deletingItem.patientHospitalNumber}</p>
                    <p><strong>Study:</strong> {deletingItem.modality} - {deletingItem.bodyRegion || 'Not specified'}</p>
                </div>
                <p class="delete-note">This action cannot be undone.</p>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" on:click={cancelDelete}>Cancel</button>
                <button class="btn-danger" on:click={deleteItem}>Delete</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .worklist-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: var(--text-primary);
    }
    
    .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .modality-filter {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        cursor: pointer;
    }
    
    :global([data-theme="dark"]) .modality-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .modality-filter option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .modality-filter option {
        background: #1e293b;
        color: #f1f5f9;
    }
    
    .priority-filter {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        cursor: pointer;
    }
    
    :global([data-theme="dark"]) .priority-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .priority-filter option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .priority-filter option {
        background: #1e293b;
        color: #f1f5f9;
    }
    
    .search-input {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        min-width: 250px;
    }
    
    :global([data-theme="dark"]) .search-input {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .search-input::placeholder {
        color: var(--color-text-secondary, #6b7280);
    }
    
    :global([data-theme="dark"]) .search-input::placeholder {
        color: #94a3b8;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--color-primary, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .date-filter-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }
    
    .date-filter {
        padding: 0.5rem 2.5rem 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        cursor: pointer;
    }
    
    :global([data-theme="dark"]) .date-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .date-filter::-webkit-calendar-picker-indicator {
        opacity: 0;
        position: absolute;
        right: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
    
    .calendar-icon {
        position: absolute;
        right: 0.75rem;
        width: 18px;
        height: 18px;
        pointer-events: none;
        color: var(--color-text-secondary, #6b7280);
    }
    
    :global([data-theme="dark"]) .calendar-icon {
        color: #94a3b8;
    }
    
    .date-filter:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .btn-clear {
        padding: 0.5rem 1rem;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
    }
    
    .btn-clear:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }
    
    .btn-primary {
        padding: 0.5rem 1rem;
        background: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .btn-primary:hover {
        background: var(--primary-hover, #2563eb);
    }
    
    .btn-secondary {
        padding: 0.5rem 1rem;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .btn-secondary:hover {
        background: var(--bg-hover);
    }
    
    .btn-action {
        padding: 0.4rem 0.75rem;
        background: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
    }
    
    .btn-action:hover {
        background: var(--primary-hover, #2563eb);
    }
    
    .error-message {
        background: #fef2f2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    
    .loading, .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .worklist-table-container {
        overflow-x: auto;
    }
    
    .worklist-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--bg-primary);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .worklist-table th,
    .worklist-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    
    .worklist-table th {
        background: var(--bg-secondary);
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .report-id-cell {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .worklist-table tbody tr:hover {
        background: #f9fafb;
    }
    
    :global([data-theme="dark"]) .worklist-table tbody tr:hover {
        background: #f9fafb;
    }
    
    :global([data-theme="dark"]) .worklist-table tbody tr:hover td {
        color: #1e293b;
    }
    
    .priority-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .priority-stat {
        background: #fef2f2;
        color: #dc2626;
    }
    
    .priority-urgent {
        background: #fffbeb;
        color: #d97706;
    }
    
    .priority-routine {
        background: #f0fdf4;
        color: #16a34a;
    }
    
    .status-filter {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        cursor: pointer;
        font-size: 0.875rem;
    }
    
    :global([data-theme="dark"]) .status-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .status-filter option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .status-filter option {
        background: #1e293b;
        color: #f1f5f9;
    }
    
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
    }
    
    .status-pending {
        background: #fef9c3;
        color: #854d0e;
    }
    
    .status-in-progress {
        background: #dbeafe;
        color: #1d4ed8;
    }
    
    .status-submitted {
        background: #e0e7ff;
        color: #4338ca;
    }
    
    .status-completed {
        background: #dcfce7;
        color: #15803d;
    }
    
    .status-signed {
        background: #d1fae5;
        color: #047857;
    }
    
    .status-cancelled {
        background: #fef2f2;
        color: #b91c1c;
    }
    
    .status-default {
        background: #f3f4f6;
        color: #4b5563;
    }
    
    .btn-view {
        background: #6366f1;
        color: white;
    }
    
    .btn-view:hover {
        background: #4f46e5;
    }
    
    .indication-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        z-index: 10001;
        padding: 1rem;
        animation: fadeIn 0.15s ease-out;
    }
    
    .modal-container {
        background: var(--color-surface, #ffffff);
        border-radius: 0.75rem;
        width: 100%;
        max-width: 950px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        color: var(--color-text-primary, #1e293b);
        animation: slideIn 0.15s ease-out;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-primary, #1e293b);
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--color-text-secondary, #475569);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        transition: background-color 0.15s ease-in-out;
    }
    
    .modal-close:hover {
        background: var(--color-surface-hover, #f8fafc);
        color: var(--color-text-primary, #1e293b);
    }
    
    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--color-border, #e2e8f0);
        background: transparent;
        border-radius: 0 0 0.75rem 0.75rem;
    }
    
    .modal-footer .btn-secondary {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-secondary, #475569);
        border: 1px solid var(--color-border, #e2e8f0);
    }
    
    .modal-footer .btn-secondary:hover {
        background: var(--color-surface-hover, #f8fafc);
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .modal-footer .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .modal-footer .btn-primary:hover {
        background: #2563eb;
    }
    
    .form-section {
        margin-bottom: 1.5rem;
    }
    
    .form-section:last-child {
        margin-bottom: 0;
    }
    
    .form-section h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: var(--color-text-primary, #1e293b);
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    .form-group label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--color-text-primary, #1e293b);
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        padding: 0.625rem;
        border: 2px solid var(--color-border, #e2e8f0);
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1e293b);
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .form-group input::placeholder,
    .form-group textarea::placeholder {
        color: var(--color-text-muted, #94a3b8);
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .form-group input.error,
    .form-group select.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .age-input-group {
        display: flex;
        gap: 0.5rem;
    }
    
    .age-input-group .age-number {
        flex: 2;
    }
    
    .age-input-group .age-unit {
        flex: 1;
        min-width: 90px;
    }
    
    .validation-errors {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
    }
    
    .validation-errors ul {
        margin: 0;
        padding-left: 1.25rem;
        color: #dc2626;
        font-size: 0.875rem;
    }
    
    .validation-errors li {
        margin-bottom: 0.25rem;
    }
    
    .validation-errors li:last-child {
        margin-bottom: 0;
    }
    
    .custom-modal-overlay {
        z-index: 10002;
    }
    
    .custom-modal {
        max-width: 500px;
    }
    
    .modality-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: var(--color-surface-secondary, #f9fafb);
        border-radius: 6px;
        border: 1px solid var(--color-border, #e2e8f0);
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: var(--color-text-primary, #1e293b);
        font-size: 0.875rem;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background-color 0.15s ease;
    }
    
    .checkbox-label:hover {
        background: var(--color-surface-hover, #f8fafc);
    }
    
    .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #3b82f6;
        cursor: pointer;
    }
    
    .help-text {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: var(--color-text-muted, #64748b);
        font-style: italic;
    }
    
    .form-group select:disabled {
        background: var(--color-surface-secondary, #f1f5f9);
        color: var(--color-text-muted, #94a3b8);
        cursor: not-allowed;
    }
    
    .form-group input:disabled {
        background: var(--color-surface-secondary, #f1f5f9);
        color: var(--color-text-muted, #64748b);
        cursor: not-allowed;
    }
    
    .actions-cell {
        min-width: 180px;
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .btn-action {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.15s ease;
    }
    
    .btn-pickup {
        background: #3b82f6;
        color: white;
    }
    
    .btn-pickup:hover {
        background: #2563eb;
    }
    
    .btn-edit {
        background: #f59e0b;
        color: white;
    }
    
    .btn-edit:hover {
        background: #d97706;
    }
    
    .btn-delete {
        background: #ef4444;
        color: white;
    }
    
    .btn-delete:hover {
        background: #dc2626;
    }
    
    .btn-danger {
        padding: 0.5rem 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .btn-danger:hover {
        background: #dc2626;
    }
    
    .edit-modal {
        max-width: 600px;
    }
    
    .delete-confirm-overlay {
        z-index: 10003;
    }
    
    .delete-confirm-modal {
        max-width: 450px;
    }
    
    .delete-header h2 {
        color: #dc2626;
    }
    
    .delete-details {
        background: var(--color-surface-secondary, #f9fafb);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .delete-details p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #475569);
    }
    
    .delete-warning {
        font-size: 1rem;
        color: var(--color-text-primary, #1e293b);
        margin-bottom: 1rem;
    }
    
    .delete-note {
        font-size: 0.875rem;
        color: #ef4444;
        font-weight: 500;
    }

    /* Dark theme overrides for modals */
    :global([data-theme="dark"]) .modal-container {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .modal-footer .btn-secondary {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .modal-footer .btn-secondary:hover {
        background: #334155;
    }

    :global([data-theme="dark"]) .modal-close:hover {
        background: #334155;
    }

    :global([data-theme="dark"]) .checkbox-label:hover {
        background: #334155;
    }

    :global([data-theme="dark"]) .form-group input,
    :global([data-theme="dark"]) .form-group select,
    :global([data-theme="dark"]) .form-group textarea {
        background: #1e293b;
        border-color: #475569;
    }

    :global([data-theme="dark"]) .form-group select:disabled,
    :global([data-theme="dark"]) .form-group input:disabled {
        background: #334155;
    }

    :global([data-theme="dark"]) .modality-checkboxes {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .form-group input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }

    :global([data-theme="dark"]) .validation-errors {
        background: #450a0a;
        border-color: #7f1d1d;
    }

    :global([data-theme="dark"]) .validation-errors ul {
        color: #fca5a5;
    }
</style>
