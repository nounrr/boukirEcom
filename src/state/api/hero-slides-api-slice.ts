import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type { HeroSlideApi, HeroSlidesRequest, HeroSlidesResponse } from '@/types/api/hero-slides';

export const heroSlidesApi = createApi({
  reducerPath: 'heroSlidesApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['HeroSlides'],
  endpoints: (builder) => ({
    getHeroSlides: builder.query<HeroSlideApi[], HeroSlidesRequest>({
      query: ({ locale, limit, now }) => {
        const params: Record<string, string | number> = { locale };
        if (typeof limit === 'number') params.limit = limit;
        if (typeof now === 'string' && now) params.now = now;

        return {
          url: API_CONFIG.ENDPOINTS.HERO_SLIDES,
          params,
        };
      },
      transformResponse: (response: HeroSlidesResponse | HeroSlideApi[] | any): HeroSlideApi[] => {
        const slides = response?.slides ?? response?.data?.slides ?? response?.data ?? response;
        return Array.isArray(slides) ? slides : [];
      },
      keepUnusedDataFor: 60,
      providesTags: [{ type: 'HeroSlides', id: 'LIST' }],
    }),
  }),
});

export const { useGetHeroSlidesQuery } = heroSlidesApi;
