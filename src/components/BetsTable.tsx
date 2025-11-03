import React, { useState } from "react";
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TextField,
    Select,
    MenuItem,
    Button,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Autocomplete,
    CircularProgress,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Bet } from "../types";

const LIMIT = 10;

interface BetsResponse {
    items: Bet[];
    total: number;
}

interface Bookie {
    name: string;
    description?: string;
}

interface Customer {
    id: number;
    username: string;
    real_name?: string;
}

interface EventItem {
    id: number;
    date: string;
    competition_id: number;
    team_a_id: number;
    team_b_id: number;
    status: string;
    sport?: string;
}

export const BetsTable: React.FC = () => {
    const [status, setStatus] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewBet, setViewBet] = useState<Bet | null>(null);
    const [editBet, setEditBet] = useState<Bet | null>(null);
    const [editStatus, setEditStatus] = useState<string>("");
    const [editOutcome, setEditOutcome] = useState<string>("");

    const [form, setForm] = useState({
        bookie: "",
        customer_id: "",
        event_id: "",
        placement_status: "placed",
        stake_amount: "",
        stake_currency: "USD",
        odds: "",
    });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["bets", status, search, page],
        queryFn: async () => {
            const offset = (page - 1) * LIMIT;
            const res = await api.get<BetsResponse>("/bets/", {
                params: { status: status || undefined, search: search || undefined, limit: LIMIT, offset },
            });
            return res.data;
        },
    });

    const { data: bookiesRaw, isLoading: loadingBookies } = useQuery({
        queryKey: ["bookies"],
        queryFn: async () => (await api.get("/bookies/")).data,
    });

    const { data: customersRaw, isLoading: loadingCustomers } = useQuery({
        queryKey: ["customers-all"],
        queryFn: async () => (await api.get("/customers/")).data,
    });

    const { data: eventsRaw, isLoading: loadingEvents } = useQuery({
        queryKey: ["events-all"],
        queryFn: async () => (await api.get("/events/")).data,
    });

    const bookies: Bookie[] = Array.isArray(bookiesRaw) ? bookiesRaw : bookiesRaw?.items || [];
    const customers: Customer[] = Array.isArray(customersRaw) ? customersRaw : customersRaw?.items || [];
    const events: EventItem[] = Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.items || [];

    const customerOptions =
        customers.map((c) => ({
            label: c.real_name ? `${c.real_name} (@${c.username})` : `@${c.username}`,
            value: String(c.id),
        })) ?? [];

    const bookieOptions =
        bookies.map((b) => ({
            label: b.description ? `${b.name} — ${b.description}` : b.name,
            value: b.name,
        })) ?? [];

    const eventOptions =
        events.map((e) => ({
            label: `#${e.id} • ${new Date(e.date).toLocaleString()} • ${e.status}`,
            value: String(e.id),
            disabled: e.status === "finished",
        })) ?? [];

    const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

    const handleOpen = () => {
        setForm({
            bookie: "",
            customer_id: "",
            event_id: "",
            placement_status: "placed",
            stake_amount: "",
            stake_currency: "USD",
            odds: "",
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        if (!form.customer_id || !form.event_id || !form.stake_amount || !form.odds) {
            alert("Fill required fields");
            return;
        }
        setSaving(true);
        try {
            await api.post("/bets/", {
                bookie: form.bookie || "BetMaster",
                customer_id: Number(form.customer_id),
                event_id: Number(form.event_id),
                placement_status: form.placement_status,
                stake_amount: Number(form.stake_amount),
                stake_currency: form.stake_currency,
                odds: Number(form.odds),
            });
            setOpen(false);
            setPage(1);
            refetch();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Server error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this bet?")) return;
        try {
            await api.delete(`/bets/${id}`);
            refetch();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Delete failed");
        }
    };

    const selectedBookie = form.bookie ? bookieOptions.find((b) => b.value === form.bookie) ?? null : null;

    return (
        <div style={{ padding: 24 }}>
            <h2>Bets</h2>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <TextField label="Search" size="small" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} displayEmpty>
                    <MenuItem value="">All statuses</MenuItem>
                    <MenuItem value="placed">Placed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                </Select>
                <Button variant="outlined" onClick={handleOpen}>
                    ADD BET
                </Button>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Bookie</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Sport</TableCell>
                        <TableCell>Odds</TableCell>
                        <TableCell>Stake</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {!isLoading &&
                        data?.items?.map((bet) => (
                            <TableRow key={bet.id}>
                                <TableCell>{bet.bookie}</TableCell>
                                <TableCell>{bet.customer_name || bet.customer_id}</TableCell>
                                <TableCell>{bet.sport}</TableCell>
                                <TableCell>{bet.odds}</TableCell>
                                <TableCell>
                                    {bet.stake_amount} {bet.stake_currency}
                                </TableCell>
                                <TableCell>{bet.placement_status}</TableCell>
                                <TableCell>
                                    {bet.created_at ? new Date(bet.created_at).toLocaleString() : "-"}
                                </TableCell>
                                <TableCell>
                                    <Button size="small" onClick={() => setViewBet(bet)}>
                                        VIEW
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setEditBet(bet);
                                            setEditStatus(bet.placement_status || "");
                                            setEditOutcome(bet.outcome || "");
                                        }}
                                    >
                                        EDIT
                                    </Button>
                                    <Button size="small" color="error" onClick={() => handleDelete(bet.id)}>
                                        DELETE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>

            <Pagination sx={{ marginTop: 2 }} count={totalPages} page={page} onChange={(_, p) => setPage(p)} />

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Add bet</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <Autocomplete
                        options={customerOptions}
                        loading={loadingCustomers}
                        value={form.customer_id ? customerOptions.find((c) => c.value === form.customer_id) ?? null : null}
                        onChange={(_, v) => handleChange("customer_id", v ? v.value : "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Customer"
                                required
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingCustomers ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    <Autocomplete
                        options={eventOptions}
                        loading={loadingEvents}
                        getOptionDisabled={(option) => option.disabled}
                        value={form.event_id ? eventOptions.find((e) => e.value === form.event_id) ?? null : null}
                        onChange={(_, v) => handleChange("event_id", v ? v.value : "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Event"
                                required
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingEvents ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    <FormControl>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                            labelId="status-label"
                            label="Status"
                            value={form.placement_status}
                            onChange={(e) => handleChange("placement_status", e.target.value)}
                        >
                            <MenuItem value="placed">placed</MenuItem>
                            <MenuItem value="failed">failed</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Stake amount"
                        type="number"
                        required
                        value={form.stake_amount}
                        onChange={(e) => handleChange("stake_amount", e.target.value)}
                    />

                    <FormControl>
                        <InputLabel id="currency-label">Currency</InputLabel>
                        <Select
                            labelId="currency-label"
                            label="Currency"
                            value={form.stake_currency}
                            onChange={(e) => handleChange("stake_currency", e.target.value)}
                        >
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Odds"
                        type="number"
                        required
                        value={form.odds}
                        onChange={(e) => handleChange("odds", e.target.value)}
                    />

                    <Autocomplete
                        options={bookieOptions}
                        loading={loadingBookies}
                        value={selectedBookie}
                        onChange={(_, v) => handleChange("bookie", v ? v.value : "")}
                        getOptionLabel={(o) => o.label}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Bookie"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingBookies ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" disabled={saving}>
                        {saving ? "Saving..." : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!viewBet} onClose={() => setViewBet(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Bet details</DialogTitle>
                <DialogContent dividers>
                    {viewBet && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                                <b>ID:</b> {viewBet.id}
                            </div>
                            <div>
                                <b>Bookie:</b> {viewBet.bookie}
                            </div>
                            <div>
                                <b>Customer:</b> {viewBet.customer_name || viewBet.customer_id}
                            </div>
                            <div>
                                <b>Sport:</b> {viewBet.sport}
                            </div>
                            <div>
                                <b>Odds:</b> {viewBet.odds}
                            </div>
                            <div>
                                <b>Stake:</b> {viewBet.stake_amount} {viewBet.stake_currency}
                            </div>
                            <div>
                                <b>Status:</b> {viewBet.placement_status}
                            </div>
                            <div>
                                <b>Outcome:</b> {viewBet.outcome || "—"}
                            </div>
                            <div>
                                <b>Date:</b>{" "}
                                {viewBet.created_at ? new Date(viewBet.created_at).toLocaleString() : "-"}
                            </div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewBet(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!editBet} onClose={() => setEditBet(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit bet</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <FormControl>
                        <InputLabel>Status</InputLabel>
                        <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                            <MenuItem value="placed">placed</MenuItem>
                            <MenuItem value="failed">failed</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <InputLabel>Outcome</InputLabel>
                        <Select value={editOutcome} label="Outcome" onChange={(e) => setEditOutcome(e.target.value)}>
                            <MenuItem value="">—</MenuItem>
                            <MenuItem value="win">win</MenuItem>
                            <MenuItem value="lose">lose</MenuItem>
                            <MenuItem value="void">void</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditBet(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!editBet) return;
                            try {
                                await api.put(`/bets/${editBet.id}`, {
                                    placement_status: editStatus,
                                    outcome: editOutcome || null,
                                });
                                setEditBet(null);
                                refetch();
                            } catch (err: any) {
                                alert(err?.response?.data?.detail || "Update failed");
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
