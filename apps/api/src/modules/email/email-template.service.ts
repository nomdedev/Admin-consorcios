import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio para generar templates de email HTML
 * Todos los templates siguen el branding de VecinoSimple
 */
@Injectable()
export class EmailTemplateService {
  private readonly appUrl: string;
  private readonly appName = 'VecinoSimple';
  private readonly primaryColor = '#4CAF50';
  private readonly textColor = '#333333';

  constructor(private readonly configService: ConfigService) {
    this.appUrl = this.configService.get<string>('APP_URL', 'https://vecinosimple.com');
  }

  /**
   * Template base con header y footer
   */
  private baseTemplate(content: string, previewText?: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${this.appName}</title>
  ${previewText ? `<!--[if !mso]><!-- --><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><span style="display:none!important;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${this.primaryColor}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: ${this.primaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #43A047; }
    h2 { color: ${this.textColor}; margin-top: 0; }
    p { color: ${this.textColor}; line-height: 1.6; }
    .highlight { background: #E8F5E9; padding: 15px; border-radius: 6px; border-left: 4px solid ${this.primaryColor}; }
    .warning { background: #FFF3E0; padding: 15px; border-radius: 6px; border-left: 4px solid #FF9800; }
    .danger { background: #FFEBEE; padding: 15px; border-radius: 6px; border-left: 4px solid #F44336; }
    .muted { color: #666; font-size: 14px; }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body style="background-color: #f0f0f0; padding: 20px 0;">
  <div class="container">
    <div class="header">
      <h1>🏢 ${this.appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        © ${new Date().getFullYear()} ${this.appName}. Todos los derechos reservados.
      </p>
      <p style="margin: 0; font-size: 11px;">
        Este email fue enviado desde ${this.appName}. Si no esperabas este mensaje,
        podés ignorarlo de forma segura.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Magic Link para login
   */
  magicLink(params: { nombre: string; link: string; expiresIn: string }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>¡Hola ${params.nombre}! 👋</h2>
      <p>Recibimos una solicitud para iniciar sesión en tu cuenta de ${this.appName}.</p>
      <p>Hacé clic en el siguiente botón para acceder:</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Iniciar Sesión</a>
      </div>
      <p class="muted">Este enlace expira en ${params.expiresIn}.</p>
      <p class="muted">Si no solicitaste este acceso, ignorá este mensaje.</p>
    `, `Iniciá sesión en ${this.appName}`);

    const text = `
Hola ${params.nombre},

Recibimos una solicitud para iniciar sesión en tu cuenta de ${this.appName}.

Hacé clic en el siguiente enlace para acceder:
${params.link}

Este enlace expira en ${params.expiresIn}.

Si no solicitaste este acceso, ignorá este mensaje.

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Nueva expensa disponible
   */
  nuevaExpensa(params: {
    nombre: string;
    periodo: string;
    monto: string;
    vencimiento: string;
    consorcio: string;
    linkPagar: string;
  }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>Nueva Expensa Disponible 📄</h2>
      <p>Hola ${params.nombre},</p>
      <p>La liquidación de expensas de <strong>${params.consorcio}</strong> para el período <strong>${params.periodo}</strong> ya está disponible.</p>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 14px;">Total a pagar:</p>
        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: ${this.primaryColor};">${params.monto}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Vencimiento: <strong>${params.vencimiento}</strong></p>
      </div>
      
      <div style="text-align: center;">
        <a href="${params.linkPagar}" class="button">Ver y Pagar Expensa</a>
      </div>
      
      <p class="muted">Podés pagar con tarjeta, transferencia o en efectivo a través de Mercado Pago.</p>
    `, `Tu expensa de ${params.periodo} está lista - ${params.monto}`);

    const text = `
Hola ${params.nombre},

La liquidación de expensas de ${params.consorcio} para el período ${params.periodo} ya está disponible.

Total a pagar: ${params.monto}
Vencimiento: ${params.vencimiento}

Pagá tu expensa en: ${params.linkPagar}

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Pago recibido
   */
  pagoRecibido(params: {
    nombre: string;
    monto: string;
    periodos: string;
    metodoPago: string;
    fecha: string;
    linkComprobante?: string;
  }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>¡Pago Recibido! ✅</h2>
      <p>Hola ${params.nombre},</p>
      <p>Tu pago fue procesado correctamente.</p>
      
      <div class="highlight">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Monto:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${params.monto}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Período(s):</td>
            <td style="padding: 8px 0; text-align: right;">${params.periodos}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Método:</td>
            <td style="padding: 8px 0; text-align: right;">${params.metodoPago}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Fecha:</td>
            <td style="padding: 8px 0; text-align: right;">${params.fecha}</td>
          </tr>
        </table>
      </div>
      
      ${params.linkComprobante ? `
      <div style="text-align: center;">
        <a href="${params.linkComprobante}" class="button">Descargar Comprobante</a>
      </div>
      ` : ''}
      
      <p class="muted">Gracias por mantener tu cuenta al día.</p>
    `, `Pago de ${params.monto} recibido`);

    const text = `
Hola ${params.nombre},

Tu pago fue procesado correctamente.

Monto: ${params.monto}
Período(s): ${params.periodos}
Método: ${params.metodoPago}
Fecha: ${params.fecha}

${params.linkComprobante ? `Descargá tu comprobante: ${params.linkComprobante}` : ''}

Gracias por mantener tu cuenta al día.

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Recordatorio de vencimiento
   */
  recordatorioVencimiento(params: {
    nombre: string;
    monto: string;
    vencimiento: string;
    diasRestantes: number;
    linkPagar: string;
  }): { html: string; text: string } {
    const urgency = params.diasRestantes <= 2 ? 'danger' : 'warning';
    const emoji = params.diasRestantes <= 2 ? '⚠️' : '⏰';

    const html = this.baseTemplate(`
      <h2>${emoji} Recordatorio de Pago</h2>
      <p>Hola ${params.nombre},</p>
      <p>Te recordamos que tu expensa vence pronto.</p>
      
      <div class="${urgency}">
        <p style="margin: 0; font-size: 14px;">Total pendiente:</p>
        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">${params.monto}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">
          Vence el <strong>${params.vencimiento}</strong> 
          (${params.diasRestantes === 0 ? 'HOY' : params.diasRestantes === 1 ? 'MAÑANA' : `en ${params.diasRestantes} días`})
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${params.linkPagar}" class="button">Pagar Ahora</a>
      </div>
      
      <p class="muted">Evitá intereses por mora pagando antes del vencimiento.</p>
    `, `Tu expensa vence ${params.diasRestantes === 0 ? 'HOY' : params.diasRestantes === 1 ? 'mañana' : `en ${params.diasRestantes} días`}`);

    const text = `
Hola ${params.nombre},

Te recordamos que tu expensa vence pronto.

Total pendiente: ${params.monto}
Vencimiento: ${params.vencimiento} (${params.diasRestantes === 0 ? 'HOY' : params.diasRestantes === 1 ? 'MAÑANA' : `en ${params.diasRestantes} días`})

Pagá ahora: ${params.linkPagar}

Evitá intereses por mora pagando antes del vencimiento.

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Alerta de emergencia
   */
  alertaEmergencia(params: {
    nombre: string;
    consorcio: string;
    tipoEmergencia: string;
    titulo: string;
    descripcion: string;
    instrucciones?: string;
  }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>🚨 ALERTA DE EMERGENCIA</h2>
      <p>Hola ${params.nombre},</p>
      <p>Se ha emitido una alerta de emergencia para <strong>${params.consorcio}</strong>:</p>
      
      <div class="danger">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #666;">${params.tipoEmergencia}</p>
        <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #C62828;">${params.titulo}</p>
        <p style="margin: 10px 0 0 0;">${params.descripcion}</p>
      </div>
      
      ${params.instrucciones ? `
      <div class="warning" style="margin-top: 15px;">
        <p style="margin: 0; font-weight: bold;">📋 Instrucciones:</p>
        <p style="margin: 5px 0 0 0;">${params.instrucciones}</p>
      </div>
      ` : ''}
      
      <p class="muted" style="margin-top: 20px;">
        Este mensaje fue enviado automáticamente. Ante cualquier duda, 
        contactá a la administración del edificio.
      </p>
    `, `EMERGENCIA: ${params.titulo}`);

    const text = `
🚨 ALERTA DE EMERGENCIA

Hola ${params.nombre},

Se ha emitido una alerta de emergencia para ${params.consorcio}:

${params.tipoEmergencia.toUpperCase()}
${params.titulo}

${params.descripcion}

${params.instrucciones ? `INSTRUCCIONES:\n${params.instrucciones}` : ''}

Este mensaje fue enviado automáticamente. Ante cualquier duda, contactá a la administración del edificio.

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Convocatoria a asamblea
   */
  convocatoriaAsamblea(params: {
    nombre: string;
    consorcio: string;
    titulo: string;
    fecha: string;
    hora: string;
    lugar: string;
    linkVirtual?: string;
    puntosOrden: string[];
  }): { html: string; text: string } {
    const puntosHtml = params.puntosOrden
      .map((p, i) => `<li style="margin: 8px 0;">${i + 1}. ${p}</li>`)
      .join('');

    const html = this.baseTemplate(`
      <h2>📋 Convocatoria a Asamblea</h2>
      <p>Hola ${params.nombre},</p>
      <p>Te convocamos a la próxima asamblea de <strong>${params.consorcio}</strong>:</p>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 18px; font-weight: bold;">${params.titulo}</p>
        <table style="width: 100%; margin-top: 15px;">
          <tr>
            <td style="padding: 5px 0; color: #666;">📅 Fecha:</td>
            <td style="padding: 5px 0;">${params.fecha}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">🕐 Hora:</td>
            <td style="padding: 5px 0;">${params.hora}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">📍 Lugar:</td>
            <td style="padding: 5px 0;">${params.lugar}</td>
          </tr>
        </table>
      </div>
      
      ${params.linkVirtual ? `
      <div style="text-align: center;">
        <a href="${params.linkVirtual}" class="button">Unirse Virtualmente</a>
      </div>
      ` : ''}
      
      <h3 style="margin-top: 25px;">Orden del Día:</h3>
      <ol style="padding-left: 20px;">
        ${puntosHtml}
      </ol>
      
      <p class="muted">Tu participación es importante. ¡Te esperamos!</p>
    `, `Convocatoria: ${params.titulo} - ${params.fecha}`);

    const text = `
Hola ${params.nombre},

Te convocamos a la próxima asamblea de ${params.consorcio}:

${params.titulo}

Fecha: ${params.fecha}
Hora: ${params.hora}
Lugar: ${params.lugar}
${params.linkVirtual ? `Link virtual: ${params.linkVirtual}` : ''}

ORDEN DEL DÍA:
${params.puntosOrden.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Tu participación es importante. ¡Te esperamos!

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Nuevo comunicado
   */
  nuevoComunicado(params: {
    nombre: string;
    consorcio: string;
    titulo: string;
    contenido: string;
    esImportante: boolean;
    linkVer: string;
  }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>${params.esImportante ? '📌 Comunicado Importante' : '📢 Nuevo Comunicado'}</h2>
      <p>Hola ${params.nombre},</p>
      <p>Hay un nuevo comunicado de <strong>${params.consorcio}</strong>:</p>
      
      <div class="${params.esImportante ? 'warning' : 'highlight'}">
        <p style="margin: 0; font-size: 18px; font-weight: bold;">${params.titulo}</p>
        <p style="margin: 10px 0 0 0;">${params.contenido.substring(0, 300)}${params.contenido.length > 300 ? '...' : ''}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${params.linkVer}" class="button">Ver Comunicado Completo</a>
      </div>
    `, `${params.esImportante ? '[IMPORTANTE] ' : ''}${params.titulo}`);

    const text = `
Hola ${params.nombre},

Hay un nuevo comunicado de ${params.consorcio}:

${params.esImportante ? '[IMPORTANTE] ' : ''}${params.titulo}

${params.contenido.substring(0, 500)}${params.contenido.length > 500 ? '...' : ''}

Ver comunicado completo: ${params.linkVer}

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Actualización de ticket/reclamo
   */
  actualizacionTicket(params: {
    nombre: string;
    ticketId: string;
    titulo: string;
    nuevoEstado: string;
    comentario?: string;
    linkVer: string;
  }): { html: string; text: string } {
    const estadoColor: Record<string, string> = {
      'ABIERTO': '#2196F3',
      'EN_PROGRESO': '#FF9800',
      'ESPERANDO_RESPUESTA': '#9C27B0',
      'RESUELTO': '#4CAF50',
      'CERRADO': '#607D8B',
    };

    const color = estadoColor[params.nuevoEstado] || '#666';

    const html = this.baseTemplate(`
      <h2>🔔 Actualización de Reclamo</h2>
      <p>Hola ${params.nombre},</p>
      <p>Tu reclamo ha sido actualizado:</p>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 12px; color: #666;">Ticket #${params.ticketId}</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${params.titulo}</p>
        <p style="margin: 10px 0 0 0;">
          Nuevo estado: 
          <span style="background: ${color}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${params.nuevoEstado.replace('_', ' ')}
          </span>
        </p>
      </div>
      
      ${params.comentario ? `
      <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 0; font-size: 12px; color: #666;">Comentario:</p>
        <p style="margin: 5px 0 0 0;">${params.comentario}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${params.linkVer}" class="button">Ver Reclamo</a>
      </div>
    `, `Actualización de reclamo: ${params.titulo}`);

    const text = `
Hola ${params.nombre},

Tu reclamo ha sido actualizado:

Ticket #${params.ticketId}
${params.titulo}

Nuevo estado: ${params.nuevoEstado.replace('_', ' ')}

${params.comentario ? `Comentario:\n${params.comentario}` : ''}

Ver reclamo: ${params.linkVer}

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }

  /**
   * Invitación a claiming (código de unidad)
   */
  invitacionClaiming(params: {
    nombre: string;
    consorcio: string;
    direccion: string;
    unidad: string;
    codigo: string;
    linkRegistro: string;
  }): { html: string; text: string } {
    const html = this.baseTemplate(`
      <h2>🏠 Registrate en ${this.appName}</h2>
      <p>Hola ${params.nombre},</p>
      <p>Fuiste invitado/a a unirte a <strong>${params.consorcio}</strong> como propietario/inquilino de la unidad <strong>${params.unidad}</strong>.</p>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 14px; color: #666;">Edificio:</p>
        <p style="margin: 5px 0; font-weight: bold;">${params.consorcio}</p>
        <p style="margin: 0; font-size: 14px;">${params.direccion}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        
        <p style="margin: 0; font-size: 14px; color: #666;">Tu código de registro:</p>
        <p style="margin: 5px 0; font-size: 32px; font-weight: bold; letter-spacing: 3px; color: ${this.primaryColor};">${params.codigo}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${params.linkRegistro}" class="button">Registrarme</a>
      </div>
      
      <p class="muted">Este código es personal e intransferible. No lo compartas con nadie.</p>
    `, `Te invitaron a ${params.consorcio}`);

    const text = `
Hola ${params.nombre},

Fuiste invitado/a a unirte a ${params.consorcio} como propietario/inquilino de la unidad ${params.unidad}.

Edificio: ${params.consorcio}
Dirección: ${params.direccion}

Tu código de registro: ${params.codigo}

Registrate en: ${params.linkRegistro}

Este código es personal e intransferible. No lo compartas con nadie.

- El equipo de ${this.appName}
    `.trim();

    return { html, text };
  }
}
