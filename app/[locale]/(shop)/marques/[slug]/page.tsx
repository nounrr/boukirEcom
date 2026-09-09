import { catalogMetadata, catalogRoute, type CatalogProps } from '@/lib/catalog/route'
export const generateMetadata = (props: CatalogProps) => catalogMetadata('marques', props)
export default function Page(props: CatalogProps) { return catalogRoute('marques', props) }
