import { notFound } from 'next/navigation'

export default function ProductIndexRedirect() {
  // This route should not be used; redirect to 404 to avoid conflicts
  notFound()
}
