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
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

interface EventItem {
    id: number;
    date: string;
    competition_id: number;
    team_a_id: number;
    team_b_id: number;
    status: string;
}

interface EventsResponse {
    items: EventItem[];
    total: number;
}

export const EventsTable: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const res = await api.get<EventsResponse>("/events/");
            return res.data;
        },
    });

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [competitionId, setCompetitionId] = useState("");
    const [teamAId, setTeamAId] = useState("");
    const [teamBId, setTeamBId] = useState("");
    const [status, setStatus] = useState("prematch");

    const createMutation = useMutation({
        mutationFn: async () =>
            api.post("/events/", {
                date: new Date(date).toISOString(),
                competition_id: Number(competitionId),
                team_a_id: Number(teamAId),
                team_b_id: Number(teamBId),
                status,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            setOpen(false);
            setDate(new Date().toISOString().slice(0, 16));
            setCompetitionId("");
            setTeamAId("");
            setTeamBId("");
            setStatus("prematch");
        },
    });

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return data?.items || [];
        return (data?.items || []).filter((ev) => {
            const idStr = String(ev.id);
            const compStr = String(ev.competition_id);
            const teamAStr = String(ev.team_a_id);
            const teamBStr = String(ev.team_b_id);
            const statusStr = ev.status.toLowerCase();
            return (
                idStr.includes(q) ||
                compStr.includes(q) ||
                teamAStr.includes(q) ||
                teamBStr.includes(q) ||
                statusStr.includes(q)
            );
        });
    }, [data, search]);

    return (
        <div style={{ padding: 24 }}>
            <h2>Events</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <TextField
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="contained" onClick={() => setOpen(true)}>
                    Add event
                </Button>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Competition ID</TableCell>
                        <TableCell>Team A ID</TableCell>
                        <TableCell>Team B ID</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={6}>Loading...</TableCell>
                        </TableRow>
                    )}

                    {!isLoading &&
                        filtered.map((ev) => (
                            <TableRow key={ev.id}>
                                <TableCell>{ev.id}</TableCell>
                                <TableCell>{new Date(ev.date).toLocaleString()}</TableCell>
                                <TableCell>{ev.competition_id}</TableCell>
                                <TableCell>{ev.team_a_id}</TableCell>
                                <TableCell>{ev.team_b_id}</TableCell>
                                <TableCell>{ev.status}</TableCell>
                            </TableRow>
                        ))}

                    {!isLoading && filtered.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6}>No events</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add event</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Date"
                        type="datetime-local"
                        fullWidth
                        margin="dense"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Competition ID"
                        fullWidth
                        margin="dense"
                        value={competitionId}
                        onChange={(e) => setCompetitionId(e.target.value)}
                    />
                    <TextField
                        label="Team A ID"
                        fullWidth
                        margin="dense"
                        value={teamAId}
                        onChange={(e) => setTeamAId(e.target.value)}
                    />
                    <TextField
                        label="Team B ID"
                        fullWidth
                        margin="dense"
                        value={teamBId}
                        onChange={(e) => setTeamBId(e.target.value)}
                    />

                    <FormControl fullWidth margin="dense">
                        <InputLabel>Status</InputLabel>
                        <Select
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="prematch">prematch</MenuItem>
                            <MenuItem value="live">live</MenuItem>
                            <MenuItem value="finished">finished</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        variant="contained"
                        disabled={createMutation.isPending}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
