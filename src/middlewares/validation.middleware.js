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
  to: z.string()
    .regex(/^9\d{8}$/, 'El número debe tener 9 dígitos y empezar con 9'),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(4096, 'El mensaje es demasiado largo')
});

export const sendImageWhatsappSchema = z.object({
  to: z.string()
    .regex(/^9\d{8}$/, 'El número debe tener 9 dígitos y empezar con 9'),
  image: z.string().min(1, 'La imagen no puede estar vacía'),
  caption: z.string().max(1024, 'El caption es demasiado largo').optional()
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'El nombre del grupo no puede estar vacío').max(100, 'El nombre del grupo es demasiado largo'),
  participants: z.array(z.string().regex(/^9\d{8}$/, 'Cada participante debe tener 9 dígitos y empezar con 9')).optional().default([])
});

export const addParticipantsSchema = z.object({
  participants: z.array(z.string().regex(/^9\d{8}$/, 'Cada participante debe tener 9 dígitos y empezar con 9')).min(1, 'Debe incluir al menos un participante')
});

export const sendGroupMessageSchema = z.object({
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
