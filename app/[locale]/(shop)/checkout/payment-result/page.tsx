import PaymentResultClient from "./payment-result-client"
import SoldePaymentResultClient from "./solde-payment-result-client"
import ServicePaymentResultClient from "./service-payment-result-client"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null

// Page de retour du paiement par carte Chaabi Payment (CMI).
// Le backend y redirige le client après okUrl / failUrl (statut vérifié par le HASH CMI).
export default async function PaymentResultPage({ searchParams }: Props) {
  const params = await searchParams
  if (first(params.service) === "1") return <ServicePaymentResultClient oid={first(params.oid)} returnStatus={first(params.status)} />
  if (first(params.solde) === "1") return <SoldePaymentResultClient oid={first(params.oid)} returnStatus={first(params.status)} />
  return (
    <PaymentResultClient
      status={first(params.status)}
      orderNumber={first(params.order)}
      token={first(params.token)}
    />
  )
}
