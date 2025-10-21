export type PropertyStatus = 'AVAILABLE' | 'UNAVAILABLE'


export interface Property {
  id: string
  title: string
  description: string
  imageUrl?: string
  address: string
  price: number
  status: PropertyStatus
}
