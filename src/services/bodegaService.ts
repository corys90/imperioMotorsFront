export interface Bodega {
  id_bodega: number
  id_usuario: number
  id_sucursal: number
  desc_bodega: string
  fecha_creacion: string
  fecha_mod: string
  activo: boolean
}

export type BodegaCreateInput = Omit<Bodega, 'id_bodega' | 'fecha_creacion' | 'fecha_mod' | 'activo'> & {
  activo?: boolean
}

export type BodegaUpdateInput = Partial<BodegaCreateInput>

export interface BodegaListResponse {
  total: number
  page: number
  page_size: number
  results: Bodega[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getBodegas(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  activo?: boolean,
  idSucursal?: number
): Promise<BodegaListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (activo !== undefined) params.append('activo', activo.toString())
  if (idSucursal !== undefined) params.append('id_sucursal', idSucursal.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener bodegas')
  }
  return response.json()
}

export async function getBodegaById(id: number): Promise<Bodega> {
  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener la bodega')
  }
  return response.json()
}

export async function createBodega(data: BodegaCreateInput): Promise<Bodega> {
  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear la bodega')
  }
  return response.json()
}

export async function updateBodega(id: number, data: BodegaUpdateInput): Promise<Bodega> {
  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar la bodega')
  }
  return response.json()
}

export async function deleteBodega(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar la bodega')
  }
  return response.json()
}

export async function toggleBodegaStatus(id: number): Promise<Bodega> {
  const response = await fetch(`${apiBaseUrl}/api/v1/bodegas/${id}/toggle-status`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al cambiar estado de la bodega')
  }
  return response.json()
}
