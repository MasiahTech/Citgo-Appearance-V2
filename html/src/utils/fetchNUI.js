let resourceName = 'citgo_AppearanceV2'

export function setResourceName(name) {
  if (name) resourceName = name
}

export const fetchNUI = async (eventName, data = {}) => {
  try {
    const r = await fetch(`https://${resourceName}/${eventName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await r.json()
  } catch {
    return null
  }
}
