export interface ScoredLabelInfo {
  brand?: string | null;
  size?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  country_of_origin?: string | null;
  ethical_score?: number | null;
  environmental_score?: number | null;
  global_score?: number | null;
  imageUrl?: string | null;  
}

const materialScores: Record<string, number> = {

  "organic cotton": 85,
  "coton biologique": 85,
  cotton: 60,
  coton: 60,

  linen: 90,
  lin: 90,

  hemp: 92,
  chanvre: 92,

  ramie: 88,
  rami: 88,

  jute: 84,
  jute_fr: 84,

  kapok: 86,

  bamboo: 45,
  bambou: 45,

  lyocell: 78,
  tencel: 80,
  modal: 66,
  viscose: 52,
  rayon: 50,
  cupro: 70,
  acetate: 48,
  triacetate: 45,

  wool: 62,
  laine: 62,

  "recycled wool": 78,
  "laine recyclee": 78,

  cashmere: 42,
  cachemire: 42,

  mohair: 45,
  alpaca: 58,
  angora: 30,

  silk: 58,
  soie: 58,

  leather: 24,
  cuir: 24,

  suede: 22,
  daim: 22,

  fur: 5,
  fourrure: 5,

  polyester: 32,

  "recycled polyester": 68,
  "polyester recycle": 68,
  rpet: 68,

  nylon: 34,
  polyamide: 34,

  "recycled nylon": 65,

  acrylic: 25,
  acrylique: 25,

  elastane: 28,
  elasthanne: 28,
  spandex: 28,

  polypropylene: 30,
  polypropylene_fr: 30,

  pvc: 10,
  polyurethane: 20,
  pu: 20,

  neoprene: 18,

  econyl: 70,
  cirkulose: 82,
  refibra: 82,

  "orange fiber": 80,
  "banana fiber": 84,
  "pineapple fiber": 78,
  pina: 78,

  "apple leather": 72,
  "cactus leather": 75,
  "mushroom leather": 78,
  mycelium: 78,

  "lab-grown leather": 85,
};

const countryEthicalScores: Record<string, number> = {
  france: 82,
  germany: 82,
  allemagne: 82,

  netherlands: 84,
  "pays-bas": 84,
  "pay bas": 84,

  belgium: 82,
  belgique: 82,

  denmark: 90,
  danemark: 90,

  sweden: 88,
  suede: 88,

  norway: 92,
  norvege: 92,

  finland: 90,
  finlande: 90,

  switzerland: 86,
  suisse: 86,

  austria: 84,
  autriche: 84,

  italy: 80,
  italie: 80,

  portugal: 78,

  spain: 76,
  espagne: 76,

  uk: 78,
  "united kingdom": 78,
  "royaume uni": 78,

  usa: 72,
  "united states": 72,

  canada: 84,

  japan: 78,
  japon: 78,

  southkorea: 72,
  "south korea": 72,
  "coree du sud": 72,

  turkey: 55,
  turquie: 55,

  tunisia: 58,
  tunisie: 58,

  morocco: 58,
  maroc: 58,

  china: 45,
  chine: 45,

  india: 44,
  inde: 44,

  pakistan: 40,

  vietnam: 46,

  thailand: 55,
  thailande: 55,

  indonesia: 45,
  indonesie: 45,

  cambodia: 36,
  cambodge: 36,

  bangladesh: 38,

  srilanka: 58,
  "sri lanka": 58,

  myanmar: 25,

  ethiopia: 28,
  ethiopie: 28,
};

const countryTransportScores: Record<string, number> = {
  france: 100,

  belgium: 90,
  belgique: 90,
  netherlands: 90,
  "pays bas": 90,
  germany: 84,
  allemagne: 84,
  switzerland: 82,

  italy: 82,
  spain: 82,
  portugal: 80,

  uk: 78,
  "united kingdom": 78,
  "royaume uni": 78,

  poland: 76,
  pologne: 76,

  czechia: 76,
  "czech republic": 76,
  "republique tcheque": 76,

  turkey: 62,
  turquie: 62,

  tunisia: 68,
  tunisie: 68,

  morocco: 68,
  maroc: 68,

  egypt: 60,
  egypte: 60,

  india: 35,
  inde: 35,

  pakistan: 34,

  bangladesh: 32,

  srilanka: 34,
  "sri lanka": 34,

  vietnam: 34,

  thailand: 35,
  thailande: 35,

  indonesia: 33,
  indonesie: 33,
  indonésie: 33,

  china: 35,
  chine: 35,

  japan: 30,
  japon: 30,

  southkorea: 32,
  "south korea": 32,
  "coree du sud": 32,

  cambodia: 32,
  cambodge: 32,

  myanmar: 30,
};

const brandEthicalScores: Record<string, number> = {
  patagonia: 88,
  veja: 84,
  tentree: 86,
  kotn: 85,
  mudjeans: 88,
  colorfullstandard: 84,

  armedangels: 82,
  thinkingmu: 80,
  dedicated: 78,
  nudiejeans: 80,
  organicbasics: 78,
  peopletree: 80,

  levis: 56,
  puma: 55,
  adidas: 52,
  nike: 50,
  converse: 50,
  reebok: 54,
  decathlon: 58,
  carhartt: 54,
  vans: 50,
  timberland: 60,
  newbalance: 56,

  uniqlo: 42,
  gap: 40,
  mango: 38,
  hm: 36,
  "h m": 36,
  zara: 34,
  bershka: 30,
  pullandbear: 30,
  stradivarius: 30,
  forever21: 28,
  urbanoutfitters: 30,
  boohoo: 24,

  amazon: 20,
  primark: 24,
  fashionnova: 15,
  shein: 12,
  romwe: 10,
  cider: 15,
};

const normalizeText = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s%]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const scoreFromLookup = (
  value: string | null | undefined,
  lookup: Record<string, number>,
  defaultScore: number | null = null,
) => {
  const text = normalizeText(value);
  const match = Object.entries(lookup).find(([keyword]) => text.includes(keyword));
  return match ? match[1] : defaultScore;
};

const materialEnvironmentalScore = (material?: string | null) => {
  const text = normalizeText(material);
  if (!text) return null;

  const materialEntries = Object.entries(materialScores).filter(
    ([keyword]) =>
      !Object.keys(materialScores).some(
        (otherKeyword) =>
          otherKeyword !== keyword &&
          otherKeyword.includes(keyword) &&
          text.includes(otherKeyword),
      ),
  );

  const matches = materialEntries
    .filter(([keyword]) => text.includes(keyword))
    .map(([keyword, score]) => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const percentMatch = text.match(new RegExp(`(\\d{1,3})\\s*%\\s*${escapedKeyword}`));

      return {
        score,
        weight: percentMatch ? Number(percentMatch[1]) : 100,
      };
    });

  if (matches.length === 0) return 50;

  const totalWeight = matches.reduce((total, item) => total + item.weight, 0);
  const weightedScore = matches.reduce((total, item) => total + item.score * item.weight, 0);
  return clampScore(weightedScore / totalWeight);
};

const careEnvironmentalAdjustment = (careInstructions?: string | null) => {
  const text = normalizeText(careInstructions);
  let adjustment = 0;

  if (["cold", "30", "basse temperature", "basse température"].some((term) => text.includes(term))) {
    adjustment += 6;
  }
  if (["hot", "60", "haute temperature", "haute température"].some((term) => text.includes(term))) {
    adjustment -= 6;
  }
  if ([" very hot", "90", "tres haute temperature", "très haute température"].some((term) => text.includes(term))) {
    adjustment -= 10;
  }

  console.log("Care instructions:", text, "Adjustment:", adjustment);
  return adjustment;
};

export const calculateLabelScores = (labelInfo: ScoredLabelInfo): ScoredLabelInfo => {
  const materialScore = materialEnvironmentalScore(labelInfo.material);
  const transportScore = scoreFromLookup(
    labelInfo.country_of_origin,
    countryTransportScores,
    labelInfo.country_of_origin ? 50 : null,
  );
  const careBaseScore = labelInfo.care_instructions ? 50 : null;

  const environmentalParts = [
    { score: materialScore, weight: 0.6 },
    { score: transportScore, weight: 0.3 },
    { score: careBaseScore, weight: 0.1 },
  ].filter((part): part is { score: number; weight: number } => part.score !== null);

  const environmentalScore =
    environmentalParts.length > 0
      ? clampScore(
          environmentalParts.reduce((total, part) => total + part.score * part.weight, 0) /
            environmentalParts.reduce((total, part) => total + part.weight, 0) +
            careEnvironmentalAdjustment(labelInfo.care_instructions),
        )
      : null;

  const countryEthicsScore = scoreFromLookup(
    labelInfo.country_of_origin,
    countryEthicalScores,
    labelInfo.country_of_origin ? 50 : null,
  );
  const brandEthicsScore = scoreFromLookup(labelInfo.brand, brandEthicalScores);

  const ethicalParts = [
    { score: countryEthicsScore, weight: 0.4 },
    { score: brandEthicsScore, weight: 0.6 },
  ].filter((part): part is { score: number; weight: number } => part.score !== null);

  const ethicalScore =
    ethicalParts.length > 0
      ? clampScore(
          ethicalParts.reduce((total, part) => total + part.score * part.weight, 0) /
            ethicalParts.reduce((total, part) => total + part.weight, 0),
        )
      : null;

  const globalScore =
    environmentalScore !== null && ethicalScore !== null
      ? clampScore((environmentalScore + ethicalScore) / 2)
      : environmentalScore ?? ethicalScore;

  return {
    ...labelInfo,
    ethical_score: ethicalScore,
    environmental_score: environmentalScore,
    global_score: globalScore,
  };
};