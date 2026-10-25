function csrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('XSRF-TOKEN='))

  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null
}

export async function adminRequest(path, options = {}) {
  let response

  try {
    response = await fetch(path, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.method && options.method !== 'GET'
          ? { 'X-XSRF-TOKEN': csrfToken() || '' }
          : {}),
      },
    })
  } catch {
    throw new Error('Lidhja me serverin nuk u realizua. Provoni përsëri.')
  }

  if (!response.ok) {
    let details = {}
    try {
      details = await response.json()
    } catch {
      // A server error may not contain JSON.
    }
    const error = new Error(
      response.status === 401
        ? 'Sesioni ka përfunduar. Hyni përsëri.'
        : response.status === 403
          ? 'Nuk keni qasje në administrim.'
          : response.status === 419
            ? 'Sesioni ka skaduar. Rifreskoni faqen dhe provoni përsëri.'
            : response.status === 429
              ? 'Shumë përpjekje për hyrje. Prisni pak dhe provoni përsëri.'
              : response.status === 422
                ? details.message || 'Të dhënat nuk janë të vlefshme.'
                : 'Kërkesa nuk u realizua. Provoni përsëri.'
    )
    error.status = response.status
    error.errors = details.errors || {}
    throw error
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Përgjigjja nuk mund të lexohet. Provoni përsëri.')
  }
}

export async function loginAdmin(email, password) {
  let csrf
  try {
    csrf = await fetch('/sanctum/csrf-cookie', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error('Lidhja me serverin nuk u realizua. Provoni përsëri.')
  }

  if (!csrf.ok || !csrfToken()) {
    throw new Error(
      'Hyrja nuk u përgatit. Rifreskoni faqen dhe provoni përsëri.'
    )
  }

  return adminRequest('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logoutAdmin() {
  return adminRequest('/api/admin/logout', { method: 'POST' })
}
