import { memberLinksRoute } from "@/components/links/member-links-route"

const route = memberLinksRoute("p2")

export const generateMetadata = route.generateMetadata
export default route.Page
