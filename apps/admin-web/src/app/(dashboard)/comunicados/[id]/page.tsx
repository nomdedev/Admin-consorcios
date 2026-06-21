"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  AlertBanner,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@vecinosimple/ui";
import { ArrowLeft, Megaphone, Trash2, Send, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { useComunicado, useDeleteComunicado, useEnviarNotificacionesComunicado } from "@/features/comunicados";

export default function ComunicadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  
  const { data: comunicado, isLoading, isError } = useComunicado(id);
  const deleteComunicado = useDeleteComunicado();
  const enviarNotificaciones = useEnviarNotificacionesComunicado();

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isActive = () => {
    if (!comunicado) return false;
    const now = new Date();
    const desde = new Date(comunicado.publicarDesde);
    const hasta = comunicado.publicarHasta ? new Date(comunicado.publicarHasta) : null;
    return now >= desde && (!hasta || now <= hasta);
  };

  const handleDelete = async () => {
    try {
      await deleteComunicado.mutateAsync(id);
      router.push("/comunicados");
    } catch {
      // Error manejado por el hook
    }
  };

  const handleEnviarNotificaciones = async () => {
    try {
      await enviarNotificaciones.mutateAsync({
        id,
        canales: {
          email: comunicado?.enviarEmail,
          whatsapp: comunicado?.enviarWhatsapp,
        },
      });
      setShowSendDialog(false);
    } catch {
      // Error manejado por el hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !comunicado) {
    return (
      <div className="space-y-6">
        <Link href="/comunicados">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <AlertBanner title="Error" variant="error">
          No se pudo cargar el comunicado. Verifica que existe y reintenta.
        </AlertBanner>
      </div>
    );
  }

  const activo = isActive();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/comunicados">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900">
                {comunicado.titulo}
              </h1>
              {comunicado.importante && (
                <Badge variant="error">Importante</Badge>
              )}
              <Badge variant={activo ? "success" : "default"}>
                {activo ? "Activo" : "Programado"}
              </Badge>
            </div>
            <p className="text-neutral-600 mt-1">
              Creado el {formatDate(comunicado.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            disabled={!activo} 
            variant="secondary"
            onClick={() => setShowSendDialog(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar notificaciones
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido */}
        <div className="lg:col-span-2">
          <Card className={comunicado.importante ? "border-l-4 border-l-red-500" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Contenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-neutral max-w-none">
                <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                  {comunicado.contenido}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Programación */}
          <Card>
            <CardHeader>
              <CardTitle>Programación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Publicar desde</p>
                <p className="font-medium">{formatDate(comunicado.publicarDesde)}</p>
              </div>
              {comunicado.publicarHasta && (
                <div>
                  <p className="text-sm text-neutral-500">Publicar hasta</p>
                  <p className="font-medium">{formatDate(comunicado.publicarHasta)}</p>
                </div>
              )}
              {!comunicado.publicarHasta && (
                <p className="text-sm text-neutral-500 italic">
                  Sin fecha de finalización
                </p>
              )}
            </CardContent>
          </Card>

          {/* Configuración de notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className={`h-5 w-5 ${comunicado.enviarEmail ? "text-brand-600" : "text-neutral-300"}`} />
                <span className={comunicado.enviarEmail ? "text-neutral-700" : "text-neutral-400"}>
                  {comunicado.enviarEmail ? "Email habilitado" : "Email no habilitado"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className={`h-5 w-5 ${comunicado.enviarWhatsapp ? "text-green-600" : "text-neutral-300"}`} />
                <span className={comunicado.enviarWhatsapp ? "text-neutral-700" : "text-neutral-400"}>
                  {comunicado.enviarWhatsapp ? "WhatsApp habilitado" : "WhatsApp no habilitado"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Info adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-neutral-500">Última actualización</p>
                <p>{formatDate(comunicado.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar comunicado?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El comunicado &quot;{comunicado.titulo}&quot; será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={deleteComunicado.isPending}
              variant="danger"
              onClick={handleDelete}
            >
              {deleteComunicado.isPending ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de envío de notificaciones */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar notificaciones</DialogTitle>
            <DialogDescription>
              Se enviarán notificaciones a todos los vecinos según la configuración:
              <ul className="mt-2 space-y-1">
                {comunicado.enviarEmail && <li>✉️ Email a todos los vecinos registrados</li>}
                {comunicado.enviarWhatsapp && <li>📱 WhatsApp a todos los vecinos registrados</li>}
                {!comunicado.enviarEmail && !comunicado.enviarWhatsapp && (
                  <li className="text-amber-600">⚠️ No hay canales de notificación habilitados</li>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={enviarNotificaciones.isPending || (!comunicado.enviarEmail && !comunicado.enviarWhatsapp)}
              onClick={handleEnviarNotificaciones}
            >
              {enviarNotificaciones.isPending ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
