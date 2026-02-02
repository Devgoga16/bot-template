import { billingService } from '../services/billing.service.js';

export const accountStatusMiddleware = async (req, res, next) => {
  try {
    const accountStatus = await billingService.getAccountStatus();

    if (!accountStatus.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Cuenta bloqueada',
        reason: accountStatus.blockedReason,
        message: 'Su cuenta ha sido bloqueada. Por favor, póngase al día con los pagos para reactivar el servicio.'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando estado de cuenta:', error);
    next();
  }
};
