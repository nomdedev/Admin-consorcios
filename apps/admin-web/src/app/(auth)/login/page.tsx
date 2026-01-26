'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label,
  AlertBanner,
} from 'ui';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useLogin, useRequestMagicLink } from '@/features/auth';

// Schema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic-link'>('magic-link');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const loginMutation = useLogin();
  const magicLinkMutation = useRequestMagicLink();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch('email');

  const onSubmit = async (data: LoginForm) => {
    if (mode === 'magic-link') {
      await magicLinkMutation.mutateAsync({ email: data.email });
      setMagicLinkSent(true);
    } else {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
    }
  };

  const isLoading = loginMutation.isPending || magicLinkMutation.isPending;
  const error = loginMutation.error || magicLinkMutation.error;

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Mail className="h-8 w-8 text-brand-600" />
            </div>
            <CardTitle>Revisa tu email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-neutral-600">
              Enviamos un enlace de acceso a{' '}
              <strong className="text-neutral-900">{email}</strong>
            </p>
            <p className="text-sm text-neutral-500">
              El enlace expira en 15 minutos. Si no lo encuentras, revisa la carpeta de spam.
            </p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setMagicLinkSent(false)}
            >
              Volver a intentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
            VS
          </div>
          <CardTitle>Bienvenido a VecinoSimple</CardTitle>
          <p className="mt-2 text-sm text-neutral-600">
            Portal de Administración de Consorcios
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <AlertBanner 
              className="mb-4" 
              title="Error de autenticación"
              variant="error"
            >
              {(error as Error).message || 'Ocurrió un error. Intenta nuevamente.'}
            </AlertBanner>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  {...register('email')}
                  autoComplete="email"
                  className="pl-10"
                  id="email"
                  placeholder="tu@email.com"
                  type="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password (solo si es modo password) */}
            {mode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    {...register('password')}
                    autoComplete="current-password"
                    className="pl-10"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Botón de submit */}
            <Button
              className="w-full"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : mode === 'magic-link' ? (
                <>
                  Enviar enlace de acceso
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          {/* Toggle de modo */}
          <div className="mt-6 text-center">
            <button
              className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
              type="button"
              onClick={() => setMode(mode === 'password' ? 'magic-link' : 'password')}
            >
              {mode === 'magic-link' 
                ? '¿Preferís usar contraseña?' 
                : '¿Preferís un enlace por email?'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-neutral-200 pt-4 text-center text-sm text-neutral-500">
            <p>
              ¿No tenés cuenta?{' '}
              <Link 
                className="font-medium text-brand-600 hover:text-brand-700"
                href="/contacto"
              >
                Contactanos
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
