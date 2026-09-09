import type { AppLocale } from '@/i18n/locale'

// Shared positioning for general pages; product/category metadata stays specific.
export const constructionCopy: Record<AppLocale, {
  homeTitle: string
  shopTitle: string
  description: string
  keywords: string[]
}> = {
  fr: {
    homeTitle: 'Matériaux de construction et outillage à Tanger',
    shopTitle: 'Ciment, sable, étanchéité et outillage à Tanger',
    description: 'Boukir Diamond à Tanger : ciment, sable, étanchéité et bitume, colles et clips de carrelage, outillage pour granit et chantier. Catalogue en ligne au Maroc.',
    keywords: ['Boukir Diamond', 'matériaux de construction Tanger', 'matériel de construction Maroc', 'droguerie Tanger', 'quincaillerie Tanger', 'ciment Tanger', 'sable de construction Tanger', 'étanchéité Tanger', 'bitume zeft', 'outillage granit', 'colle carrelage', 'clips de nivellement carrelage', 'serre-joints', 'vis et chevilles plastique', 'Bosch', 'CAT', 'INGCO', 'Kerakoll'],
  },
  ar: {
    homeTitle: 'مواد البناء والأدوات في طنجة',
    shopTitle: 'الإسمنت والرمل والعزل المائي وأدوات البناء في طنجة',
    description: 'بوكِير دايموند في طنجة: إسمنت ورمل ومواد العزل المائي والبيتومين (الزفت)، لاصق وكليبس البلاط وأدوات الغرانيت والبناء. تصفح الكتالوج في المغرب.',
    keywords: ['بوكِير دايموند', 'مواد البناء طنجة', 'معدات البناء المغرب', 'دروكري طنجة', 'دروجري طنجة', 'إسمنت طنجة', 'سيمان طنجة', 'رمل البناء طنجة', 'رملة', 'العزل المائي', 'بيتومين', 'زفت', 'أدوات الغرانيت', 'لاصق البلاط', 'كليبس تسوية الزليج', 'سير جوان', 'براغي وروابط بلاستيكية', 'Bosch', 'CAT', 'INGCO', 'Kerakoll'],
  },
  en: {
    homeTitle: 'Building materials and tools in Tangier',
    shopTitle: 'Cement, sand, waterproofing and tools in Tangier',
    description: 'Boukir Diamond in Tangier: cement, building sand, waterproofing, bitumen, tile adhesives and levelling clips, granite and construction tools in Morocco.',
    keywords: ['Boukir Diamond', 'building materials Tangier', 'construction equipment Morocco', 'hardware Tangier', 'cement Tangier', 'building sand', 'waterproofing', 'bitumen', 'granite tools', 'tile adhesive', 'tile levelling clips', 'clamps', 'screws and plastic wall plugs', 'Bosch', 'CAT', 'INGCO', 'Kerakoll'],
  },
  zh: {
    homeTitle: '丹吉尔建筑材料与工具',
    shopTitle: '丹吉尔水泥、建筑用砂、防水材料与工具',
    description: 'Boukir Diamond 位于摩洛哥丹吉尔，提供水泥、建筑用砂、防水材料、沥青、瓷砖胶和找平卡扣，以及花岗岩加工与施工工具。在线浏览建筑材料和五金工具目录。',
    keywords: ['Boukir Diamond', '丹吉尔建筑材料', '摩洛哥施工设备', '丹吉尔五金工具', '水泥', '建筑用砂', '防水材料', '沥青', '花岗岩加工工具', '瓷砖胶', '瓷砖找平卡扣', '夹具', '螺丝和塑料膨胀管', 'Bosch', 'CAT', 'INGCO', 'Kerakoll'],
  },
}
