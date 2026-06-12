export interface ProdProvee {
  Id: number
  id_usuario: number
  fec_mod: string
  id_producto: number
  id_proveedor: number
  Item_prod_provee: number
  Ultimo_precio_compra: number
  usuario?: {
    id: number
  }
  producto?: {
    id_producto: number
    Desc_producto: string
  }
  proveedor?: {
    id: number
    document_number: string
    company_name: string
  }
}

export interface ProdProveeCreateInput {
  Id: number
  id_usuario: number
  id_producto: number
  id_proveedor: number
  Item_prod_provee: number
  Ultimo_precio_compra: number
}

export type ProdProveeUpdateInput = Partial<Omit<ProdProveeCreateInput, 'Id'>>

export interface ProdProveeListResponse {
  total: number
  page: number
  page_size: number
  results: ProdProvee[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getProdProvees(
  page: number = 1,
  pageSize: number = 20,
  idProducto?: number,
  idProveedor?: number,
  idUsuario?: number
): Promise<ProdProveeListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (idProducto) params.append('id_producto', idProducto.toString())
  if (idProveedor) params.append('id_proveedor', idProveedor.toString())
  if (idUsuario) params.append('id_usuario', idUsuario.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/prod-provee/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener productos por proveedor')
  }
  return response.json()
}

export async function getProdProveeById(id: number): Promise<ProdProvee> {
  const response = await fetch(`${apiBaseUrl}/api/v1/prod-provee/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el producto proveedor')
  }
  return response.json()
}

export async function createProdProvee(data: ProdProveeCreateInput): Promise<ProdProvee> {
  const response = await fetch(`${apiBaseUrl}/api/v1/prod-provee/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el producto proveedor')
  }
  return response.json()
}

export async function updateProdProvee(id: number, data: ProdProveeUpdateInput): Promise<ProdProvee> {
  const response = await fetch(`${apiBaseUrl}/api/v1/prod-provee/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el producto proveedor')
  }
  return response.json()
}

export async function deleteProdProvee(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/prod-provee/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el producto proveedor')
  }
  return response.json()
}
