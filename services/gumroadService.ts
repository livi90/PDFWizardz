/**
 * Servicio para validar claves de licencia de Gumroad
 * Documentación: https://gumroad.com/help/article/76-license-keys
 */

interface GumroadPurchase {
  seller_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  product_permalink: string;
  email: string;
  price: number;
  gumroad_fee: number;
  currency: string;
  quantity: number;
  discover_fee_charged: boolean;
  can_contact: boolean;
  referrer: string;
  order_number: number;
  sale_id: string;
  sale_timestamp: string;
  purchaser_id: string;
  subscription_id: string | null;
  variants: string;
  license_key: string;
  is_multiseat_license: boolean;
  ip_country: string;
  recurrence: string | null; // "monthly", "yearly", etc. o null si no es suscripción
  is_gift_receiver_purchase: boolean;
  refunded: boolean;
  disputed: boolean;
  dispute_won: boolean;
  id: string;
  created_at: string;
  custom_fields: any[];
  chargebacked: boolean;
  subscription_ended_at: string | null;
  subscription_cancelled_at: string | null;
  subscription_failed_at: string | null;
}

interface GumroadResponse {
  success: boolean;
  uses?: number;
  purchase?: GumroadPurchase;
}

/**
 * Product ID de PDF Wizardz en Gumroad
 */
const PRODUCT_ID = 'zfrt0KClHyBDUiLG1Ap1Dw==';

/**
 * Valida una clave de licencia de Gumroad
 * @param licenseKey La clave de licencia a validar
 * @returns true si la clave es válida y está activa, false en caso contrario
 */
export const validateLicenseKey = async (
  licenseKey: string
): Promise<{ valid: boolean; error?: string; licenseData?: GumroadPurchase }> => {
  try {
    // Limpiar la clave de espacios
    const cleanKey = licenseKey.trim();

    // Validar formato básico
    if (!cleanKey || cleanKey.length < 5) {
      return { valid: false, error: 'Formato de clave inválido' };
    }

    // Llamar a la API de Gumroad
    const formData = new URLSearchParams();
    formData.append('product_id', PRODUCT_ID);
    formData.append('license_key', cleanKey);
    formData.append('increment_uses_count', 'true'); // Incrementar contador de usos

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // Si la respuesta es 404, la clave no es válida
    if (response.status === 404) {
      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: errorData.error || 'Clave de licencia inválida o no encontrada',
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        error: `Error al validar la licencia (código: ${response.status})`,
      };
    }

    const data: GumroadResponse = await response.json();

    if (!data.success || !data.purchase) {
      return { valid: false, error: 'Clave de licencia inválida' };
    }

    const purchase = data.purchase;

    // Verificar si la compra fue reembolsada
    if (purchase.refunded) {
      return { valid: false, error: 'Esta licencia fue reembolsada y ya no es válida' };
    }

    // Verificar si es una suscripción y si está activa
    if (purchase.recurrence) {
      // Es una suscripción
      if (purchase.subscription_ended_at) {
        return { valid: false, error: 'Esta suscripción ha finalizado' };
      }
      if (purchase.subscription_cancelled_at) {
        return { valid: false, error: 'Esta suscripción fue cancelada' };
      }
      if (purchase.subscription_failed_at) {
        return { valid: false, error: 'Esta suscripción falló al procesar el pago' };
      }
    }

    // La licencia es válida
    return {
      valid: true,
      licenseData: purchase,
    };
  } catch (error) {
    console.error('Error validando licencia:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Error al validar la licencia',
    };
  }
};

/**
 * Tipos de plan disponibles
 */
export type PlanType = 'premium' | 'platinum_plus';

/**
 * Detecta el tipo de plan basado en el precio
 * @param price Precio de la compra
 * @returns Tipo de plan
 */
export const detectPlanType = (price: number): PlanType => {
  // Premium: 2€, Platinum+: 8€
  // Usamos un rango para manejar variaciones de moneda y redondeo
  if (price >= 7) {
    return 'platinum_plus';
  }
  return 'premium';
};

/**
 * Obtiene los límites según el tipo de plan
 */
export const getPlanLimits = (planType: PlanType): {
  maxExcelDocuments: number;
} => {
  switch (planType) {
    case 'platinum_plus':
      return { maxExcelDocuments: 100 };
    case 'premium':
      return { maxExcelDocuments: 20 };
    default:
      return { maxExcelDocuments: 20 };
  }
};

/**
 * Guarda el estado premium en localStorage
 */
export const savePremiumStatus = (
  licenseKey: string,
  planType: PlanType,
  expiresAt: string | null = null,
  subscriptionEndsAt: string | null = null
): void => {
  const premiumData = {
    licenseKey,
    planType,
    activatedAt: new Date().toISOString(),
    expiresAt,
    subscriptionEndsAt, // Para suscripciones
    isPremium: true,
  };
  localStorage.setItem('pdfwizardz_premium', JSON.stringify(premiumData));
};

/**
 * Obtiene el estado premium desde localStorage
 */
export const getPremiumStatus = (): {
  isPremium: boolean;
  planType?: PlanType;
  licenseKey?: string;
  expiresAt?: string;
  subscriptionEndsAt?: string;
  maxExcelDocuments?: number;
} => {
  try {
    const premiumData = localStorage.getItem('pdfwizardz_premium');
    if (!premiumData) {
      return { isPremium: false };
    }

    const data = JSON.parse(premiumData);

    // Verificar si la licencia ha expirado (para licencias con fecha de expiración)
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem('pdfwizardz_premium');
      return { isPremium: false };
    }

    // Verificar si la suscripción ha finalizado
    if (data.subscriptionEndsAt && new Date(data.subscriptionEndsAt) < new Date()) {
      localStorage.removeItem('pdfwizardz_premium');
      return { isPremium: false };
    }

    const planType: PlanType = data.planType || 'premium';
    const limits = getPlanLimits(planType);

    return {
      isPremium: data.isPremium === true,
      planType,
      licenseKey: data.licenseKey,
      expiresAt: data.expiresAt,
      subscriptionEndsAt: data.subscriptionEndsAt,
      maxExcelDocuments: limits.maxExcelDocuments,
    };
  } catch (error) {
    console.error('Error leyendo estado premium:', error);
    return { isPremium: false };
  }
};

/**
 * Elimina el estado premium (logout)
 */
export const clearPremiumStatus = (): void => {
  localStorage.removeItem('pdfwizardz_premium');
};

/**
 * Tipos de features premium que tienen usos gratuitos
 */
export type PremiumFeature = 'chat' | 'excel_template';

/**
 * Constantes para el sistema de usos gratuitos por feature
 */
const FREE_TRIAL_USES_KEY = 'pdfwizardz_free_trial_uses';
const MAX_FREE_TRIAL_USES_PER_FEATURE = 3;

/**
 * Obtiene el número de usos gratuitos restantes para una feature específica
 * @param feature La feature para la cual obtener los usos
 */
export const getFreeTrialUses = (feature: PremiumFeature): number => {
  try {
    const usesData = localStorage.getItem(FREE_TRIAL_USES_KEY);
    if (!usesData) {
      // Inicializar todas las features con 3 usos
      const initialData: Record<PremiumFeature, number> = {
        chat: MAX_FREE_TRIAL_USES_PER_FEATURE,
        excel_template: MAX_FREE_TRIAL_USES_PER_FEATURE,
      };
      localStorage.setItem(FREE_TRIAL_USES_KEY, JSON.stringify(initialData));
      return MAX_FREE_TRIAL_USES_PER_FEATURE;
    }
    const data: Record<PremiumFeature, number> = JSON.parse(usesData);
    return data[feature] || 0;
  } catch (error) {
    console.error('Error leyendo usos gratuitos:', error);
    return 0;
  }
};

/**
 * Consume un uso gratuito de una feature específica (solo si no es premium)
 * @param feature La feature para la cual consumir un uso
 * @returns true si se consumió un uso o es premium, false si no hay usos disponibles
 */
export const consumeFreeTrialUse = (feature: PremiumFeature): boolean => {
  const premiumStatus = getPremiumStatus();
  
  // Si ya es premium, no consumir usos gratuitos
  if (premiumStatus.isPremium) {
    return true; // Permitir porque es premium
  }
  
  try {
    const usesData = localStorage.getItem(FREE_TRIAL_USES_KEY);
    let data: Record<PremiumFeature, number>;
    
    if (!usesData) {
      // Inicializar todas las features con 3 usos y consumir uno
      data = {
        chat: MAX_FREE_TRIAL_USES_PER_FEATURE,
        excel_template: MAX_FREE_TRIAL_USES_PER_FEATURE,
      };
      data[feature] = data[feature] - 1;
    } else {
      data = JSON.parse(usesData);
      if (data[feature] === undefined || data[feature] <= 0) {
        return false; // No hay usos disponibles para esta feature
      }
      data[feature] = data[feature] - 1;
    }
    
    localStorage.setItem(FREE_TRIAL_USES_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error consumiendo uso gratuito:', error);
    return false;
  }
};

/**
 * Obtiene información completa del estado de acceso para una feature específica
 * @param feature La feature para la cual verificar el acceso
 */
export const getFeatureAccessStatus = (feature: PremiumFeature): {
  hasAccess: boolean;
  isPremium: boolean;
  freeTrialUses: number;
  maxFreeTrialUses: number;
  isLocked: boolean;
} => {
  const premiumStatus = getPremiumStatus();
  const freeTrialUses = getFreeTrialUses(feature);
  
  const hasAccess = premiumStatus.isPremium || freeTrialUses > 0;
  const isLocked = !premiumStatus.isPremium && freeTrialUses <= 0;
  
  return {
    hasAccess,
    isPremium: premiumStatus.isPremium,
    freeTrialUses,
    maxFreeTrialUses: MAX_FREE_TRIAL_USES_PER_FEATURE,
    isLocked,
  };
};

