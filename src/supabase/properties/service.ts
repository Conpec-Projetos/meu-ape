import { supabaseAdmin } from "@/lib/supabase/client.server"
import { TablesInsert } from "@/supabase/types/types"

// Tipagem para os filtros da sua página de busca
export type PropertySearchFilters = {
  query?: string // Para nome ou endereço
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minBaths?: number
  minGarages?: number
  status?: string
}

type SearchProps = {
  filters: PropertySearchFilters
  page?: number
  limit?: number
}

// A FUNÇÃO DE BUSCA COMPLEXA QUE VOCÊ QUERIA
export async function searchProperties({
  filters,
  page = 1,
  limit = 12,
}: SearchProps) {
  // Começamos selecionando os imóveis e fazendo o JOIN com a tabela 'developers'
  let query = supabaseAdmin
    .from("properties")
    .select(
      `
      id,
      name,
      address,
      status,
      min_price,
      max_price,
      min_size,
      max_size,
      min_bedrooms,
      developers ( name, logo_url )
    `,
      { count: "exact" } // Crucial para a paginação!
    )

  // Aplicação dinâmica dos filtros
  if (filters.query) {
    // Busca por nome ou endereço
    query = query.ilike("name", `%${filters.query}%`) // ou .textSearch()
  }
  if (filters.minPrice) {
    query = query.gte("min_price", filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.lte("max_price", filters.maxPrice)
  }
  if (filters.minBedrooms) {
    // Assumindo que você denormalizou 'min_bedrooms' na tabela 'properties'
    query = query.gte("min_bedrooms", filters.minBedrooms)
  }
  if (filters.minBaths) {
    query = query.gte("min_baths", filters.minBaths) // Assumindo denormalização
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  // Paginação
  const from = (page - 1) * limit
  const to = page * limit - 1
  query = query.range(from, to)

  // Executa a query
  const { data, error, count } = await query

  if (error) {
    console.error("Error searching properties:", error.message)
    throw new Error(error.message)
  }

  return {
    data,
    total: count ?? 0,
    totalPages: count ? Math.ceil(count / limit) : 1,
    currentPage: page,
  }
}

export async function getPropertyDetails(id: string) {
  // Busca um imóvel e suas unidades
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      `
      *,
      developers ( * ),
      units ( * )
    `
    )
    .eq("id", id)
    .single() // Espera um único resultado

  if (error) {
    console.error("Error fetching property details:", error.message)
    return null
  }

  return data
}

export async function createProperty(
  propertyData: TablesInsert<"properties">,
  unitsData: TablesInsert<"units">[]
) {
  // Exemplo de transação (usando RPC ou múltiplas chamadas)
  // 1. Cria a 'property'
  const { data: property, error: propError } = await supabaseAdmin
    .from("properties")
    .insert(propertyData)
    .select()
    .single()

  if (propError || !property) {
    console.error("Error creating property:", propError?.message)
    throw new Error(propError?.message || "Failed to create property")
  }

  // 2. Associa as 'units' à property criada
  const unitsWithPropertyId = unitsData.map((unit) => ({
    ...unit,
    property_id: property.id,
  }))

  const { error: unitsError } = await supabaseAdmin
    .from("units")
    .insert(unitsWithPropertyId)

  if (unitsError) {
    // Idealmente, você deletaria a property criada (rollback manual)
    console.error("Error creating units:", unitsError.message)
    await supabaseAdmin.from("properties").delete().eq("id", property.id) // Rollback
    throw new Error(unitsError.message)
  }

  return property
}
