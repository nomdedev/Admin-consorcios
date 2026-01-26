/**
 * Middleware de Autenticación
 * Protege rutas del dashboard y redirige a login si no hay sesión
 * Valida JWT del servidor con firma, expiración, issuer y audience
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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
    if (error instanceof Error) {
      // Manejar errores específicos de JWT
      if (error.message.includes('JWTExpired')) {
        throw new Error('Token expirado');
      }
      if (error.message.includes('JWTInvalidSignature')) {
        throw new Error('Firma del token inválida');
      }
      if (error.message.includes('JWTInvalidIssuer')) {
        throw new Error('Issuer del token inválido');
      }
      if (error.message.includes('JWTInvalidAudience')) {
        throw new Error('Audience del token inválido');
      }
    }
    throw new Error('Token inválido');
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // archivos con extensión
  ) {
    return NextResponse.next();
  }

  // Permitir rutas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Permitir rutas de API públicas
  if (publicApiPaths.some(path => pathname.startsWith(path))) {
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
