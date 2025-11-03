import React, { useState, useMemo } from "react";
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

interface Customer {
    id: number;
    username: string;
    real_name?: string | null;
    currency: string;
    balance_amount: number;
}

interface BalanceChange {
    id: number;
    change_type: string;
    delta_amount: number;
    delta_currency: string;
    reference_id: string | null;
    description: string | null;
    created_at: string;
}

export const CustomersTable: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const res = await api.get<Customer[]>("/customers/");
            return res.data;
        },
    });

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [realName, setRealName] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [balance, setBalance] = useState("0");

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<BalanceChange[]>([]);
    const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

    const createMutation = useMutation({
        mutationFn: async () =>
            api.post("/customers/", {
                username,
                real_name: realName || null,
                currency,
                balance_amount: Number(balance),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setOpen(false);
            setUsername("");
            setRealName("");
            setCurrency("USD");
            setBalance("0");
        },
        onError: (err: any) => {
            const backendDetail =
                err?.response?.data?.detail ??
                err?.response?.data?.message ??
                err?.message ??
                "Failed to create customer";
            if (typeof backendDetail === "string") {
                alert(backendDetail);
            } else {
                alert(JSON.stringify(backendDetail, null, 2));
            }
        },
    });

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete customer?")) return;
        try {
            await api.delete(`/customers/${id}`);
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Delete failed");
        }
    };

    const handleViewHistory = async (customer: Customer) => {
        setHistoryCustomer(customer);
        setHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get<BalanceChange[]>(`/customers/${customer.id}/balance-changes`);
            setHistoryData(res.data);
        } catch (err: any) {
            setHistoryData([]);
            alert(err?.response?.data?.detail || "Failed to load history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return data || [];
        return (data || []).filter((c) => {
            const u = c.username.toLowerCase();
            const r = (c.real_name || "").toLowerCase();
            return u.includes(q) || r.includes(q);
        });
    }, [data, search]);

    return (
        <div style={{ padding: 24 }}>
            <h2>Customers</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <TextField
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="contained" onClick={() => setOpen(true)}>
                    Add customer
                </Button>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Real name</TableCell>
                        <TableCell>Currency</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={6}>Loading...</TableCell>
                        </TableRow>
                    )}

                    {!isLoading &&
                        filtered.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.id}</TableCell>
                                <TableCell>{c.username}</TableCell>
                                <TableCell>{c.real_name || "—"}</TableCell>
                                <TableCell>{c.currency}</TableCell>
                                <TableCell>{c.balance_amount}</TableCell>
                                <TableCell>
                                    <Button size="small" onClick={() => handleViewHistory(c)}>
                                        VIEW
                                    </Button>
                                    <Button size="small" color="error" onClick={() => handleDelete(c.id)}>
                                        DELETE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                    {!isLoading && filtered.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6}>No customers</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add customer</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        label="Real name"
                        fullWidth
                        margin="dense"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Currency</InputLabel>
                        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Balance amount"
                        type="number"
                        fullWidth
                        margin="dense"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        variant="contained"
                        disabled={createMutation.isPending || !username.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Balance history {historyCustomer ? `for ${historyCustomer.username}` : ""}
                </DialogTitle>
                <DialogContent dividers>
                    {historyLoading && <CircularProgress size={24} />}
                    {!historyLoading && historyData.length === 0 && <div>No balance changes</div>}
                    {!historyLoading && historyData.length > 0 && (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Delta</TableCell>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyData.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell>{h.id}</TableCell>
                                        <TableCell>{h.change_type}</TableCell>
                                        <TableCell>
                                            {h.delta_amount} {h.delta_currency}
                                        </TableCell>
                                        <TableCell>{h.reference_id || "—"}</TableCell>
                                        <TableCell>{h.description || "—"}</TableCell>
                                        <TableCell>
                                            {h.created_at ? new Date(h.created_at).toLocaleString() : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
