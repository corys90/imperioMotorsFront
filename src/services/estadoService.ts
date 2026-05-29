export interface Estado {
  id_estado: number
  id_usuario: number
  desc_estado: string
  fec_creacion: string
  fec_mod?: string
  activo: boolean
}

export type EstadoCreateInput = Omit<Estado, 'id_estado' | 'fec_creacion' | 'fec_mod' | 'activo'> & {
  activo?: boolean
}

export type EstadoUpdateInput = Partial<EstadoCreateInput>

export interface EstadoListResponse {
  total: number
  page: number
  page_size: number
  results: Estado[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getEstados(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  activo?: boolean
): Promise<EstadoListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (activo !== undefined) params.append('activo', activo.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/estados/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener estados')
  }
  return response.json()
}

export async function getEstadoById(id: number): Promise<Estado> {
  const response = await fetch(`${apiBaseUrl}/api/v1/estados/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el estado')
  }
  return response.json()
}

export async function createEstado(data: EstadoCreateInput): Promise<Estado> {
  const response = await fetch(`${apiBaseUrl}/api/v1/estados/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el estado')
  }
  return response.json()
}

export async function updateEstado(id: number, data: EstadoUpdateInput): Promise<Estado> {
  const response = await fetch(`${apiBaseUrl}/api/v1/estados/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el estado')
  }
  return response.json()
}

export async function deleteEstado(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/estados/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el estado')
  }
  return response.json()
}

export async function toggleEstadoStatus(id: number): Promise<Estado> {
  const response = await fetch(`${apiBaseUrl}/api/v1/estados/${id}/toggle-status`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al cambiar estado')
  }
  return response.json()
}
