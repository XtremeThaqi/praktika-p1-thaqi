export async function getJson(path, signal) {
  let response
  try {
    response = await fetch(path, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(
      'Lidhja me katalogun nuk u realizua. Ju lutemi, provoni përsëri.'
    )
  }
  if (!response.ok) {
    const error = new Error(
      response.status === 422
        ? 'Filtrat nuk janë të vlefshëm. Pastrojini dhe provoni përsëri.'
        : response.status === 404
          ? 'Biznesi nuk u gjet ose nuk është publikuar.'
          : 'Të dhënat nuk u ngarkuan. Ju lutemi, provoni përsëri.'
    )
    error.status = response.status
    throw error
  }
  return response.json()
}

export function safeWebsite(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
