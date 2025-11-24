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
 * Guarda el estado premium en localStorage
 */
export const savePremiumStatus = (
  licenseKey: string,
  expiresAt: string | null = null,
  subscriptionEndsAt: string | null = null
): void => {
  const premiumData = {
    licenseKey,
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
  licenseKey?: string;
  expiresAt?: string;
  subscriptionEndsAt?: string;
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

    return {
      isPremium: data.isPremium === true,
      licenseKey: data.licenseKey,
      expiresAt: data.expiresAt,
      subscriptionEndsAt: data.subscriptionEndsAt,
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

