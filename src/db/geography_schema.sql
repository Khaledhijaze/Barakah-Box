-- ==============================================================================
-- BARAKAH BOX PLATFORM (صندوق بركة) - SUPABASE POSTGRESQL SCHEMA
-- BILINGUAL GEOGRAPHY & LOCATION SUBSYSTEM (GOVERNORATES & DISTRICTS)
-- Dynamic Database-Driven Location Hierarchy (AR / EN)
-- ==============================================================================

-- 1. Syrian Governorates Table
CREATE TABLE IF NOT EXISTS public.governorates (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'damascus', 'aleppo', 'homs'
    name_ar VARCHAR(100) NOT NULL, -- e.g. 'محافظة دمشق'
    name_en VARCHAR(100) NOT NULL, -- e.g. 'Damascus Governorate'
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Syrian Districts & Neighborhoods Table
CREATE TABLE IF NOT EXISTS public.districts (
    id VARCHAR(60) PRIMARY KEY, -- e.g. 'dam_mazzeh', 'alp_aziziyah'
    governorate_id VARCHAR(50) NOT NULL REFERENCES public.governorates(id) ON DELETE CASCADE,
    name_ar VARCHAR(150) NOT NULL, -- e.g. 'المزة (الفيلات والشرقية)'
    name_en VARCHAR(150) NOT NULL, -- e.g. 'Al-Mazzeh (Villas & East)'
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for rapid lookup
CREATE INDEX IF NOT EXISTS idx_districts_governorate_id ON public.districts(governorate_id);
CREATE INDEX IF NOT EXISTS idx_governorates_active ON public.governorates(is_active);

-- 3. Compatibility View for wallets_table
CREATE OR REPLACE VIEW public.wallets_table AS 
SELECT 
    user_id,
    full_name,
    phone_number,
    governorate,
    balance_syp,
    is_frozen,
    updated_at
FROM public.user_wallets;

-- ==============================================================================
-- 4. INITIAL SEEDING: ALL SYRIAN GOVERNORATES (BILINGUAL AR/EN)
-- ==============================================================================
INSERT INTO public.governorates (id, name_ar, name_en, lat, lng, is_active)
VALUES
    ('damascus', 'محافظة دمشق', 'Damascus Governorate', 33.5138, 36.2765, true),
    ('rif_dimashq', 'محافظة ريف دمشق', 'Rif Dimashq Governorate', 33.5422, 36.3888, true),
    ('aleppo', 'محافظة حلب', 'Aleppo Governorate', 36.2021, 37.1343, true),
    ('homs', 'محافظة حمص', 'Homs Governorate', 34.7324, 36.7137, true),
    ('latakia', 'محافظة اللاذقية', 'Latakia Governorate', 35.5317, 35.7901, true),
    ('hama', 'محافظة حماة', 'Hama Governorate', 35.1318, 36.7578, true),
    ('tartous', 'محافظة طرطوس', 'Tartous Governorate', 34.8890, 35.8866, true),
    ('daraa', 'محافظة درعا', 'Daraa Governorate', 32.6255, 36.1055, true),
    ('suwayda', 'محافظة السويداء', 'As-Suwayda Governorate', 32.7090, 36.5695, true),
    ('quneitra', 'محافظة القنيطرة', 'Quneitra Governorate', 33.1258, 35.8242, true),
    ('deir_ez_zor', 'محافظة دير الزور', 'Deir ez-Zor Governorate', 35.3359, 40.1408, true),
    ('hasakah', 'محافظة الحسكة', 'Al-Hasakah Governorate', 36.5023, 40.7513, true),
    ('raqqa', 'محافظة الرقة', 'Raqqa Governorate', 35.9526, 39.0125, true),
    ('idlib', 'محافظة إدلب', 'Idlib Governorate', 35.9306, 36.6339, true)
ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng;

-- ==============================================================================
-- 5. INITIAL SEEDING: SUB-DISTRICTS & NEIGHBORHOODS (BILINGUAL AR/EN)
-- ==============================================================================
INSERT INTO public.districts (id, governorate_id, name_ar, name_en, lat, lng, is_active)
VALUES
    -- Damascus Districts
    ('dam_mazzeh', 'damascus', 'المزة (الفيلات والشرقية)', 'Al-Mazzeh (Villas & East)', 33.5012, 36.2550, true),
    ('dam_shaalan', 'damascus', 'الشعلان والصالحية', 'Al-Shaalan & Al-Salhiyeh', 33.5189, 36.2910, true),
    ('dam_midan', 'damascus', 'الميدان وباب سريجة', 'Al-Midan & Bab Srija', 33.4920, 36.2990, true),
    ('dam_malki', 'damascus', 'المالكي وأبو رمانة', 'Al-Malki & Abu Roumaneh', 33.5210, 36.2810, true),
    ('dam_qassaa', 'damascus', 'القصاع وباب توما', 'Al-Qassaa & Bab Touma', 33.5150, 36.3150, true),
    ('dam_kafrsouseh', 'damascus', 'كفرسوسة واللوان', 'Kafr Sousa & Al-Liwan', 33.4980, 36.2750, true),
    ('dam_baramkeh', 'damascus', 'البرامكة وجامعة دمشق', 'Al-Baramkeh & Damascus Univ.', 33.5090, 36.2890, true),
    ('dam_dummar', 'damascus', 'مشروع دمر وجزيرة 16', 'Dummar Project & Island 16', 33.5410, 36.2350, true),

    -- Rif Dimashq Districts
    ('rif_jaramana', 'rif_dimashq', 'جرمانا ودوار الباسل', 'Jaramana & Al-Basel Square', 33.4880, 36.3550, true),
    ('rif_qudsaya', 'rif_dimashq', 'قدسيا وضاحية قدسيا', 'Qudsaya & Qudsaya Suburb', 33.5650, 36.2200, true),
    ('rif_sehnaya', 'rif_dimashq', 'صحنايا وأشرفية صحنايا', 'Sahnaya & Ashrafiyat Sahnaya', 33.4150, 36.2500, true),
    ('rif_kisweh', 'rif_dimashq', 'الكسوة والخيارة', 'Al-Kiswah & Al-Khyara', 33.3610, 36.2410, true),

    -- Aleppo Districts
    ('alp_aziziyah', 'aleppo', 'العزيزية ومحطة بغداد', 'Al-Aziziyah & Baghdad Station', 36.2120, 37.1510, true),
    ('alp_shahba', 'aleppo', 'الشهباء الجديدة وحلب الجديدة', 'New Shahbaa & New Aleppo', 36.2250, 37.1150, true),
    ('alp_sulaimaniyah', 'aleppo', 'السليمانية والجميلية', 'Al-Sulaimaniyah & Al-Jamiliyah', 36.2150, 37.1420, true),
    ('alp_furqan', 'aleppo', 'الفرقان وجامعة حلب', 'Al-Furqan & Aleppo Univ.', 36.2050, 37.1210, true),

    -- Homs Districts
    ('hms_dublan', 'homs', 'شارع الدبلان والمركز التجاري', 'Al-Dublan St & City Center', 34.7310, 36.7110, true),
    ('hms_inshaat', 'homs', 'الإنشاءات وحي الوعر', 'Al-Inshaat & Al-Waer', 34.7210, 36.6850, true),
    ('hms_hamra', 'homs', 'شارع الحمرا والغوطة', 'Al-Hamra St & Al-Ghouta', 34.7290, 36.7020, true),

    -- Latakia Districts
    ('lat_baghdad', 'latakia', 'شارع بغداد والشيخ ضاهر', 'Baghdad Street & Sheikh Daher', 35.5250, 35.7890, true),
    ('lat_corniche', 'latakia', 'الكورنيش الجنوبي والشاطئ الأزرق', 'South Corniche & Blue Beach', 35.5450, 35.7720, true),
    ('lat_ziraa', 'latakia', 'مشروع الزراعة والأوقاف', 'Al-Ziraa Project & Awqaf', 35.5380, 35.8050, true),
    ('lat_slibeh', 'latakia', 'الصليبة وباب مريود', 'Al-Slibeh & Bab Maryoud', 35.5190, 35.7810, true),

    -- Hama Districts
    ('ham_assi', 'hama', 'ساحة العاصي والنواعير', 'Al-Assi Square & Waterwheels', 35.1320, 36.7550, true),
    ('ham_dabbagha', 'hama', 'حي الدباغة والشريعة', 'Al-Dabbagha & Al-Sharia', 35.1410, 36.7620, true),
    ('ham_hadir', 'hama', 'الحاضر الكبير والبارودية', 'Al-Hadir & Al-Baroudiyeh', 35.1380, 36.7590, true),

    -- Tartous Districts
    ('tar_corniche', 'tartous', 'الكورنيش البحري والميناء', 'Sea Corniche & Port', 34.8870, 35.8820, true),
    ('tar_thawra', 'tartous', 'شارع الثورة ومشفى الباسل', 'Al-Thawra St & Al-Basel Hosp.', 34.8940, 35.8910, true)
ON CONFLICT (id) DO UPDATE SET
    governorate_id = EXCLUDED.governorate_id,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng;

-- ==============================================================================
-- 6. CONSUMER DYNAMIC REWARD RULES (ADMIN-CONFIGURABLE MILESTONES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reward_rules (
    id VARCHAR(50) PRIMARY KEY,
    tier_level INT NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    criteria_type VARCHAR(50) NOT NULL DEFAULT 'boxes_count', -- 'boxes_count' or 'spent_amount'
    target_threshold NUMERIC(12, 2) NOT NULL,
    reward_amount_syp NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reward_rules_active ON public.reward_rules(is_active);

INSERT INTO public.reward_rules (id, tier_level, title_ar, title_en, criteria_type, target_threshold, reward_amount_syp, is_active, description_ar, description_en)
VALUES
    ('reward-tier-1', 1, 'المستوى الأول: وسام بطل حفظ النعمة البرونزي', 'Tier 1: Bronze Food Hero Milestone', 'boxes_count', 10, 5000, true, 'أنقذ 10 سلال بركة واحصل فورياً على رصيد 5,000 ل.س في محفظتك الإلكترونية.', 'Save 10 Barakah boxes to receive a 5,000 SYP electronic wallet credit instantly.'),
    ('reward-tier-2', 2, 'المستوى الثاني: وسام بطل حفظ النعمة الفضي', 'Tier 2: Silver Food Hero Milestone', 'boxes_count', 25, 15000, true, 'أنقذ 25 سلة بركة واحصل على رصيد 15,000 ل.س في محفظتك الإلكترونية.', 'Save 25 Barakah boxes to receive a 15,000 SYP electronic wallet credit.'),
    ('reward-tier-3', 3, 'المستوى الثالث: وسام درع الاستدامة الذهبي', 'Tier 3: Golden Sustainability Shield', 'boxes_count', 50, 35000, true, 'أنقذ 50 سلة بركة واحصل على رصيد 35,000 ل.س مع شحن وتوصيل مجاني مدى الحياة.', 'Save 50 Barakah boxes to receive 35,000 SYP wallet credit and free lifetime delivery.'),
    ('reward-tier-spending', 4, 'شريحة كبار المنقذين وحجم المشتريات (Spend Threshold)', 'Top Rescuer Spending Volume Tier', 'spent_amount', 100000, 10000, true, 'عند تجاوز إجمالي الإنقاذ 100,000 ل.س، يحصل المستهلك على استرداد نقدي 10,000 ل.س بالمحفظة.', 'When total rescue volume exceeds 100,000 SYP, earn a 10,000 SYP direct wallet bonus.')
ON CONFLICT (id) DO UPDATE SET
    tier_level = EXCLUDED.tier_level,
    title_ar = EXCLUDED.title_ar,
    title_en = EXCLUDED.title_en,
    criteria_type = EXCLUDED.criteria_type,
    target_threshold = EXCLUDED.target_threshold,
    reward_amount_syp = EXCLUDED.reward_amount_syp,
    is_active = EXCLUDED.is_active;
