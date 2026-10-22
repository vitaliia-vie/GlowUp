import { ServiceCategory } from "@/types";

export type ServiceSuggestion = {
  title: string;
  category: ServiceCategory;
  durationMinutes: number;
};

// [title, default duration in minutes]
type Entry = [string, number];

export const SPECIALIZATIONS: Record<ServiceCategory, string[]> = {
  nails: [
    "Nail technician",
    "Manicurist",
    "Pedicurist",
    "Nail artist",
    "Nail designer",
    "Gel polish specialist",
    "Acrylic nail technician",
    "Nail extension specialist",
    "Hardware manicure specialist",
    "Medical pedicure specialist (podologist)",
  ],
  lashes: [
    "Lash technician",
    "Lash artist",
    "Lash extension specialist",
    "Lash lift & tint specialist",
    "Lash & brow stylist",
  ],
  hair: [
    "Hairdresser",
    "Hair stylist",
    "Colorist",
    "Women's hairdresser",
    "Kids' hairdresser",
    "Bridal hairstylist",
    "Hair braider",
    "Hair extension specialist",
    "Keratin & hair treatment specialist",
    "Trichologist",
  ],
  barber: [
    "Barber",
    "Men's hairdresser",
    "Beard stylist",
    "Classic barber",
    "Fade specialist",
  ],
  brows: [
    "Brow artist",
    "Brow stylist",
    "Brow lamination specialist",
    "Microblading artist",
    "Permanent makeup artist",
  ],
  makeup: [
    "Makeup artist",
    "Bridal makeup artist",
    "Event makeup artist",
    "Photoshoot makeup artist",
    "Visagiste",
    "Makeup & hair stylist",
  ],
  skincare: [
    "Esthetician",
    "Cosmetologist",
    "Facial specialist",
    "Skin therapist",
    "Acne specialist",
    "Microneedling specialist",
    "Chemical peel specialist",
  ],
  hairRemoval: [
    "Waxing specialist",
    "Sugaring specialist",
    "Depilation specialist",
    "Laser hair removal technician",
    "Electrolysis specialist",
  ],
  massage: [
    "Massage therapist",
    "Sports massage therapist",
    "Relaxation massage therapist",
    "Lymphatic drainage therapist",
    "Anti-cellulite massage specialist",
    "Thai massage therapist",
    "Reflexologist",
    "Prenatal massage therapist",
  ],
  body: [
    "Spa therapist",
    "Body treatment specialist",
    "Body wrap specialist",
    "Body sculpting specialist",
    "Spray tan technician",
  ],
};

const SERVICE_CATALOG: Record<ServiceCategory, Entry[]> = {
  nails: [
    ["Manicure", 45],
    ["Hardware manicure", 60],
    ["Manicure with gel polish", 90],
    ["French manicure", 75],
    ["Men's manicure", 40],
    ["Spa manicure", 70],
    ["Gel polish removal", 30],
    ["Nail extensions", 120],
    ["Nail extension infill", 100],
    ["Nail extension removal", 40],
    ["Acrylic nails", 120],
    ["Nail strengthening", 60],
    ["Nail art design", 30],
    ["Cuticle care", 30],
    ["Nail repair (single nail)", 15],
    ["Paraffin hand treatment", 20],
    ["Pedicure", 60],
    ["Hardware pedicure", 75],
    ["Pedicure with gel polish", 105],
    ["Express pedicure", 40],
    ["Medical pedicure", 75],
    ["Spa pedicure", 85],
  ],
  lashes: [
    ["Classic lash extensions", 120],
    ["Volume lash extensions", 150],
    ["Hybrid lash extensions", 135],
    ["Lash extension infill", 90],
    ["Lash extension removal", 30],
    ["Lash lift", 60],
    ["Lash lift and tint", 75],
    ["Lash tinting", 30],
    ["Lash lamination", 60],
  ],
  hair: [
    ["Women's haircut", 60],
    ["Men's haircut", 40],
    ["Kids' haircut", 30],
    ["Haircut with styling", 75],
    ["Hair trim (ends)", 30],
    ["Bangs trim", 15],
    ["Blow-dry styling", 40],
    ["Evening hairstyle", 75],
    ["Bridal hairstyle", 120],
    ["Braids", 60],
    ["Hair coloring (one tone)", 120],
    ["Roots touch-up", 90],
    ["Highlights", 150],
    ["Balayage", 180],
    ["Ombre", 180],
    ["Toning", 60],
    ["Hair lightening", 150],
    ["Keratin hair treatment", 150],
    ["Botox for hair", 120],
    ["Hair lamination", 90],
    ["Hair extensions", 180],
    ["Hair extension removal", 60],
    ["Scalp treatment", 45],
    ["Hair perm", 120],
    ["Hair straightening", 120],
  ],
  barber: [
    ["Men's haircut", 40],
    ["Fade haircut", 50],
    ["Clipper cut", 25],
    ["Boys' haircut", 30],
    ["Beard trim", 25],
    ["Beard shaping", 30],
    ["Hot towel shave", 40],
    ["Haircut and beard", 70],
    ["Head shave", 30],
    ["Hair and beard coloring", 60],
    ["Men's hair styling", 20],
  ],
  brows: [
    ["Brow shaping", 30],
    ["Brow tinting", 30],
    ["Brow shaping and tinting", 45],
    ["Brow lamination", 60],
    ["Brow henna", 45],
    ["Brow correction", 20],
    ["Microblading", 150],
    ["Powder brows", 150],
    ["Permanent brow touch-up", 90],
  ],
  makeup: [
    ["Daytime makeup", 45],
    ["Evening makeup", 60],
    ["Bridal makeup", 90],
    ["Bridal trial makeup", 90],
    ["Prom makeup", 60],
    ["Photoshoot makeup", 75],
    ["Makeup with lashes", 70],
    ["Makeup lesson", 90],
    ["Hairstyle and makeup package", 150],
  ],
  skincare: [
    ["Facial cleansing", 60],
    ["Deep facial cleansing", 75],
    ["Ultrasonic facial cleansing", 45],
    ["Hydrating facial", 60],
    ["Anti-aging facial", 75],
    ["Acne treatment", 60],
    ["Chemical peel", 45],
    ["Microneedling", 60],
    ["Dermaplaning", 45],
    ["Facial massage", 40],
    ["Back facial", 60],
    ["LED light therapy", 30],
    ["Face mask treatment", 30],
  ],
  hairRemoval: [
    ["Full leg waxing", 45],
    ["Half leg waxing", 30],
    ["Underarm waxing", 15],
    ["Arm waxing", 30],
    ["Bikini waxing", 30],
    ["Brazilian waxing", 45],
    ["Back waxing", 30],
    ["Upper lip waxing", 10],
    ["Facial waxing", 20],
    ["Full leg sugaring", 50],
    ["Underarm sugaring", 20],
    ["Bikini sugaring", 35],
    ["Brazilian sugaring", 50],
    ["Laser hair removal (small area)", 20],
    ["Laser hair removal (large area)", 45],
    ["Electrolysis session", 30],
  ],
  massage: [
    ["Classic massage", 60],
    ["Back massage", 30],
    ["Neck and shoulder massage", 30],
    ["Full body massage", 90],
    ["Relaxing massage", 60],
    ["Sports massage", 60],
    ["Deep tissue massage", 60],
    ["Anti-cellulite massage", 45],
    ["Lymphatic drainage massage", 60],
    ["Hot stone massage", 75],
    ["Aromatherapy massage", 60],
    ["Thai massage", 90],
    ["Foot massage (reflexology)", 30],
    ["Prenatal massage", 60],
    ["Cupping massage", 45],
    ["Head massage", 20],
    ["Hand massage", 15],
    ["Kids' massage", 30],
  ],
  body: [
    ["Body wrap", 60],
    ["Body scrub", 45],
    ["Mud body treatment", 60],
    ["Body sculpting", 60],
    ["Spray tan", 30],
    ["Spa ritual", 90],
    ["Hand and foot spa", 60],
    ["Paraffin treatment", 30],
  ],
};

// Which category does a saved specialization belong to? (for preselecting in the profile)
export function findSpecializationCategory(
  value?: string,
): ServiceCategory | null {
  const needle = value?.trim().toLowerCase();
  if (!needle) return null;

  for (const category of Object.keys(SPECIALIZATIONS) as ServiceCategory[]) {
    if (SPECIALIZATIONS[category].some((s) => s.toLowerCase() === needle)) {
      return category;
    }
  }
  return null;
}

// No query: every service of the chosen category.
// With a query: matches across ALL categories, the chosen category first.
export function getServiceSuggestions(
  query: string,
  category: ServiceCategory,
  limit = 12,
): ServiceSuggestion[] {
  const toSuggestion = (
    cat: ServiceCategory,
    [title, durationMinutes]: Entry,
  ): ServiceSuggestion => ({ title, category: cat, durationMinutes });

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return SERVICE_CATALOG[category].map((entry) =>
      toSuggestion(category, entry),
    );
  }

  const matches: ServiceSuggestion[] = [];
  for (const cat of Object.keys(SERVICE_CATALOG) as ServiceCategory[]) {
    for (const entry of SERVICE_CATALOG[cat]) {
      const title = entry[0].toLowerCase();
      if (tokens.every((token) => title.includes(token))) {
        matches.push(toSuggestion(cat, entry));
      }
    }
  }

  const exact = query.trim().toLowerCase();
  return matches
    .filter((m) => m.title.toLowerCase() !== exact)
    .sort(
      (a, b) =>
        Number(b.category === category) - Number(a.category === category),
    )
    .slice(0, limit);
}