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

interface Bookie {
    name: string;
    description: string;
}

export const BookiesTable: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
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
        <div style={{ padding: 24 }}>
            <h2>Bookies</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <TextField
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="contained" onClick={() => setOpen(true)}>
                    Add bookie
                </Button>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
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
                                    <Button
                                        color="error"
                                        size="small"
                                        onClick={() => handleDelete(b.name)}
                                    >
                                        DELETE
                                    </Button>
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
                    <Button onClick={() => createMutation.mutate()} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
