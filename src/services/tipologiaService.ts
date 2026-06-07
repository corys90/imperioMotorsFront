export interface Tipologia {
  id_tipos: string
  id_usuario: string
  Desc_tipo: string
  fec_mod: string
}

export type TipologiaCreateInput = Omit<Tipologia, 'fec_mod'>
export type TipologiaUpdateInput = Partial<TipologiaCreateInput>

export interface TipologiaListResponse {
  total: number
  page: number
  page_size: number
  results: Tipologia[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getTipologias(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<TipologiaListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)

  const response = await fetch(`${apiBaseUrl}/api/v1/tipos/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener tipologias')
  }
  return response.json()
}

export async function getTipologiaById(id: string): Promise<Tipologia> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tipos/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener la tipologia')
  }
  return response.json()
}

export async function createTipologia(data: TipologiaCreateInput): Promise<Tipologia> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tipos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear la tipologia')
  }
  return response.json()
}

export async function updateTipologia(id: string, data: TipologiaUpdateInput): Promise<Tipologia> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tipos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar la tipologia')
  }
  return response.json()
}

export async function deleteTipologia(id: string): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tipos/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar la tipologia')
  }
  return response.json()
}
