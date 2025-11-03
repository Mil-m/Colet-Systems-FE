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
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import "../App.css";

interface Bookie {
    name: string;
    description: string;
}

export const BookiesTable: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["bookies"],
        queryFn: async () => {
            const res = await api.get<Bookie[]>("/bookies/");
            return res.data;
        },
    });

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useMutation({
        mutationFn: async () => api.post("/bookies/", { name, description }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookies"] });
            setOpen(false);
            setName("");
            setDescription("");
        },
    });

    const handleDelete = async (name: string) => {
        if (!window.confirm("Delete bookie?")) return;
        try {
            await api.delete(`/bookies/${encodeURIComponent(name)}`);
            queryClient.invalidateQueries({ queryKey: ["bookies"] });
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Delete failed");
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return data || [];
        return (data || []).filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                b.description.toLowerCase().includes(q)
        );
    }, [data, search]);

    return (
        <div className="admin-page">
            <h2 className="admin-title">Bookies</h2>

            <div className="admin-toolbar">
                <TextField
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-search"
                />
                <Button variant="outlined" onClick={() => setOpen(true)}>
                    ADD BOOKIE
                </Button>
            </div>

            {error && <div style={{ color: "red", marginBottom: 12 }}>Failed to load bookies</div>}

            <Table className="admin-table">
                <TableHead>
                    <TableRow>
                        <TableCell>Bookie</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell width={160}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={3}>Loading...</TableCell>
                        </TableRow>
                    )}
                    {!isLoading &&
                        filtered.map((b) => (
                            <TableRow key={b.name}>
                                <TableCell>{b.name}</TableCell>
                                <TableCell>{b.description}</TableCell>
                                <TableCell>
                                    <div className="admin-actions">
                                        <Button
                                            size="small"
                                            className="admin-action admin-action--danger"
                                            onClick={() => handleDelete(b.name)}
                                        >
                                            DELETE
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    {!isLoading && filtered.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3}>No bookies</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Add bookie</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        fullWidth
                        margin="dense"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        margin="dense"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        variant="contained"
                        disabled={createMutation.isPending || !name.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
