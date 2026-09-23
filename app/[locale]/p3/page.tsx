import { memberLinksRoute } from "@/components/links/member-links-route"

const route = memberLinksRoute("p3")

export const generateMetadata = route.generateMetadata
export default route.Page
