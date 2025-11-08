import type { Vendor } from 'types';

/**
 * Calculates a consolidated procurement score for a vendor.
 * The score is out of 100 and considers rating, performance trend, evaluation count, and status.
 * @param vendor The vendor object.
 * @returns A procurement score from 0 to 100.
 */
export const calculateProcurementScore = (vendor: Vendor): number => {
  if (vendor.status === 'Blacklist') {
    return 0;
  }

  // 1. Base Score from Rating (0-100)
  // The rating is 1-5, so we multiply by 20.
  const baseScore = vendor.rating * 20;

  // 2. Trend Modifier (+10 for up, -10 for down)
  let trendModifier = 0;
  if (vendor.performanceTrend === 'up') {
    trendModifier = 10;
  } else if (vendor.performanceTrend === 'down') {
    trendModifier = -10;
  }

  // 3. Review Count Modifier (Bonus for more evaluations)
  // +1 point for every 2 evaluations, max 10 points.
  const reviewModifier = Math.min(10, Math.floor(vendor.reviewCount / 2));

  let calculatedScore = baseScore + trendModifier + reviewModifier;

  // Clamp the score to be within 0-100
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  // 4. Status Modifier (penalize non-active vendors)
  if (vendor.status === 'Nonaktif') {
    calculatedScore *= 0.5;
  }

  return Math.round(calculatedScore);
};