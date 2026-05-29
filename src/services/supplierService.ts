export interface Supplier {
  id: number
  document_type?: string
  document_number: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  country?: string
  website?: string
  bank_name?: string
  bank_account?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export type SupplierCreateInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
  is_active?: boolean
}

export type SupplierUpdateInput = Partial<SupplierCreateInput>

export interface SupplierListResponse {
  total: number
  page: number
  page_size: number
  results: Supplier[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getSuppliers(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  isActive?: boolean
): Promise<SupplierListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)
  if (isActive !== undefined) params.append('is_active', isActive.toString())

  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener proveedores')
  }
  return response.json()
}

export async function getSupplierById(id: number): Promise<Supplier> {
  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el proveedor')
  }
  return response.json()
}

export async function createSupplier(data: SupplierCreateInput): Promise<Supplier> {
  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el proveedor')
  }
  return response.json()
}

export async function updateSupplier(id: number, data: SupplierUpdateInput): Promise<Supplier> {
  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el proveedor')
  }
  return response.json()
}

export async function deleteSupplier(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el proveedor')
  }
  return response.json()
}

export async function toggleSupplierStatus(id: number): Promise<Supplier> {
  const response = await fetch(`${apiBaseUrl}/api/v1/suppliers/${id}/toggle-status`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al cambiar estado del proveedor')
  }
  return response.json()
}
