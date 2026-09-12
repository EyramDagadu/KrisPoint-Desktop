<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { chatService } from '$lib/services/ChatService';
  import { browser } from '$app/environment';
  import { hasFeature, isLicenseActive } from '$lib/stores/licenseStore.js';
  
  $: hasChatFeature = hasFeature('chat');
  
  export let currentUserId = 0;
  
  let bubbleElement;
  let panelElement;
  let messagesContainer;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let position = { x: 0, y: 0 };
  let windowSize = { width: 1000, height: 800 };
  let newMessage = '';
  let initialized = false;
  let lastMessageCount = 0;
  
  const EDGE_SNAP_DISTANCE = 50;
  const BUBBLE_SIZE = 56;
  const PADDING = 16;
  
  const { users: usersStore, messages: messagesStore, selectedUserId: selectedUserIdStore, isOpen: isOpenStore, totalUnread: totalUnreadStore, unreadInfo: unreadInfoStore } = chatService;
  
  let searchQuery = '';
  
  $: users = $usersStore;
  $: messages = $messagesStore;
  $: selectedUserId = $selectedUserIdStore;
  $: isOpen = $isOpenStore;
  $: totalUnread = $totalUnreadStore;
  $: unreadInfo = $unreadInfoStore;
  
  $: selectedUser = users.find(u => u.id === selectedUserId);
  
  $: filteredUsers = users
    .filter(user => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const fullName = (user.fullName || '').toLowerCase();
      const title = (user.title || '').toLowerCase();
      return fullName.includes(query) || title.includes(query);
    })
    .sort((a, b) => {
      // Sort by unread count (descending), then by online status, then by name
      const aUnread = getUnreadForUser(a.id);
      const bUnread = getUnreadForUser(b.id);
      if (aUnread !== bUnread) return bUnread - aUnread;
      if (a.isOnline !== b.isOnline) return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  
  $: if (messages && messages.length !== lastMessageCount && messagesContainer) {
    lastMessageCount = messages.length;
    tick().then(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }
  
  onMount(() => {
    if (browser) {
      windowSize = { width: window.innerWidth, height: window.innerHeight };
      position = {
        x: windowSize.width - BUBBLE_SIZE - PADDING,
        y: windowSize.height - BUBBLE_SIZE - PADDING - 80
      };
      chatService.init();
      initialized = true;
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  });
  
  onDestroy(() => {
    if (browser) {
      chatService.destroy();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  });
  
  function handleBeforeUnload() {
    chatService.updatePresence(false);
  }
  
  function handleResize() {
    windowSize = { width: window.innerWidth, height: window.innerHeight };
    position = snapToEdge(position.x, position.y);
  }
  
  function startDrag(e) {
    if (isOpen) return;
    isDragging = true;
    const rect = bubbleElement.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);
  }
  
  function startDragTouch(e) {
    if (isOpen) return;
    isDragging = true;
    const touch = e.touches[0];
    const rect = bubbleElement.getBoundingClientRect();
    dragOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    document.addEventListener('touchmove', onDragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);
  }
  
  function onDrag(e) {
    if (!isDragging) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    position = constrainPosition(x, y);
  }
  
  function onDragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX - dragOffset.x;
    const y = touch.clientY - dragOffset.y;
    position = constrainPosition(x, y);
  }
  
  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    position = snapToEdge(position.x, position.y);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDragTouch);
    document.removeEventListener('touchend', endDrag);
  }
  
  function constrainPosition(x, y) {
    const maxX = windowSize.width - BUBBLE_SIZE - PADDING;
    const maxY = windowSize.height - BUBBLE_SIZE - PADDING;
    return {
      x: Math.max(PADDING, Math.min(x, maxX)),
      y: Math.max(PADDING, Math.min(y, maxY))
    };
  }
  
  function snapToEdge(x, y) {
    const viewWidth = windowSize.width;
    const viewHeight = windowSize.height;
    const centerX = x + BUBBLE_SIZE / 2;
    const centerY = y + BUBBLE_SIZE / 2;
    
    const distToLeft = centerX;
    const distToRight = viewWidth - centerX;
    const distToTop = centerY;
    const distToBottom = viewHeight - centerY;
    
    const minHorizontal = Math.min(distToLeft, distToRight);
    const minVertical = Math.min(distToTop, distToBottom);
    
    let newX = x;
    let newY = y;
    
    if (minHorizontal <= minVertical) {
      newX = distToLeft < distToRight ? PADDING : viewWidth - BUBBLE_SIZE - PADDING;
    } else {
      newY = distToTop < distToBottom ? PADDING : viewHeight - BUBBLE_SIZE - PADDING;
    }
    
    return constrainPosition(newX, newY);
  }
  
  function toggleChat() {
    if (!isDragging) {
      chatService.toggle();
    }
  }
  
  function selectUser(userId) {
    chatService.selectUser(userId);
  }
  
  function goBack() {
    chatService.clearSelection();
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || !selectedUserId) return;
    const content = newMessage;
    newMessage = '';
    await chatService.sendMessage(selectedUserId, content);
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  
  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    }
  }
  
  function formatDoctorName(fullName, title) {
    if (!fullName) return 'Unknown';
    const parts = fullName.trim().split(' ');
    const surname = parts[parts.length - 1];
    return title === 'Dr.' || title === 'Prof.' ? `Dr ${surname}` : fullName;
  }
  
  function getUnreadForUser(userId) {
    const sender = unreadInfo.unreadBySender?.find(s => s.senderId === userId);
    return sender?.count || 0;
  }
  
  function getLastSeen(lastSeenAt) {
    if (!lastSeenAt) return 'Never';
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  }
</script>

{#if initialized && hasChatFeature}
  <div 
    class="chat-bubble"
    bind:this={bubbleElement}
    style="left: {position.x}px; top: {position.y}px;"
    on:mousedown={startDrag}
    on:touchstart={startDragTouch}
    on:click={toggleChat}
    on:keydown={(e) => e.key === 'Enter' && toggleChat()}
    role="button"
    tabindex="0"
    class:dragging={isDragging}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    {#if totalUnread > 0}
      <span class="badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
    {/if}
  </div>
  
  {#if isOpen}
    <div 
      class="chat-panel"
      bind:this={panelElement}
      style="left: {Math.min(position.x, windowSize.width - 340)}px; bottom: {windowSize.height - position.y + 10}px;"
    >
      <div class="panel-header">
        {#if selectedUserId}
          <button class="back-btn" on:click={goBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-user">
            <span class="header-name">{formatDoctorName(selectedUser?.fullName, selectedUser?.title)}</span>
            <span class="header-status" class:online={selectedUser?.isOnline}>
              {selectedUser?.isOnline ? 'Online' : `Last seen ${getLastSeen(selectedUser?.lastSeenAt)}`}
            </span>
          </div>
        {:else}
          <span class="header-title">Messages</span>
          {@const onlineCount = users.filter(u => u.isOnline).length}
          {#if onlineCount > 0}
            <span class="online-count" title="{onlineCount} user{onlineCount !== 1 ? 's' : ''} online">{onlineCount} online</span>
          {/if}
        {/if}
        <button class="close-btn" on:click={() => chatService.close()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="panel-content">
        {#if selectedUserId}
          <div class="messages-list" bind:this={messagesContainer}>
            {#each messages as msg (msg.id)}
              <div class="message" class:sent={msg.senderId === currentUserId}>
                <div class="message-content">{msg.content}</div>
                <div class="message-time">{formatTime(msg.createdAt)}</div>
              </div>
            {:else}
              <div class="empty-messages">
                <p>No messages yet</p>
                <p class="hint">Send a message to start the conversation</p>
              </div>
            {/each}
          </div>
          
          <div class="message-input-area">
            <input 
              type="text" 
              bind:value={newMessage}
              on:keydown={handleKeydown}
              placeholder="Type a message..."
              class="message-input"
            />
            <button class="send-btn" on:click={sendMessage} disabled={!newMessage.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        {:else}
          <div class="search-container">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              bind:value={searchQuery}
              placeholder="Search users..."
              class="search-input"
            />
            {#if searchQuery}
              <button class="clear-search" on:click={() => searchQuery = ''} aria-label="Clear search">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            {/if}
          </div>
          <div class="users-list">
            {#each filteredUsers as user (user.id)}
              <button class="user-item" on:click={() => selectUser(user.id)}>
                <div class="user-avatar" class:online={user.isOnline}>
                  {user.fullName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div class="user-info">
                  <span class="user-name">{user.title ? `${user.title} ` : ''}{user.fullName || 'Unknown'}</span>
                  <span class="user-status">
                    {user.isOnline ? 'Online' : `Last seen ${getLastSeen(user.lastSeenAt)}`}
                  </span>
                </div>
                {#if getUnreadForUser(user.id) > 0}
                  <span class="user-badge">{getUnreadForUser(user.id)}</span>
                {/if}
              </button>
            {:else}
              <div class="empty-users">
                {#if searchQuery}
                  <p>No users match "{searchQuery}"</p>
                {:else}
                  <p>No other users available</p>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  .chat-bubble {
    position: fixed;
    z-index: 9999;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    user-select: none;
    touch-action: none;
  }
  
  .chat-bubble:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5);
  }
  
  .chat-bubble.dragging {
    cursor: grabbing;
    transform: scale(1.1);
  }
  
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }
  
  .chat-panel {
    position: fixed;
    z-index: 9998;
    width: 320px;
    height: 450px;
    background: var(--color-surface, #ffffff);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--color-border, #e5e7eb);
  }
  
  :global([data-theme="dark"]) .chat-panel {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .header-title {
    flex: 1;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .online-count {
    background: rgba(34, 197, 94, 0.3);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
    color: #bbf7d0;
  }
  
  .header-user {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .header-name {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .header-status {
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .header-status.online {
    opacity: 1;
  }
  
  .back-btn, .close-btn {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .back-btn:hover, .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .search-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #ffffff);
  }
  
  :global([data-theme="dark"]) .search-container {
    border-color: #334155;
    background: #1e293b;
  }
  
  .search-icon {
    color: var(--color-text-secondary, #6b7280);
    flex-shrink: 0;
  }
  
  :global([data-theme="dark"]) .search-icon {
    color: #94a3b8;
  }
  
  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    color: var(--color-text-primary, #1f2937);
    outline: none;
  }
  
  :global([data-theme="dark"]) .search-input {
    color: #f1f5f9;
  }
  
  .search-input::placeholder {
    color: var(--color-text-secondary, #9ca3af);
  }
  
  :global([data-theme="dark"]) .search-input::placeholder {
    color: #64748b;
  }
  
  .clear-search {
    background: transparent;
    border: none;
    color: var(--color-text-secondary, #6b7280);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  
  .clear-search:hover {
    color: var(--color-text-primary, #1f2937);
  }
  
  :global([data-theme="dark"]) .clear-search {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .clear-search:hover {
    color: #f1f5f9;
  }
  
  .users-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    width: 100%;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }
  
  .user-item:hover {
    background: var(--color-hover, #f3f4f6);
  }
  
  :global([data-theme="dark"]) .user-item:hover {
    background: #334155;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    position: relative;
  }
  
  :global([data-theme="dark"]) .user-avatar {
    background: #475569;
    color: #e2e8f0;
  }
  
  .user-avatar.online::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #22c55e;
    border-radius: 50%;
    border: 2px solid var(--color-surface, white);
  }
  
  :global([data-theme="dark"]) .user-avatar.online::after {
    border-color: #1e293b;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .user-name {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--color-text-primary, #1f2937);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  :global([data-theme="dark"]) .user-name {
    color: #f1f5f9;
  }
  
  .user-status {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #6b7280);
  }
  
  :global([data-theme="dark"]) .user-status {
    color: #94a3b8;
  }
  
  .user-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .messages-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .message {
    max-width: 80%;
    padding: 0.6rem 0.9rem;
    border-radius: 16px;
    position: relative;
  }
  
  .message.sent {
    align-self: flex-end;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  .message:not(.sent) {
    align-self: flex-start;
    background: var(--color-hover, #f3f4f6);
    color: var(--color-text-primary, #1f2937);
    border-bottom-left-radius: 4px;
  }
  
  :global([data-theme="dark"]) .message:not(.sent) {
    background: #334155;
    color: #f1f5f9;
  }
  
  .message-content {
    font-size: 0.9rem;
    line-height: 1.4;
    word-break: break-word;
  }
  
  .message-time {
    font-size: 0.65rem;
    opacity: 0.7;
    margin-top: 4px;
    text-align: right;
  }
  
  .empty-messages, .empty-users {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #6b7280);
    text-align: center;
    padding: 2rem;
  }
  
  :global([data-theme="dark"]) .empty-messages,
  :global([data-theme="dark"]) .empty-users {
    color: #94a3b8;
  }
  
  .empty-messages p:first-child,
  .empty-users p {
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }
  
  .hint {
    font-size: 0.8rem;
    opacity: 0.7;
  }
  
  .message-input-area {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #ffffff);
  }
  
  :global([data-theme="dark"]) .message-input-area {
    border-color: #334155;
    background: #1e293b;
  }
  
  .message-input {
    flex: 1;
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 20px;
    font-size: 0.9rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    outline: none;
    transition: border-color 0.2s;
  }
  
  :global([data-theme="dark"]) .message-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
  
  .message-input:focus {
    border-color: #3b82f6;
  }
  
  .message-input::placeholder {
    color: var(--color-text-secondary, #9ca3af);
  }
  
  :global([data-theme="dark"]) .message-input::placeholder {
    color: #64748b;
  }
  
  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, opacity 0.2s;
  }
  
  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
