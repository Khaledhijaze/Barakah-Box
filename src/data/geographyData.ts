export interface GovernorateItem {
  id: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
}

export interface DistrictItem {
  id: string;
  governorate_id: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
}

export const SYRIAN_GOVERNORATES: GovernorateItem[] = [
  { id: 'all', name_ar: 'جميع المحافظات السورية', name_en: 'All Syrian Governorates', lat: 34.8021, lng: 38.9968 },
  { id: 'damascus', name_ar: 'محافظة دمشق', name_en: 'Damascus Governorate', lat: 33.5138, lng: 36.2765 },
  { id: 'rif_dimashq', name_ar: 'محافظة ريف دمشق', name_en: 'Rif Dimashq Governorate', lat: 33.5422, lng: 36.3888 },
  { id: 'aleppo', name_ar: 'محافظة حلب', name_en: 'Aleppo Governorate', lat: 36.2021, lng: 37.1343 },
  { id: 'homs', name_ar: 'محافظة حمص', name_en: 'Homs Governorate', lat: 34.7324, lng: 36.7137 },
  { id: 'latakia', name_ar: 'محافظة اللاذقية', name_en: 'Latakia Governorate', lat: 35.5317, lng: 35.7901 },
  { id: 'hama', name_ar: 'محافظة حماة', name_en: 'Hama Governorate', lat: 35.1318, lng: 36.7578 },
  { id: 'tartous', name_ar: 'محافظة طرطوس', name_en: 'Tartous Governorate', lat: 34.8890, lng: 35.8866 },
  { id: 'daraa', name_ar: 'محافظة درعا', name_en: 'Daraa Governorate', lat: 32.6255, lng: 36.1055 },
  { id: 'suwayda', name_ar: 'محافظة السويداء', name_en: 'As-Suwayda Governorate', lat: 32.7090, lng: 36.5695 },
  { id: 'quneitra', name_ar: 'محافظة القنيطرة', name_en: 'Quneitra Governorate', lat: 33.1258, lng: 35.8242 },
  { id: 'deir_ez_zor', name_ar: 'محافظة دير الزور', name_en: 'Deir ez-Zor Governorate', lat: 35.3359, lng: 40.1408 },
  { id: 'hasakah', name_ar: 'محافظة الحسكة', name_en: 'Al-Hasakah Governorate', lat: 36.5023, lng: 40.7513 },
  { id: 'raqqa', name_ar: 'محافظة الرقة', name_en: 'Raqqa Governorate', lat: 35.9526, lng: 39.0125 },
  { id: 'idlib', name_ar: 'محافظة إدلب', name_en: 'Idlib Governorate', lat: 35.9306, lng: 36.6339 },
];

export const SYRIAN_DISTRICTS: DistrictItem[] = [
  // Damascus
  { id: 'dam_mazzeh', governorate_id: 'damascus', name_ar: 'المزة (الفيلات والشرقية)', name_en: 'Al-Mazzeh (Villas & East)', lat: 33.5012, lng: 36.2550 },
  { id: 'dam_shaalan', governorate_id: 'damascus', name_ar: 'الشعلان والصالحية', name_en: 'Al-Shaalan & Al-Salhiyeh', lat: 33.5189, lng: 36.2910 },
  { id: 'dam_midan', governorate_id: 'damascus', name_ar: 'الميدان وباب سريجة', name_en: 'Al-Midan & Bab Srija', lat: 33.4920, lng: 36.2990 },
  { id: 'dam_malki', governorate_id: 'damascus', name_ar: 'المالكي وأبو رمانة', name_en: 'Al-Malki & Abu Roumaneh', lat: 33.5210, lng: 36.2810 },
  { id: 'dam_qassaa', governorate_id: 'damascus', name_ar: 'القصاع وباب توما', name_en: 'Al-Qassaa & Bab Touma', lat: 33.5150, lng: 36.3150 },
  { id: 'dam_kafrsouseh', governorate_id: 'damascus', name_ar: 'كفرسوسة واللوان', name_en: 'Kafr Sousa & Al-Liwan', lat: 33.4980, lng: 36.2750 },
  { id: 'dam_baramkeh', governorate_id: 'damascus', name_ar: 'البرامكة وجامعة دمشق', name_en: 'Al-Baramkeh & Damascus Univ.', lat: 33.5090, lng: 36.2890 },
  { id: 'dam_dummar', governorate_id: 'damascus', name_ar: 'مشروع دمر وجزيرة 16', name_en: 'Dummar Project & Island 16', lat: 33.5410, lng: 36.2350 },

  // Rif Dimashq
  { id: 'rif_jaramana', governorate_id: 'rif_dimashq', name_ar: 'جرمانا ودوار الباسل', name_en: 'Jaramana & Al-Basel Square', lat: 33.4880, lng: 36.3550 },
  { id: 'rif_qudsaya', governorate_id: 'rif_dimashq', name_ar: 'قدسيا وضاحية قدسيا', name_en: 'Qudsaya & Qudsaya Suburb', lat: 33.5650, lng: 36.2200 },
  { id: 'rif_sehnaya', governorate_id: 'rif_dimashq', name_ar: 'صحنايا وأشرفية صحنايا', name_en: 'Sahnaya & Ashrafiyat Sahnaya', lat: 33.4150, lng: 36.2500 },
  { id: 'rif_kisweh', governorate_id: 'rif_dimashq', name_ar: 'الكسوة والخيارة', name_en: 'Al-Kiswah & Al-Khyara', lat: 33.3610, lng: 36.2410 },

  // Aleppo
  { id: 'alp_aziziyah', governorate_id: 'aleppo', name_ar: 'العزيزية ومحطة بغداد', name_en: 'Al-Aziziyah & Baghdad Station', lat: 36.2120, lng: 37.1510 },
  { id: 'alp_shahba', governorate_id: 'aleppo', name_ar: 'الشهباء الجديدة وحلب الجديدة', name_en: 'New Shahbaa & New Aleppo', lat: 36.2250, lng: 37.1150 },
  { id: 'alp_sulaimaniyah', governorate_id: 'aleppo', name_ar: 'السليمانية والجميلية', name_en: 'Al-Sulaimaniyah & Al-Jamiliyah', lat: 36.2150, lng: 37.1420 },
  { id: 'alp_furqan', governorate_id: 'aleppo', name_ar: 'الفرقان وجامعة حلب', name_en: 'Al-Furqan & Aleppo Univ.', lat: 36.2050, lng: 37.1210 },

  // Homs
  { id: 'hms_dublan', governorate_id: 'homs', name_ar: 'شارع الدبلان والمركز التجاري', name_en: 'Al-Dublan St & City Center', lat: 34.7310, lng: 36.7110 },
  { id: 'hms_inshaat', governorate_id: 'homs', name_ar: 'الإنشاءات وحي الوعر', name_en: 'Al-Inshaat & Al-Waer', lat: 34.7210, lng: 36.6850 },
  { id: 'hms_hamra', governorate_id: 'homs', name_ar: 'شارع الحمرا والغوطة', name_en: 'Al-Hamra St & Al-Ghouta', lat: 34.7290, lng: 36.7020 },

  // Latakia
  { id: 'lat_baghdad', governorate_id: 'latakia', name_ar: 'شارع بغداد والشيخ ضاهر', name_en: 'Baghdad Street & Sheikh Daher', lat: 35.5250, lng: 35.7890 },
  { id: 'lat_corniche', governorate_id: 'latakia', name_ar: 'الكورنيش الجنوبي والشاطئ الأزرق', name_en: 'South Corniche & Blue Beach', lat: 35.5450, lng: 35.7720 },
  { id: 'lat_ziraa', governorate_id: 'latakia', name_ar: 'مشروع الزراعة والأوقاف', name_en: 'Al-Ziraa Project & Awqaf', lat: 35.5380, lng: 35.8050 },
  { id: 'lat_slibeh', governorate_id: 'latakia', name_ar: 'الصليبة وباب مريود', name_en: 'Al-Slibeh & Bab Maryoud', lat: 35.5190, lng: 35.7810 },

  // Hama
  { id: 'ham_assi', governorate_id: 'hama', name_ar: 'ساحة العاصي والنواعير', name_en: 'Al-Assi Square & Waterwheels', lat: 35.1320, lng: 36.7550 },
  { id: 'ham_dabbagha', governorate_id: 'hama', name_ar: 'حي الدباغة والشريعة', name_en: 'Al-Dabbagha & Al-Sharia', lat: 35.1410, lng: 36.7620 },
  { id: 'ham_hadir', governorate_id: 'hama', name_ar: 'الحاضر الكبير والبارودية', name_en: 'Al-Hadir & Al-Baroudiyeh', lat: 35.1380, lng: 36.7590 },

  // Tartous
  { id: 'tar_corniche', governorate_id: 'tartous', name_ar: 'الكورنيش البحري والميناء', name_en: 'Sea Corniche & Port', lat: 34.8870, lng: 35.8820 },
  { id: 'tar_thawra', governorate_id: 'tartous', name_ar: 'شارع الثورة ومشفى الباسل', name_en: 'Al-Thawra St & Al-Basel Hosp.', lat: 34.8940, lng: 35.8910 },

  // Daraa
  { id: 'dar_balad', governorate_id: 'daraa', name_ar: 'درعا البلد وساحة الشهداء', name_en: 'Daraa Al-Balad & Martyrs Sq.', lat: 32.6180, lng: 36.1010 },
  { id: 'dar_mahatta', governorate_id: 'daraa', name_ar: 'درعا المحطة والسبيل', name_en: 'Daraa Station & Al-Sabeel', lat: 32.6280, lng: 36.1090 },

  // As-Suwayda
  { id: 'suw_center', governorate_id: 'suwayda', name_ar: 'مركز المدينة وساحة المشنقة', name_en: 'City Center & Mashnaqa Sq.', lat: 32.7090, lng: 36.5695 },
  { id: 'suw_maslakh', governorate_id: 'suwayda', name_ar: 'حي المسلخ ودوار العنقود', name_en: 'Al-Maslakh & Grape Cluster Sq.', lat: 32.7150, lng: 36.5750 },

  // Quneitra
  { id: 'qun_baath', governorate_id: 'quneitra', name_ar: 'مدينة البعث وخان أرنبة', name_en: 'Al-Baath City & Khan Arnaba', lat: 33.1258, lng: 35.8242 },

  // Deir ez-Zor
  { id: 'dez_furat', governorate_id: 'deir_ez_zor', name_ar: 'شارع النهر والشارع العام', name_en: 'River Street & Main Street', lat: 35.3359, lng: 40.1408 },

  // Al-Hasakah
  { id: 'has_center', governorate_id: 'hasakah', name_ar: 'مركز المدينة والقامشلي', name_en: 'City Center & Qamishli', lat: 36.5023, lng: 40.7513 },

  // Raqqa
  { id: 'raq_center', governorate_id: 'raqqa', name_ar: 'دوار النعيم وشارع المنصور', name_en: 'Al-Naim Sq & Al-Mansour St', lat: 35.9526, lng: 39.0125 },

  // Idlib
  { id: 'idl_center', governorate_id: 'idlib', name_ar: 'ساحة الساعة والشارع التجاري', name_en: 'Clock Square & Commercial St', lat: 35.9306, lng: 36.6339 },
];

/**
 * Calculates straight line distance in km between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Resolves Syrian Governorate and Neighborhood name from GPS coordinates
 */
export function resolveLocationFromCoords(lat: number, lng: number): { gov_ar: string; gov_en: string; dist_ar: string; dist_en: string } {
  let nearestDist = SYRIAN_DISTRICTS[0];
  let minDist = calculateDistanceKm(lat, lng, nearestDist.lat, nearestDist.lng);

  for (const dist of SYRIAN_DISTRICTS) {
    const d = calculateDistanceKm(lat, lng, dist.lat, dist.lng);
    if (d < minDist) {
      minDist = d;
      nearestDist = dist;
    }
  }

  const gov = SYRIAN_GOVERNORATES.find(g => g.id === nearestDist.governorate_id) || SYRIAN_GOVERNORATES[1];

  return {
    gov_ar: gov.name_ar.replace('محافظة ', ''),
    gov_en: gov.name_en.replace(' Governorate', ''),
    dist_ar: nearestDist.name_ar,
    dist_en: nearestDist.name_en
  };
}
