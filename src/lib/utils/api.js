export async function apiFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    mergedOptions.body = JSON.stringify(options.body);
  }
  
  return fetch(url, mergedOptions);
}

export async function apiGet(url) {
  return apiFetch(url, { method: 'GET' });
}

export async function apiPost(url, body) {
  return apiFetch(url, { method: 'POST', body });
}

export async function apiPatch(url, body) {
  return apiFetch(url, { method: 'PATCH', body });
}

export async function apiPut(url, body) {
  return apiFetch(url, { method: 'PUT', body });
}

export async function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
}
