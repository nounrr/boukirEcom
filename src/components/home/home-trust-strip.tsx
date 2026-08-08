import Image from 'next/image'
import { BadgeCheck, ShieldCheck, Truck } from 'lucide-react'

export function HomeTrustStrip({
  deliveryTitle,
  deliveryDesc,
  paymentTitle,
  paymentDesc,
  qualityTitle,
  qualityDesc,
}: {
  deliveryTitle: string
  deliveryDesc: string
  paymentTitle: string
  paymentDesc: string
  qualityTitle: string
  qualityDesc: string
}) {
  const items = [
    { icon: Truck, title: deliveryTitle, desc: deliveryDesc },
    { icon: ShieldCheck, title: paymentTitle, desc: paymentDesc },
    { icon: BadgeCheck, title: qualityTitle, desc: qualityDesc },
  ]

  return (
    <section className="border-b border-border/60 bg-muted/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex flex-col gap-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <ul className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-8">
            {items.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2.5 lg:border-s lg:border-border/60 lg:ps-8">
            <Image
              src="/payments/visa.svg"
              alt="Visa"
              width={40}
              height={26}
              className="h-5 w-auto opacity-70"
            />
            <Image
              src="/payments/master-card.svg"
              alt="Mastercard"
              width={40}
              height={26}
              className="h-5 w-auto opacity-70"
            />
            <Image
              src="/payments/naps.png"
              alt="NAPS"
              width={40}
              height={26}
              className="h-5 w-auto opacity-70"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
