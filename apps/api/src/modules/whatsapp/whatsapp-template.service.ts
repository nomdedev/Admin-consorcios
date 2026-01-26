import { Injectable } from '@nestjs/common';
import { WhatsAppTemplateComponent } from './whatsapp.service';

/**
 * Templates predefinidos para WhatsApp Business
 * 
 * IMPORTANTE: Estos templates deben estar aprobados en Meta Business Suite
 * antes de poder usarlos. Los nombres deben coincidir exactamente.
 * 
 * Documentación: https://developers.facebook.com/docs/whatsapp/message-templates
 */

export interface TemplateDefinition {
  name: string;
  description: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone?: string;
  }>;
}

/**
 * Servicio para construir los componentes de templates de WhatsApp
 */
@Injectable()
export class WhatsAppTemplateService {
  
  /**
   * Definiciones de templates para referencia
   * (Deben crearse en Meta Business Suite con estos textos)
   */
  readonly templateDefinitions: Record<string, TemplateDefinition> = {
    alerta_emergencia: {
      name: 'alerta_emergencia',
      description: 'Alerta de emergencia del consorcio',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '🚨 *ALERTA DE EMERGENCIA*\n\n*Tipo:* {{1}}\n*Edificio:* {{2}}\n\n{{3}}\n\nPor favor, siga las instrucciones del personal de seguridad.',
      footerText: 'VecinoSimple',
    },
    
    recordatorio_vencimiento: {
      name: 'recordatorio_vencimiento',
      description: 'Recordatorio de vencimiento de expensas',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '📅 *Recordatorio de Expensas*\n\nHola! Te recordamos que tu expensa de *{{1}}* vence el *{{2}}*.\n\nFaltan *{{3}} días* para el vencimiento.\n\nEvitá recargos pagando a tiempo.',
      footerText: 'VecinoSimple',
      buttons: [
        { type: 'URL', text: 'Pagar ahora', url: 'https://app.vecinosimple.com/pagar' },
      ],
    },
    
    confirmacion_pago: {
      name: 'confirmacion_pago',
      description: 'Confirmación de pago recibido',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '✅ *Pago Recibido*\n\nTu pago fue procesado correctamente.\n\n*Monto:* {{1}}\n*Período:* {{2}}\n*Fecha:* {{3}}\n\nGracias por tu pago!',
      footerText: 'VecinoSimple',
    },
    
    codigo_verificacion: {
      name: 'codigo_verificacion',
      description: 'Código de verificación para login',
      category: 'AUTHENTICATION',
      language: 'es_AR',
      bodyText: '🔐 Tu código de verificación es: *{{1}}*\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, ignorá este mensaje.',
      footerText: 'VecinoSimple',
    },
    
    invitacion_plataforma: {
      name: 'invitacion_plataforma',
      description: 'Invitación a unirse a la plataforma',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '👋 Hola *{{1}}*!\n\nFuiste invitado a unirte a *{{2}}* en VecinoSimple.\n\nTu código de invitación es: *{{3}}*\n\nUsá el botón de abajo para registrarte.',
      footerText: 'VecinoSimple',
      buttons: [
        { type: 'URL', text: 'Registrarme', url: 'https://app.vecinosimple.com/registro?code={{1}}' },
      ],
    },
    
    nuevo_comunicado: {
      name: 'nuevo_comunicado',
      description: 'Notificación de nuevo comunicado',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '📢 *Nuevo Comunicado*\n\n*{{1}}* publicó un nuevo comunicado:\n\n*{{2}}*\n\nIngresá a la app para ver el detalle completo.',
      footerText: 'VecinoSimple',
      buttons: [
        { type: 'URL', text: 'Ver comunicado', url: 'https://app.vecinosimple.com/comunicados' },
      ],
    },
    
    actualizacion_reclamo: {
      name: 'actualizacion_reclamo',
      description: 'Actualización de estado de reclamo',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '🔧 *Actualización de Reclamo*\n\nTu reclamo #{{1}} cambió de estado:\n\n*Nuevo estado:* {{2}}\n*Comentario:* {{3}}\n\nIngresá a la app para más detalles.',
      footerText: 'VecinoSimple',
    },
    
    convocatoria_asamblea: {
      name: 'convocatoria_asamblea',
      description: 'Convocatoria a asamblea de propietarios',
      category: 'UTILITY',
      language: 'es_AR',
      bodyText: '🏛️ *Convocatoria a Asamblea*\n\n*{{1}}* convoca a Asamblea de Propietarios.\n\n📅 *Fecha:* {{2}}\n🕐 *Hora:* {{3}}\n📍 *Lugar:* {{4}}\n\nTu participación es importante.',
      footerText: 'VecinoSimple',
      buttons: [
        { type: 'URL', text: 'Ver orden del día', url: 'https://app.vecinosimple.com/asambleas' },
      ],
    },
  };

  // ============================================================================
  // Builders para componentes de templates
  // ============================================================================

  /**
   * Construye componentes para template de alerta de emergencia
   */
  buildAlertaEmergencia(
    tipoEmergencia: string,
    edificio: string,
    mensaje: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: tipoEmergencia },
          { type: 'text', text: edificio },
          { type: 'text', text: mensaje },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de recordatorio de vencimiento
   */
  buildRecordatorioVencimiento(
    monto: string,
    fechaVencimiento: string,
    diasRestantes: number,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: monto },
          { type: 'text', text: fechaVencimiento },
          { type: 'text', text: String(diasRestantes) },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de confirmación de pago
   */
  buildConfirmacionPago(
    monto: string,
    periodo: string,
    fechaPago: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: monto },
          { type: 'text', text: periodo },
          { type: 'text', text: fechaPago },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de código de verificación
   */
  buildCodigoVerificacion(codigo: string): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: codigo },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de invitación
   */
  buildInvitacionPlataforma(
    nombreUsuario: string,
    consorcio: string,
    codigoInvitacion: string,
    linkRegistro: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: nombreUsuario },
          { type: 'text', text: consorcio },
          { type: 'text', text: codigoInvitacion },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: linkRegistro },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de nuevo comunicado
   */
  buildNuevoComunicado(
    consorcio: string,
    tituloComunicado: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: consorcio },
          { type: 'text', text: tituloComunicado },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de actualización de reclamo
   */
  buildActualizacionReclamo(
    ticketId: string,
    nuevoEstado: string,
    comentario: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: ticketId },
          { type: 'text', text: nuevoEstado },
          { type: 'text', text: comentario || 'Sin comentarios adicionales' },
        ],
      },
    ];
  }

  /**
   * Construye componentes para template de convocatoria a asamblea
   */
  buildConvocatoriaAsamblea(
    consorcio: string,
    fecha: string,
    hora: string,
    lugar: string,
  ): WhatsAppTemplateComponent[] {
    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: consorcio },
          { type: 'text', text: fecha },
          { type: 'text', text: hora },
          { type: 'text', text: lugar },
        ],
      },
    ];
  }

  // ============================================================================
  // Utilidades
  // ============================================================================

  /**
   * Obtiene la definición de un template
   */
  getTemplateDefinition(name: string): TemplateDefinition | undefined {
    return this.templateDefinitions[name];
  }

  /**
   * Lista todos los templates disponibles
   */
  listTemplates(): string[] {
    return Object.keys(this.templateDefinitions);
  }

  /**
   * Genera el texto de preview de un template (para testing)
   */
  getTemplatePreview(name: string, params: string[]): string | null {
    const template = this.templateDefinitions[name];
    if (!template) return null;

    let text = template.bodyText;
    params.forEach((param, index) => {
      text = text.replace(`{{${index + 1}}}`, param);
    });

    return text;
  }
}
