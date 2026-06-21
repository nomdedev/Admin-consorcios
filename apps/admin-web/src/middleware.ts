/**
 * Middleware de Autenticación
 * Protege rutas del dashboard y redirige a login si no hay sesión
 * Valida JWT del servidor con firma, expiración, issuer y audience
 */

import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  isLimited: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const rateLimitConfig = {
  // Rate limiting estricto para rutas de autenticación
  authWindowMs: 60_000,  // 1 minuto
  authMax: 10,           // 10 intentos por minuto
  // Rate limiting para rutas públicas
  publicWindowMs: 60_000, // 1 minuto
  publicMax: 60,          // 60 requests por minuto
  // Rate limiting general para rutas protegidas
  protectedWindowMs: 60_000, // 1 minuto
  protectedMax: 100,         // 100 requests por minuto
  // Límite de entradas en memoria
  maxEntries: 10_000,
};

// Rutas públicas que no requieren autenticación
const publicPaths = [
  '/login',
  '/magic-link',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

// Rutas de API que no requieren autenticación
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/magic-link',
  '/api/auth/verify',
];

const rateLimitedAuthPaths = new Set(publicApiPaths);

/** Verifica si la ruta es pública (no requiere autenticación) */
function isPublicRoute(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

/** Verifica si la ruta de API es pública */
function isPublicApiRoute(pathname: string): boolean {
  return publicApiPaths.some(path => pathname.startsWith(path));
}

/** Verifica si es un asset estático que no requiere procesamiento */
function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.');
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { isLimited: false, remaining: max - 1, resetAt, limit: max };
  }

  entry.count += 1;

  if (rateLimitStore.size > rateLimitConfig.maxEntries) {
    rateLimitStore.clear();
  }

  const remaining = Math.max(0, max - entry.count);
  return { isLimited: entry.count > max, remaining, resetAt: entry.resetAt, limit: max };
}

/**
 * Interface para el payload del JWT
 */
interface JwtPayload {
  sub: string;
  email: string;
  type?: string;
  iss?: string;
  aud?: string;
  iat: number;
  exp: number;
}

/**
 * Obtiene el token JWT de la request
 * Primero busca en cookies, luego en header Authorization
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Verificar en cookies
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    return token;
  }

  // Verificar en header Authorization (para SPA)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Valida el token JWT
 * @param token - El token JWT a validar
 * @returns El payload del token si es válido
 * @throws Error si el token es inválido
 */
async function validateJwtToken(token: string): Promise<JwtPayload> {
  // Obtener JWT_SECRET de variables de entorno
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en el servidor');
  }

  // Convertir el secret a Uint8Array para jose
  const secretKey = new TextEncoder().encode(secret);

  try {
    // Verificar el token
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'vecinosimple',
      audience: 'vecinosimple-api',
    });

    // Convertir el payload al tipo JwtPayload
    return payload as unknown as JwtPayload;
  } catch (error) {
    throw new Error(getJwtErrorMessage(error));
  }
}

function getJwtErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Token inválido';
  }

  const errorMappings = [
    { match: 'JWTExpired', message: 'Token expirado' },
    { match: 'JWTInvalidSignature', message: 'Firma del token inválida' },
    { match: 'JWTInvalidIssuer', message: 'Issuer del token inválido' },
    { match: 'JWTInvalidAudience', message: 'Audience del token inválido' },
  ];

  const mappedError = errorMappings.find(({ match }) => error.message.includes(match));
  return mappedError?.message ?? 'Token inválido';
}

/** Crea headers de rate limit para la respuesta */
function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}

/** Crea respuesta 429 Too Many Requests */
function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return new NextResponse('Too Many Requests', {
    status: 429,
    headers: {
      ...createRateLimitHeaders(result),
      'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
    },
  });
}

/** Verifica rate limiting y retorna respuesta si está limitado */
function checkAndApplyRateLimit(
  pathname: string,
  ip: string
): NextResponse | null {
  const rateLimitKeyBase = `${ip}:${pathname}`;

  if (rateLimitedAuthPaths.has(pathname)) {
    const result = checkRateLimit(
      `auth:${rateLimitKeyBase}`,
      rateLimitConfig.authMax,
      rateLimitConfig.authWindowMs
    );
    if (result.isLimited) return createRateLimitResponse(result);
  } else if (isPublicRoute(pathname)) {
    const result = checkRateLimit(
      `public:${rateLimitKeyBase}`,
      rateLimitConfig.publicMax,
      rateLimitConfig.publicWindowMs
    );
    if (result.isLimited) return createRateLimitResponse(result);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets estáticos
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (process.env.TEST_MODE === 'true' && request.headers.get('x-test-mode') === 'true') {
    return NextResponse.next();
  }

  // Aplicar rate limiting
  const rateLimitResponse = checkAndApplyRateLimit(pathname, getClientIp(request));
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Permitir rutas públicas
  if (isPublicRoute(pathname) || isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Obtener el token de la request
  const token = getTokenFromRequest(request);

  // Si no hay token, redirigir a login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validar el token JWT
  try {
    const payload = await validateJwtToken(token);

    // Validar campos requeridos del payload
    if (!payload.sub || !payload.email) {
      throw new Error('Token inválido: campos faltantes');
    }

    // El token es válido, continuar con la request
    return NextResponse.next();
  } catch (error) {
    // Manejar errores de validación
    let errorMessage = 'Error de autenticación';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // En caso de error de validación, redirigir a login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('error', errorMessage);
    
    return NextResponse.redirect(loginUrl);
  }
}

// Configurar qué rutas pasan por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
