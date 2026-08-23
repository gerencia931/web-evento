import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Gift,
  Tag,
  Check,
  CheckCircle2,
  Users,
  Flame,
  Sparkles,
  Plane,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  getSlots,
  registerForSlot,
  registrationSchema,
  formatChilePhone,
  formatChilePhoneNational,
  getChilePhoneDigits,
  INTEREST_OPTIONS,
  INFLUENCER_OPTIONS,
  type RegistrationInput,
  type Slot,
} from "@/lib/event.functions";
import { trackMeta } from "@/lib/meta-pixel";

const slotsQueryOptions = queryOptions({
  queryKey: ["event-slots"],
  queryFn: async () => getSlots(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Sale Puntacaribe | Programas todo incluido al Caribe" },
      {
        name: "description",
        content:
          "Reserva tu entrada gratuita para el Travel Sale de Puntacaribe en Ola Hotel, Av. Providencia 307. Programas todo incluido, cruceros, Brasil y Europa: nosotros gestionamos absolutamente todo por ti.",
      },
      {
        property: "og:title",
        content: "Travel Sale Puntacaribe | Programas todo incluido al Caribe",
      },
      {
        property: "og:description",
        content:
          "Reserva tu entrada gratuita para el Travel Sale de Puntacaribe. Programas todo incluido, cruceros, Brasil y Europa: nosotros gestionamos absolutamente todo por ti.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(slotsQueryOptions);
  },
  component: Index,
});

function SlotCard({
  slot,
  selected,
  onSelect,
}: {
  slot: Slot;
  selected: boolean;
  onSelect: (slot: Slot) => void;
}) {
  const isFull = slot.available <= 0;
  const isLow = slot.available <= Math.max(3, Math.round(slot.capacity * 0.25));
  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => onSelect(slot)}
      className={`
        group relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all
        ${
          selected
            ? "border-primary bg-primary/10 ring-2 ring-primary"
            : "border-border bg-card hover:border-primary/40 hover:bg-accent"
        }
        ${isFull ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-display text-lg font-semibold text-foreground">{slot.label}</span>
        {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {isFull ? (
          <span className="font-medium text-destructive">Sin cupos</span>
        ) : (
          <span>
            Quedan <span className="font-semibold text-foreground">{slot.available}</span> de{" "}
            {slot.capacity} cupos
          </span>
        )}
        {!isFull && isLow && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            <Flame className="h-3 w-3" /> ¡Últimos cupos!
          </span>
        )}
      </div>
      {!isFull && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.min(100, Math.round((slot.registered / Math.max(1, slot.capacity)) * 100))}%`,
            }}
          />
        </div>
      )}
    </button>
  );
}

function Index() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: slots } = useSuspenseQuery(slotsQueryOptions);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      slot_id: "",
      name: "",
      email: "",
      phone: "",
      interests: [],
      influencer: "Ninguno",
    },
  });

  const onSubmit = async (values: RegistrationInput) => {
    try {
      const selectedSlot = slots.find((slot) => slot.id === values.slot_id);

      await registerForSlot({ data: values });
      void trackMeta("Lead", {
        email: values.email,
        phone: formatChilePhone(values.phone),
        name: values.name,
      });
      toast.success(
        `¡Entrada reservada! Te esperamos el sábado 29 de agosto en el bloque seleccionado.`,
      );
      reset();
      await queryClient.invalidateQueries({ queryKey: ["event-slots"] });
      await navigate({
        to: "/confirmacion",
        search: {
          bloque: selectedSlot?.label,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al enviar el registro.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col justify-center overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0">
          <img
            src="/images/hero.jpg"
            alt="Atardecer caribeño con maleta de viaje"
            className="h-full w-full object-cover"
            width={1344}
            height={768}
          />
          <div className="absolute inset-0 bg-overlay/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/90" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-24 md:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-light backdrop-blur-sm">
              <Tag className="h-4 w-4 text-primary" />
              Evento exclusivo presencial
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              Travel Sale
              <span className="block text-primary">Puntacaribe</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80 md:text-xl">
              Sábado 29 de agosto en Ola Hotel, Av. Providencia 307. Programas todo incluido,
              cruceros, Brasil y Europa: en Puntacaribe gestionamos absolutamente todo por ti.
              Reserva tu entrada al evento y descubre precios exclusivos.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 text-paper/90">
              <div className="flex items-center gap-2 rounded-lg border border-paper/10 bg-paper/10 px-4 py-2 backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Sábado 29 de agosto</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-paper/10 bg-paper/10 px-4 py-2 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">11:00 - 19:00 hrs</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-paper/10 bg-paper/10 px-4 py-2 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Ola Hotel, Av. Providencia 307</span>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="." hash="registro" resetScroll={false}>
                  Reservar entrada al evento
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-paper/30 bg-paper/10 text-paper backdrop-blur-sm hover:bg-paper/20 hover:text-paper"
              >
                <Link to="." hash="registro" resetScroll={false}>
                  Ver horarios disponibles
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Info / benefits */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Ubicación</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ola Hotel
                  <br />
                  Av. Providencia 307, Santiago
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Plane className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Todo incluido, sin estrés
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vuelos, traslados, hoteles y excursiones: en Puntacaribe gestionamos absolutamente
                  todo por ti. Tú solo disfrutas.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Horario flexible
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Elige el Bloque AM (11:00 - 14:00) o el Bloque PM (14:00 - 19:00). Cupos
                  limitados.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ - What happens at the event */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="text-muted-foreground">
              Todo lo que necesitas saber antes de reservar tu entrada.
            </p>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="event-what">
              <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                ¿Qué sucederá en el Travel Sale Puntacaribe?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Es un evento presencial exclusivo en Ola Hotel, Av. Providencia 307. Durante tu
                bloque horario conocerás las mejores promociones de programas todo incluido al
                Caribe, cruceros, Brasil y circuitos por Europa. Tendrás atención personalizada,
                precios exclusivos de evento y sorpresas solo para quienes asistan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agency-destinations">
              <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                ¿Cuál es el fuerte de Puntacaribe y qué destinos podré cotizar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Gestionamos absolutamente todo por ti: vuelos, traslados, hoteles, excursiones y
                seguros. Nos especializamos en programas todo incluido al Caribe, cruceros, viajes a
                Brasil, circuitos por Europa y viajes grupales. En el evento te presentamos las
                opciones que mejor se ajusten a tu perfil y presupuesto.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="offers">
              <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                ¿Las promociones son solo para quienes asistan presencialmente?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sí. Los descuentos, beneficios extras y sorpresas del Travel Sale son exclusivos
                para asistentes. Reservar tu entrada asegura tu acceso a esas condiciones por tiempo
                limitado.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Famosos */}
      <section className="border-y border-border bg-ink py-16 text-paper">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-primary/20 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Experiencias reales
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              La agencia favorita de los famosos
            </h2>
            <p className="mt-4 text-paper/80">
              Influencers, artistas y viajeros grupales ya vivieron su experiencia todo incluido con
              Puntacaribe. Nosotros gestionamos absolutamente todo por ellos: vuelos, hoteles,
              traslados y excursiones. En el Travel Sale te armamos el mismo viaje, con precios
              exclusivos del evento.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                src: "/images/influencers/famosos-1.png",
                alt: "Parque acuático temático en el Caribe con una viajera de Puntacaribe",
              },
              {
                src: "/images/influencers/famosos-2.png",
                alt: "Viaje grupal de Puntacaribe disfrutando la experiencia en destino",
              },
              {
                src: "/images/influencers/famosos-3.webp",
                alt: "Playa caribeña de aguas turquesas en un viaje Puntacaribe",
              },
              {
                src: "/images/influencers/famosos-4.png",
                alt: "Influencers disfrutando un destino todo incluido con Puntacaribe",
              },
              {
                src: "/images/influencers/otakin.jpg",
                alt: "Viajero de Puntacaribe en un circuito internacional",
              },
            ].map((photo) => (
              <div
                key={photo.src}
                className="group relative overflow-hidden rounded-xl border border-paper/10"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA between sections */}
      <section className="border-y border-border bg-primary/5 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center md:px-8">
          <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            ¿Listo para tu próximo viaje todo incluido?
          </h3>
          <p className="text-muted-foreground">
            Reserva tu entrada ahora y accede a precios exclusivos del Travel Sale.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="." hash="registro" resetScroll={false}>
              Reservar entrada gratuita
            </Link>
          </Button>
        </div>
      </section>

      {/* Registration */}
      <section id="registro" className="mx-auto max-w-6xl px-6 py-24 pt-20 md:px-8 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Reserva tu entrada al evento
            </h2>
            <p className="mt-4 text-muted-foreground">
              Selecciona el bloque en el que prefieras asistir y completa tus datos. Te enviaremos
              la confirmación a tu correo.
            </p>
            <div className="mt-8 hidden space-y-4 lg:block">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Registro gratuito y obligatorio para ingresar.
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Una entrada por persona por bloque horario.
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Solo 40 entradas por bloque: se asignan por orden de registro.
              </div>
            </div>
          </div>

          <Card className="lg:col-span-3 border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-foreground">
                Formulario de inscripción
              </CardTitle>
              <CardDescription>
                Entradas limitadas. Asegura la tuya antes de que se agoten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-foreground">Bloque horario</Label>
                  <Controller
                    name="slot_id"
                    control={control}
                    render={({ field }) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {slots.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            selected={field.value === slot.id}
                            onSelect={(s) => field.onChange(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  />
                  {errors.slot_id && (
                    <p className="text-sm text-destructive">{errors.slot_id.message}</p>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Nombre completo
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej: Carolina López"
                      {...register("name")}
                      className="bg-background"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      {...register("email")}
                      className="bg-background"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Teléfono
                  </Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div className="flex h-10 w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <span className="flex shrink-0 items-center gap-2 border-r border-border bg-muted px-3 font-medium text-foreground">
                          <span aria-hidden="true">🇨🇱</span>
                          <span>+56</span>
                        </span>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={11}
                          placeholder="9 9999 9999"
                          value={formatChilePhoneNational(field.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onChange={(event) =>
                            field.onChange(getChilePhoneDigits(event.target.value))
                          }
                          className="h-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    )}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground">¿Qué tipo de vacaciones te gustaría?</Label>
                  <p className="text-sm text-muted-foreground">Puedes elegir más de una opción.</p>
                  <Controller
                    name="interests"
                    control={control}
                    render={({ field }) => (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {INTEREST_OPTIONS.map((option) => {
                          const checked = field.value?.includes(option) ?? false;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  checked
                                    ? (field.value ?? []).filter((v) => v !== option)
                                    : [...(field.value ?? []), option],
                                )
                              }
                              className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-all ${
                                checked
                                  ? "border-primary bg-background font-medium text-foreground"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? "border-primary bg-background"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                              </span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.interests && (
                    <p className="text-sm text-destructive">{errors.interests.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="influencer" className="text-foreground">
                    ¿Vienes por algún influencer?
                  </Label>
                  <Controller
                    name="influencer"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "Ninguno"}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger id="influencer" className="bg-background">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {INFLUENCER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.influencer && (
                    <p className="text-sm text-destructive">{errors.influencer.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? "Registrando..." : "Confirmar mi asistencia"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground md:px-8">
          © {new Date().getFullYear()} Puntacaribe. Todos los derechos reservados.
          <br />
          Evento presencial en Ola Hotel, Av. Providencia 307, Santiago.
          <br />
          <Link to="/auth" className="text-xs underline-offset-4 hover:underline">
            Acceso equipo
          </Link>
        </div>
      </footer>
    </div>
  );
}
