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
  "coton biologique": 85,
  "organic cotton": 85,
  lin: 90,
  linen: 90,
  chanvre: 92,
  hemp: 92,
  lyocell: 78,
  tencel: 80,
  modal: 66,
  viscose: 52,
  coton: 60,
  cotton: 60,
  laine: 62,
  wool: 62,
  soie: 58,
  silk: 58,
  "polyester recycle": 68,
  "recycled polyester": 68,
  polyester: 32,
  polyamide: 34,
  nylon: 34,
  elasthanne: 28,
  elastane: 28,
  spandex: 28,
  acrylique: 25,
  acrylic: 25,
  cuir: 24,
  leather: 24,
};

const countryEthicalScores: Record<string, number> = {
  france: 82,
  italie: 80,
  italy: 80,
  portugal: 78,
  espagne: 76,
  spain: 76,
  allemagne: 82,
  germany: 82,
  tunisie: 58,
  tunisia: 58,
  maroc: 58,
  morocco: 58,
  turquie: 55,
  turkey: 55,
  chine: 45,
  china: 45,
  bangladesh: 38,
  inde: 44,
  india: 44,
  pakistan: 40,
  vietnam: 46,
  cambodge: 36,
  cambodia: 36,
  myanmar: 25,
};

const countryTransportScores: Record<string, number> = {
  france: 92,
  italie: 82,
  italy: 82,
  portugal: 80,
  espagne: 82,
  spain: 82,
  allemagne: 84,
  germany: 84,
  tunisie: 68,
  tunisia: 68,
  maroc: 68,
  morocco: 68,
  turquie: 62,
  turkey: 62,
  chine: 35,
  china: 35,
  bangladesh: 32,
  inde: 35,
  india: 35,
  pakistan: 34,
  vietnam: 34,
  cambodge: 32,
  cambodia: 32,
  myanmar: 30,
};

const brandEthicalScores: Record<string, number> = {
  patagonia: 88,
  veja: 84,
  armedangels: 82,
  "levi's": 56,
  levis: 56,
  uniqlo: 42,
  "h&m": 36,
  hm: 36,
  zara: 34,
  primark: 24,
  shein: 12,
};

const normalizeText = (value?: string | null) => (value ?? "").trim().toLowerCase();

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
  if (["air dry", "line dry", "sechage a l'air", "séchage à l'air"].some((term) => text.includes(term))) {
    adjustment += 5;
  }
  if (["tumble dry", "seche-linge", "sèche-linge"].some((term) => text.includes(term))) {
    adjustment -= 6;
  }
  if (["dry clean", "nettoyage a sec", "nettoyage à sec"].some((term) => text.includes(term))) {
    adjustment -= 8;
  }
  if (["do not bleach", "ne pas blanchir"].some((term) => text.includes(term))) {
    adjustment += 2;
  }

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
    { score: materialScore, weight: 0.65 },
    { score: transportScore, weight: 0.25 },
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
    { score: countryEthicsScore, weight: 0.6 },
    { score: brandEthicsScore, weight: 0.4 },
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