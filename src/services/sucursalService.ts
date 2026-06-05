export interface Sucursal {
  id_sucursal: number
  id_usuario: number
  nom_sucursal: string
  dir_sucursal?: string
  tel_cel?: string
  fec_mod?: string
}

export type SucursalCreateInput = Omit<Sucursal, 'id_sucursal' | 'fec_mod'>

export type SucursalUpdateInput = Partial<SucursalCreateInput>

export interface SucursalListResponse {
  total: number
  page: number
  page_size: number
  results: Sucursal[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getSucursales(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<SucursalListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)

  const response = await fetch(`${apiBaseUrl}/api/v1/sucursales/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener sucursales')
  }
  return response.json()
}

export async function getSucursalById(id: number): Promise<Sucursal> {
  const response = await fetch(`${apiBaseUrl}/api/v1/sucursales/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener la sucursal')
  }
  return response.json()
}

export async function createSucursal(data: SucursalCreateInput): Promise<Sucursal> {
  const response = await fetch(`${apiBaseUrl}/api/v1/sucursales/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear la sucursal')
  }
  return response.json()
}

export async function updateSucursal(id: number, data: SucursalUpdateInput): Promise<Sucursal> {
  const response = await fetch(`${apiBaseUrl}/api/v1/sucursales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar la sucursal')
  }
  return response.json()
}

export async function deleteSucursal(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/sucursales/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar la sucursal')
  }
  return response.json()
}
