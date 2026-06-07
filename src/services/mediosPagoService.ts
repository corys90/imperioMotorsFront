export interface MediosPago {
  id_Mpagos: number
  id_usuario: string
  Desc_Mpagos: string
  fec_mod: string
}

export interface MediosPagoCreateInput {
  id_Mpagos: number
  id_usuario: string
  Desc_Mpagos: string
}

export type MediosPagoUpdateInput = Partial<Omit<MediosPagoCreateInput, 'id_Mpagos'>>

export interface MediosPagoListResponse {
  total: number
  page: number
  page_size: number
  results: MediosPago[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

export async function getMediosPagos(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<MediosPagoListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) params.append('search', search)

  const response = await fetch(`${apiBaseUrl}/api/v1/medios-pago/?${params.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener medios de pago')
  }
  return response.json()
}

export async function getMedioPagoById(id: number): Promise<MediosPago> {
  const response = await fetch(`${apiBaseUrl}/api/v1/medios-pago/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al obtener el medio de pago')
  }
  return response.json()
}

export async function createMedioPago(data: MediosPagoCreateInput): Promise<MediosPago> {
  const response = await fetch(`${apiBaseUrl}/api/v1/medios-pago/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al crear el medio de pago')
  }
  return response.json()
}

export async function updateMedioPago(id: number, data: MediosPagoUpdateInput): Promise<MediosPago> {
  const response = await fetch(`${apiBaseUrl}/api/v1/medios-pago/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al actualizar el medio de pago')
  }
  return response.json()
}

export async function deleteMedioPago(id: number): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/medios-pago/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el medio de pago')
  }
  return response.json()
}
