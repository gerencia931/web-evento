import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUSES,
  claimFirstAdmin,
  deleteRegistration,
  getMyAdminStatus,
  listRegistrations,
  updateRegistration,
  type CrmRegistration,
  type RegistrationStatus,
} from "@/lib/crm.functions";
import { getSlots, type Slot } from "@/lib/event.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "CRM de contactos | Puntacaribe" },
      {
        name: "description",
        content: "Panel interno para gestionar los registros del evento Travel Sale Puntacaribe.",
      },
      { property: "og:title", content: "CRM de contactos | Puntacaribe" },
      {
        property: "og:description",
        content: "Gestiona los contactos registrados al Travel Sale de Puntacaribe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  confirmado: "Confirmado",
  asistio: "Asistió",
  cancelado: "Cancelado",
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAdminStatus = useServerFn(getMyAdminStatus);
  const fetchRegistrations = useServerFn(listRegistrations);
  const fetchSlots = useServerFn(getSlots);
  const claim = useServerFn(claimFirstAdmin);
  const update = useServerFn(updateRegistration);
  const remove = useServerFn(deleteRegistration);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  const adminQuery = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => fetchAdminStatus(),
  });
  const isAdmin = adminQuery.data?.isAdmin ?? false;

  const listQuery = useQuery({
    queryKey: ["crm-registrations"],
    queryFn: () => fetchRegistrations(),
    enabled: isAdmin,
  });
  const slotsQuery = useQuery({
    queryKey: ["event-slots-admin"],
    queryFn: () => fetchSlots(),
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const claimMutation = useMutation({
    mutationFn: () => claim({ data: undefined as never }),
    onSuccess: () => {
      toast.success("Ahora eres administrador");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status?: RegistrationStatus; notes?: string | null }) =>
      update({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["event-slots-admin"] });
      queryClient.invalidateQueries({ queryKey: ["event-slots"] });
      toast.success("Contacto actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["event-slots-admin"] });
      queryClient.invalidateQueries({ queryKey: ["event-slots"] });
      toast.success("Contacto eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows: CrmRegistration[] = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const slots: Slot[] = useMemo(() => slotsQuery.data ?? [], [slotsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesStatus = statusFilter === "todos" || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        r.interests.join(" ").toLowerCase().includes(q) ||
        (r.influencer ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const byStatus = STATUSES.map((s) => ({
      status: s,
      count: rows.filter((r) => r.status === s).length,
    }));
    return { total: rows.length, byStatus };
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "Nombre",
      "Email",
      "Teléfono",
      "Bloque",
      "Intereses",
      "Influencer",
      "Estado",
      "Notas",
      "Registro",
    ];
    const lines = filtered.map((r) =>
      [
        r.name,
        r.email,
        r.phone ?? "",
        r.slot_label,
        r.interests.join(" | "),
        r.influencer ?? "Ninguno",
        STATUS_LABEL[r.status],
        r.notes ?? "",
        r.created_at,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "contactos-travel-sale.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  if (adminQuery.isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Cargando panel…</div>;
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta no tiene permisos de administrador. Si eres la primera persona del equipo,
            puedes reclamar el acceso ahora.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}>
              Reclamar acceso de administrador
            </Button>
            <Button variant="outline" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Puntacaribe
            </p>
            <h1 className="text-2xl font-bold text-foreground">CRM Travel Sale</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              Exportar CSV
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          {stats.byStatus.map((s) => (
            <div key={s.status} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {STATUS_LABEL[s.status]}
              </p>
              <p className="text-2xl font-bold text-foreground">{s.count}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {slotsQuery.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground md:col-span-2">
              Cargando cupos por horario…
            </div>
          ) : (
            slots.map((slot) => (
              <div key={slot.id} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Horario
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{slot.label}</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Cupos</p>
                    <p className="text-2xl font-bold text-foreground">{slot.capacity}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Inscritos
                    </p>
                    <p className="text-2xl font-bold text-foreground">{slot.registered}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Disponibles
                    </p>
                    <p className="text-2xl font-bold text-primary">{slot.available}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por nombre, correo o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Bloque</TableHead>
                <TableHead>Intereses</TableHead>
                <TableHead>Influencer</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Cargando contactos…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No hay contactos que coincidan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <Fragment key={r.id}>
                    <TableRow>
                      <TableCell>
                        <p className="font-medium text-foreground">{r.name}</p>
                        <p className="text-sm text-muted-foreground">{r.email}</p>
                        {r.phone ? (
                          <p className="text-sm text-muted-foreground">{r.phone}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.slot_label}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.interests.length ? (
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {r.interests.map((i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {i}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.influencer ?? "Ninguno"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.status}
                          onValueChange={(value) =>
                            updateMutation.mutate({
                              id: r.id,
                              status: value as RegistrationStatus,
                            })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("es-CL")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenNotes(openNotes === r.id ? null : r.id)}
                          >
                            Notas
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`¿Eliminar el contacto de ${r.name}?`)) {
                                deleteMutation.mutate(r.id);
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {openNotes === r.id ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <NotesEditor
                            initial={r.notes ?? ""}
                            onSave={(notes) =>
                              updateMutation.mutate({ id: r.id, notes: notes || null })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}

function NotesEditor({ initial, onSave }: { initial: string; onSave: (notes: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Notas internas sobre este contacto…"
        rows={3}
      />
      <Button size="sm" onClick={() => onSave(value)}>
        Guardar notas
      </Button>
    </div>
  );
}
