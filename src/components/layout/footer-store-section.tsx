'use client';

import { useMemo } from 'react';
import { ExternalLink, Mail, MapPin, Phone, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';

const DEFAULT_STORE_MAP_URL =
  'https://www.google.com/maps/place/BOUKIR+DIAMOND+CONSTUCTION+STORE/@35.7532036,-5.8421462,1453m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd0b87005196739b:0xfa8dc0aeae136e27!8m2!3d35.7532036!4d-5.8421462!16s%2Fg%2F11y45mc9yr?entry=ttu';
const DEFAULT_STORE_QUERY = 'BOUKIR DIAMOND CONSTUCTION STORE';

function buildEmbedUrl(query: string) {
  const safeQuery = query?.trim() ? query.trim() : 'Boukir';
  return `https://www.google.com/maps?q=${encodeURIComponent(safeQuery)}&output=embed`;
}

export function FooterStoreSection({
  className,
  title,
  description,
  openLabel,
  storeName = 'Boukir Diamond',
  contactTitle,
  contactDesc,
  labelPhone,
  labelEmail,
  labelAddress,
  labelHours,
  unavailableLabel,
}: {
  className?: string;
  title: string;
  description: string;
  openLabel: string;
  storeName?: string;
  contactTitle: string;
  contactDesc: string;
  labelPhone: string;
  labelEmail: string;
  labelAddress: string;
  labelHours: string;
  unavailableLabel: string;
}) {
  const mapsUrl = (process.env.NEXT_PUBLIC_STORE_MAP_URL || DEFAULT_STORE_MAP_URL).trim();
  const query = (process.env.NEXT_PUBLIC_STORE_MAP_QUERY || DEFAULT_STORE_QUERY).trim();
  const embedUrl = useMemo(() => buildEmbedUrl(query), [query]);

  const phone = (process.env.NEXT_PUBLIC_STORE_PHONE || '').trim();
  const email = (process.env.NEXT_PUBLIC_STORE_EMAIL || '').trim();
  const address = (process.env.NEXT_PUBLIC_STORE_ADDRESS || '').trim();
  const hours = (process.env.NEXT_PUBLIC_STORE_HOURS || '').trim();

  const hasContact = Boolean(phone || email || address || hours);

  return (
    <section className={cn('rounded-2xl border border-white/15 bg-white/5 p-6', className)}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10" aria-hidden="true">
              <MapPin className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold tracking-tight">{storeName}</h3>
              <p className="mt-0.5 text-xs text-white/75">{contactDesc}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold">{contactTitle}</div>

            {hasContact ? (
              <div className="mt-3 space-y-2 text-sm text-white/90">
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2 text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-white/70">{labelPhone}</span>
                    <span className="font-medium">{phone}</span>
                  </a>
                ) : null}

                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-white/70">{labelEmail}</span>
                    <span className="font-medium break-all">{email}</span>
                  </a>
                ) : null}

                {address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="text-white/70">{labelAddress}</div>
                      <div className="font-medium">{address}</div>
                    </div>
                  </div>
                ) : null}

                {hours ? (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="text-white/70">{labelHours}</div>
                      <div className="font-medium">{hours}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 text-xs text-white/70">{unavailableLabel}</div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 hover:border-white/25 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {openLabel}
            </a>

            <div className="text-xs text-white/75">
              <div className="font-semibold">{title}</div>
              <div className="mt-0.5">{description}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5">
          <iframe
            title={title}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[280px] w-full"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
