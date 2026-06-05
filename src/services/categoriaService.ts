export interface Categoria {
  id: number
  id_usuario: number
  desc_categoria: string
  fec_creacion: string
  fec_mod?: string
  activo: boolean
}

export type CategoriaCreateInput = Omit<Categoria, 'id' | 'fec_creacion' | 'fec_mod' | 'activo'> & {
  activo?: boolean
}

export type CategoriaUpdateInput = Partial<CategoriaCreateInput>

export interface CategoriaListResponse {
  total: number
  page: number
  page_size: number
  results: Categoria[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getCategorias(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  activo?: boolean
): Promise<CategoriaListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (activo !== undefined) params.append('activo', activo.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener categorias')
  }
  return response.json()
}

export async function getCategoriaById(id: number): Promise<Categoria> {
  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener la categoria')
  }
  return response.json()
}

export async function createCategoria(data: CategoriaCreateInput): Promise<Categoria> {
  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear la categoria')
  }
  return response.json()
}

export async function updateCategoria(id: number, data: CategoriaUpdateInput): Promise<Categoria> {
  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar la categoria')
  }
  return response.json()
}

export async function deleteCategoria(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar la categoria')
  }
  return response.json()
}

export async function toggleCategoriaStatus(id: number): Promise<Categoria> {
  const response = await fetch(`${apiBaseUrl}/api/v1/categorias/${id}/toggle-status`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al cambiar estado de la categoria')
  }
  return response.json()
}
