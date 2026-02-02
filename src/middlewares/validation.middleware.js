import { z } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// Esquemas de validación
export const sendWhatsappSchema = z.object({
  to: z.string().min(10, 'Número de teléfono inválido'),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(4096, 'El mensaje es demasiado largo')
});

export const sendEmailSchema = z.object({
  to: z.string().email('Email inválido'),
  subject: z.string().min(1, 'El asunto no puede estar vacío'),
  html: z.string().min(1, 'El contenido HTML no puede estar vacío')
});

export const sendMultipleEmailSchema = z.object({
  to: z.array(z.string().email('Email inválido')).min(1, 'Debe incluir al menos un destinatario'),
  subject: z.string().min(1, 'El asunto no puede estar vacío'),
  html: z.string().min(1, 'El contenido HTML no puede estar vacío')
});
