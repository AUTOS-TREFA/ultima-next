/**
 * Finance Calculator Utility
 *
 * Accurate monthly payment calculator following the business rules from docs/calculator-prompt.txt
 *
 * Key Rules:
 * - Interest Rate: 17% annual (fixed)
 * - Insurance: 5% of vehicle price annually (amortized monthly or paid upfront)
 * - Term limits vary by vehicle year (see getMaxTermByYear)
 */

/**
 * Get maximum loan term based on vehicle year
 * @param year - Vehicle model year (2017-2025)
 * @returns Maximum allowed term in months
 */
export const getMaxTermByYear = (year: number): number => {
  const termMap: Record<number, number> = {
    2017: 12,
    2018: 24,
    2019: 48,
    2020: 48,
    2021: 60,
    2022: 60,
    2023: 60,
    2024: 60,
    2025: 60,
  };

  return termMap[year] || 60; // Default to 60 if year not in map
};

/**
 * Calculate monthly payment with correct formula
 *
 * @param price - Vehicle price
 * @param downPayment - Down payment amount
 * @param term - Loan term in months (must be <= plazomax)
 * @param annualRate - Annual interest rate (default 17%)
 * @param includeInsurance - Whether to include insurance in monthly payment (default: true)
 * @returns Monthly payment amount
 */
export const calculateMonthlyPayment = (
  price: number,
  downPayment: number,
  term: number,
  annualRate: number = 17.0,
  includeInsurance: boolean = true
): number => {
  // Validate inputs
  if (price <= 0 || term <= 0) return 0;

  const loanAmount = price - downPayment;
  if (loanAmount <= 0 || !isFinite(loanAmount)) return 0;

  // Calculate monthly interest rate (17% annual = 0.17/12 monthly)
  const monthlyRate = annualRate / 12 / 100;

  // Simple interest if rate is 0
  if (monthlyRate === 0) {
    const basePayment = loanAmount / term;
    if (!includeInsurance) return Math.round(basePayment);

    const monthlyInsurance = (price * 0.05) / 12;
    return Math.round(basePayment + monthlyInsurance);
  }

  // Standard amortization formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const n = term;
  const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n);
  const denominator = Math.pow(1 + monthlyRate, n) - 1;

  if (denominator === 0) return 0;

  const monthlyPaymentForLoan = numerator / denominator;

  // Add monthly insurance if needed (5% annual = 5% / 12 monthly)
  if (includeInsurance) {
    const annualInsurance = price * 0.05;
    const monthlyInsurance = annualInsurance / 12;
    return Math.round(monthlyPaymentForLoan + monthlyInsurance);
  }

  return Math.round(monthlyPaymentForLoan);
};

/**
 * Calculate total amount paid at the end of loan
 *
 * @param monthlyPayment - Monthly payment amount
 * @param term - Loan term in months
 * @param downPayment - Down payment amount
 * @returns Total amount paid (down payment + all monthly payments)
 */
export const calculateTotalPaid = (
  monthlyPayment: number,
  term: number,
  downPayment: number
): number => {
  return downPayment + (monthlyPayment * term);
};

/**
 * Get valid loan term options based on vehicle's maximum term
 *
 * @param maxTerm - Maximum term allowed for the vehicle (from plazomax)
 * @returns Array of valid term options
 */
export const getValidTermOptions = (maxTerm: number): number[] => {
  const allTerms = [12, 24, 36, 48, 60, 72];
  return allTerms.filter(term => term <= maxTerm);
};

/**
 * Calculate financing scenarios (minimum and recommended down payments)
 *
 * @param price - Vehicle price
 * @param minDownPayment - Minimum down payment (from API or 25% default)
 * @param recommendedDownPayment - Recommended down payment (from API or 40% default)
 * @param term - Loan term in months
 * @param annualRate - Annual interest rate (default 17%)
 * @returns Object with minimum and recommended scenarios
 */
export const calculateFinancingScenarios = (
  price: number,
  minDownPayment: number,
  recommendedDownPayment: number,
  term: number,
  annualRate: number = 17.0
) => {
  const minMonthly = calculateMonthlyPayment(price, minDownPayment, term, annualRate, true);
  const recommendedMonthly = calculateMonthlyPayment(price, recommendedDownPayment, term, annualRate, true);

  return {
    minimum: {
      downPayment: minDownPayment,
      monthlyPayment: minMonthly,
      totalPaid: calculateTotalPaid(minMonthly, term, minDownPayment),
    },
    recommended: {
      downPayment: recommendedDownPayment,
      monthlyPayment: recommendedMonthly,
      totalPaid: calculateTotalPaid(recommendedMonthly, term, recommendedDownPayment),
    },
  };
};
