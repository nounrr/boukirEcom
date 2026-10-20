import PaymentResultClient from "./payment-result-client"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null

// Page de retour du paiement par carte Chaabi Payment (CMI).
// Le backend y redirige le client après okUrl / failUrl (statut vérifié par le HASH CMI).
export default async function PaymentResultPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <PaymentResultClient
      status={first(params.status)}
      orderNumber={first(params.order)}
      token={first(params.token)}
    />
  )
}
