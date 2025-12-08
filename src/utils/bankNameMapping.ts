import type { BankName } from '../types/bank';

/**
 * Maps Spanish bank names to BankName enum values
 * Used for converting banco_recomendado from banking profile
 */
export const mapSpanishBankName = (spanishName: string): BankName | null => {
  const normalized = spanishName.toLowerCase().trim();

  const mapping: Record<string, BankName> = {
    'scotiabank': 'scotiabank',
    'bbva': 'bbva',
    'banregio': 'banregio',
    'banorte': 'banorte',
    'afirme': 'afirme',
    'hey banco': 'hey_banco',
    'hey': 'hey_banco',
    'banbajío': 'ban_bajio',
    'ban bajío': 'ban_bajio',
    'bajío': 'ban_bajio',
    'santander': 'santander',
    'hsbc': 'hsbc'
  };

  return mapping[normalized] || null;
};

/**
 * Gets the recommended bank from banking profile data
 */
export const getRecommendedBankFromProfile = (bankProfile: any): BankName | null => {
  if (!bankProfile) return null;

  const bancoRecomendado = bankProfile.banco_recomendado;
  if (!bancoRecomendado) return null;

  return mapSpanishBankName(bancoRecomendado);
};
