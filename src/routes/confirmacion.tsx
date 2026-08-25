import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Ticket,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const confirmationSearchSchema = z.object({
  bloque: z.string().optional().catch(""),
});

export const Route = createFileRoute("/confirmacion")({
  validateSearch: (search) => confirmationSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Entrada reservada | Travel Sale Puntacaribe" },
      {
        name: "description",
        content:
          "Confirmación de entrada gratuita para el evento presencial Travel Sale Puntacaribe en Ola Hotel, Av. Providencia 307, Santiago.",
      },
      { property: "og:title", content: "Entrada reservada | Travel Sale Puntacaribe" },
      {
        property: "og:description",
        content:
          "Tu entrada gratuita para el evento presencial Travel Sale Puntacaribe quedó reservada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { bloque } = Route.useSearch();
  const selectedBlock = bloque?.trim() || "Bloque horario seleccionado";

  return (
    <main className="min-h-screen bg-background font-sans">
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0">
          <img
            src="/images/hero.jpg"
            alt="Atardecer caribeño con maleta de viaje"
            className="h-full w-full object-cover"
            width={1344}
            height={768}
          />
          <div className="absolute inset-0 bg-overlay/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink/95" />
        </div>

        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6">
            <Link to="/" aria-label="Puntacaribe inicio" className="inline-flex shrink-0">
              <img
                src="/images/logo-white-punta.png"
                alt="Puntacaribe"
                width={842}
                height={231}
                className="h-10 w-auto md:h-14"
              />
            </Link>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden border-paper/30 bg-paper/10 text-paper backdrop-blur-sm hover:bg-paper/20 hover:text-paper sm:inline-flex"
            >
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </header>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-28 pt-20 md:px-8 md:pb-36 md:pt-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-light backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Entrada confirmada
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              Tu entrada al evento
              <span className="block text-primary">está reservada</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80 md:text-xl">
              Ya tienes acceso al Travel Sale Puntacaribe, un evento presencial con atención
              personalizada, precios exclusivos y beneficios para quienes asisten.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-6 pb-20 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-xl border border-border bg-card p-6 shadow-xl md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Travel Sale Puntacaribe
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Entrada presencial gratuita
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Tu registro quedó guardado. El equipo validará tu entrada en el acceso al evento.
                </p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-background">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Fecha</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sábado 29 de agosto de 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Horario</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedBlock}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Lugar</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ola Hotel, Av. Providencia 307, Santiago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Estado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Entrada confirmada</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ola%20Hotel%20Av.%20Providencia%20307%20Santiago"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="h-4 w-4" />
                  Abrir ubicación
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-xl md:p-8">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Te esperamos presencialmente
            </h2>
            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Entrada personal</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El registro es gratuito y está asociado a tus datos de inscripción.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Confirmación registrada</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Si necesitas modificar tu asistencia, el equipo puede ayudarte con tu correo de
                    registro.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Evento en Ola Hotel</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Llega durante tu bloque para cotizar con atención personalizada y acceder a los
                    beneficios del Travel Sale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
