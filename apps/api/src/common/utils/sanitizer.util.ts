/**
 * Utilidades de Sanitización de Seguridad
 * VecinoSimple - Prevención XSS y validación de inputs
 *
 * @module common/utils/sanitizer
 */

/**
 * Clase de utilidades para sanitización de inputs
 * Centraliza toda la lógica de prevención XSS
 */
export class Sanitizer {
  /**
   * Caracteres HTML peligrosos y sus entidades
   */
  private static readonly HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  /**
   * Sanitiza texto plano (sin HTML permitido)
   * Convierte todos los caracteres especiales HTML a entidades
   *
   * @param input - Texto a sanitizar
   * @returns Texto sanitizado
   *
   * @example
   * Sanitizer.text('<script>alert(1)</script>')
   * // Returns: '&lt;script&gt;alert(1)&lt;/script&gt;'
   */
  static text(input: string | null | undefined): string {
    if (!input || typeof input !== "string") return "";

    return input
      .replace(/[&<>"'`=\/]/g, (char) => this.HTML_ENTITIES[char] || char)
      .trim();
  }

  /**
   * Sanitiza texto permitiendo solo tags HTML seguros
   * Para campos que necesitan formato básico (como descripciones)
   *
   * @param input - HTML a sanitizar
   * @returns HTML con solo tags seguros
   *
   * @example
   * Sanitizer.safeHtml('<b>Bold</b><script>evil()</script>')
   * // Returns: '<b>Bold</b>'
   */
  static safeHtml(input: string | null | undefined): string {
    if (!input || typeof input !== "string") return "";

    const allowedTags = [
      "b",
      "i",
      "em",
      "strong",
      "u",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "a",
    ];

    // Primero, escapar todo
    let result = this.text(input);

    // Luego, restaurar solo los tags permitidos
    for (const tag of allowedTags) {
      // Opening tags
      const openPattern = new RegExp(
        `&lt;(${tag})(\\s[^&]*)?&gt;`,
        "gi"
      );
      result = result.replace(openPattern, (_, tagName, attrs) => {
        // Solo permitir href en <a> tags, y sanitizarlo
        if (tagName.toLowerCase() === "a" && attrs) {
          const hrefMatch = attrs.match(/href=&quot;([^&]*)&quot;/i);
          if (hrefMatch) {
            const url = this.url(hrefMatch[1].replace(/&amp;/g, "&"));
            if (url) {
              return `<${tagName} href="${url}" rel="noopener noreferrer" target="_blank">`;
            }
          }
          return `<${tagName}>`;
        }
        return `<${tagName}>`;
      });

      // Closing tags
      const closePattern = new RegExp(`&lt;/${tag}&gt;`, "gi");
      result = result.replace(closePattern, `</${tag}>`);

      // Self-closing tags (br)
      if (tag === "br") {
        result = result.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
      }
    }

    return result;
  }

  /**
   * Sanitiza y valida una URL
   * Previene ataques javascript:, data:, y SSRF
   *
   * @param input - URL a validar
   * @param allowedDomains - Lista de dominios permitidos (opcional)
   * @returns URL sanitizada o null si es inválida
   *
   * @example
   * Sanitizer.url('javascript:alert(1)')
   * // Returns: null
   *
   * Sanitizer.url('https://vecinosimple.com/file.pdf')
   * // Returns: 'https://vecinosimple.com/file.pdf'
   */
  static url(
    input: string | null | undefined,
    allowedDomains?: string[]
  ): string | null {
    if (!input || typeof input !== "string") return null;

    try {
      const url = new URL(input.trim());

      // Solo permitir http y https
      if (!["http:", "https:"].includes(url.protocol)) {
        return null;
      }

      // Bloquear localhost y IPs privadas en producción
      if (process.env.NODE_ENV === "production") {
        const hostname = url.hostname.toLowerCase();
        const blockedPatterns = [
          /^localhost$/,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
          /^192\.168\./,
          /^0\.0\.0\.0$/,
          /^::1$/,
          /^fc00:/,
          /^fe80:/,
        ];

        if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
          return null;
        }
      }

      // Validar contra dominios permitidos si se especifican
      if (allowedDomains && allowedDomains.length > 0) {
        const hostname = url.hostname.toLowerCase();
        const isAllowed = allowedDomains.some(
          (domain) =>
            hostname === domain.toLowerCase() ||
            hostname.endsWith(`.${domain.toLowerCase()}`)
        );

        if (!isAllowed) {
          return null;
        }
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitiza un nombre de archivo
   * Remueve caracteres peligrosos y previene path traversal
   *
   * @param input - Nombre de archivo a sanitizar
   * @param maxLength - Longitud máxima permitida
   * @returns Nombre de archivo seguro
   *
   * @example
   * Sanitizer.filename('../../../etc/passwd')
   * // Returns: 'etc_passwd'
   */
  static filename(input: string | null | undefined, maxLength = 255): string {
    if (!input || typeof input !== "string") return "";

    return (
      input
        // Remover path traversal
        .replace(/\.\./g, "")
        // Solo caracteres alfanuméricos, puntos, guiones y underscores
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        // Evitar múltiples puntos consecutivos
        .replace(/\.{2,}/g, ".")
        // Evitar múltiples underscores consecutivos
        .replace(/_{2,}/g, "_")
        // Trim puntos y underscores del inicio y fin
        .replace(/^[._]+|[._]+$/g, "")
        // Limitar longitud
        .substring(0, maxLength)
    );
  }

  /**
   * Sanitiza un email (básico)
   * No valida completamente, solo limpia caracteres peligrosos
   *
   * @param input - Email a sanitizar
   * @returns Email sanitizado
   */
  static email(input: string | null | undefined): string {
    if (!input || typeof input !== "string") return "";

    return input
      .toLowerCase()
      .trim()
      .replace(/[<>'"\\]/g, "");
  }

  /**
   * Sanitiza un string para uso en queries SQL (backup)
   * NOTA: Siempre usar prepared statements con Prisma
   * Esta función es solo un backup adicional
   *
   * @param input - String a sanitizar
   * @returns String sanitizado
   */
  static sqlString(input: string | null | undefined): string {
    if (!input || typeof input !== "string") return "";

    return input
      .replace(/'/g, "''")
      .replace(/\\/g, "\\\\")
      .replace(/\0/g, "")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\x1a/g, "\\Z");
  }

  /**
   * Sanitiza un objeto JSON recursivamente
   * Útil para sanitizar payloads completos
   *
   * @param obj - Objeto a sanitizar
   * @returns Objeto con todos los strings sanitizados
   */
  static object<T extends Record<string, unknown>>(obj: T): T {
    if (!obj || typeof obj !== "object") return obj;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.text(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string"
            ? this.text(item)
            : typeof item === "object" && item !== null
              ? this.object(item as Record<string, unknown>)
              : item
        );
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.object(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  /**
   * Valida que un string solo contenga caracteres alfanuméricos
   *
   * @param input - String a validar
   * @returns true si solo contiene caracteres alfanuméricos
   */
  static isAlphanumeric(input: string | null | undefined): boolean {
    if (!input || typeof input !== "string") return false;
    return /^[a-zA-Z0-9]+$/.test(input);
  }

  /**
   * Valida que un string sea un UUID válido
   *
   * @param input - String a validar
   * @returns true si es un UUID válido
   */
  static isUUID(input: string | null | undefined): boolean {
    if (!input || typeof input !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input
    );
  }

  /**
   * Valida que un string sea un CUID válido
   *
   * @param input - String a validar
   * @returns true si es un CUID válido
   */
  static isCUID(input: string | null | undefined): boolean {
    if (!input || typeof input !== "string") return false;
    return /^c[a-z0-9]{24}$/.test(input);
  }

  /**
   * Valida un periodo en formato YYYY-MM
   *
   * @param input - Periodo a validar
   * @returns true si es un periodo válido
   */
  static isPeriodo(input: string | null | undefined): boolean {
    if (!input || typeof input !== "string") return false;
    if (!/^\d{4}-\d{2}$/.test(input)) return false;

    const parts = input.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * Redacta datos sensibles para logging seguro
   *
   * @param data - Datos a redactar
   * @param sensitiveKeys - Keys a redactar
   * @returns Datos con información sensible redactada
   */
  static redactForLogging<T extends Record<string, unknown>>(
    data: T,
    sensitiveKeys: string[] = [
      "password",
      "token",
      "secret",
      "cbu",
      "dni",
      "refreshToken",
      "magicLinkToken",
      "twoFactorSecret",
    ]
  ): T {
    if (!data || typeof data !== "object") return data;

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const isKeySensitive = sensitiveKeys.some(
        (sensitive) =>
          key.toLowerCase().includes(sensitive.toLowerCase())
      );

      if (isKeySensitive) {
        redacted[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redacted[key] = this.redactForLogging(
          value as Record<string, unknown>,
          sensitiveKeys
        );
      } else {
        redacted[key] = value;
      }
    }

    return redacted as T;
  }
}

/**
 * Exportación de funciones individuales para uso directo
 */
export const sanitizeText = Sanitizer.text.bind(Sanitizer);
export const sanitizeHtml = Sanitizer.safeHtml.bind(Sanitizer);
export const sanitizeUrl = Sanitizer.url.bind(Sanitizer);
export const sanitizeFilename = Sanitizer.filename.bind(Sanitizer);
export const sanitizeEmail = Sanitizer.email.bind(Sanitizer);
export const redactForLogging = Sanitizer.redactForLogging.bind(Sanitizer);
