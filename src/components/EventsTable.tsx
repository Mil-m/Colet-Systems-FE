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
    CircularProgress,
    Autocomplete,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import "../App.css";

interface EventItem {
    id: number;
    date: string;
    competition_id: number;
    team_a_id: number;
    team_b_id: number;
    status: string;
}

interface Competition {
    id: number;
    name: string;
    sport: string;
}

interface Team {
    id: number;
    name: string;
    sport: string;
}

interface EventsResponse {
    items: EventItem[];
    total: number;
}

const makeDefaultDate = () =>
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

export const EventsTable: React.FC = () => {
    const queryClient = useQueryClient();

    const {
        data: eventsData,
        isLoading: loadingEvents,
        error: eventsError,
    } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const res = await api.get<EventsResponse>("/events/");
            return res.data;
        },
    });

    const {
        data: competitions,
        isLoading: loadingCompetitions,
    } = useQuery({
        queryKey: ["competitions"],
        queryFn: async () => (await api.get<Competition[]>("/competitions/")).data,
    });

    const { data: teams, isLoading: loadingTeams } = useQuery({
        queryKey: ["teams"],
        queryFn: async () => (await api.get<Team[]>("/teams/")).data,
    });

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(makeDefaultDate);
    const [competitionId, setCompetitionId] = useState<string>("");
    const [teamAId, setTeamAId] = useState<string>("");
    const [teamBId, setTeamBId] = useState<string>("");
    const [status, setStatus] = useState("prematch");
    const [formError, setFormError] = useState<string | null>(null);

    const selectedCompetition = competitions?.find(
        (c) => c.id === Number(competitionId)
    );
    const competitionSport = selectedCompetition?.sport;

    const filteredTeams: Team[] = useMemo(() => {
        if (!teams) return [];
        if (!competitionSport) return teams;
        return teams.filter((t) => t.sport === competitionSport);
    }, [teams, competitionSport]);

    const filteredEvents = useMemo(() => {
        const q = search.toLowerCase().trim();
        const items = eventsData?.items || [];
        if (!q) return items;
        return items.filter((ev) => {
            return (
                String(ev.id).includes(q) ||
                String(ev.competition_id).includes(q) ||
                String(ev.team_a_id).includes(q) ||
                String(ev.team_b_id).includes(q) ||
                ev.status.toLowerCase().includes(q)
            );
        });
    }, [eventsData, search]);

    const isCreateDisabled =
        !date ||
        !competitionId ||
        !teamAId ||
        !teamBId ||
        loadingCompetitions ||
        loadingTeams;

    const createMutation = useMutation({
        mutationFn: async () => {
            setFormError(null);
            return api.post("/events/", {
                date: new Date(date).toISOString(),
                competition_id: Number(competitionId),
                team_a_id: Number(teamAId),
                team_b_id: Number(teamBId),
                status,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            setOpen(false);
            setDate(makeDefaultDate());
            setCompetitionId("");
            setTeamAId("");
            setTeamBId("");
            setStatus("prematch");
            setFormError(null);
        },
        onError: (err: any) => {
            const msg =
                err?.response?.data?.detail ||
                err?.message ||
                "Failed to create event";
            setFormError(msg);
        },
    });

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete event?")) return;
        try {
            await api.delete(`/events/${id}`);
            queryClient.invalidateQueries({ queryKey: ["events"] });
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Delete failed");
        }
    };

    return (
        <div className="admin-page">
            <h2 className="admin-title">Events</h2>

            <div className="admin-toolbar">
                <TextField
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-search"
                />
                <Button variant="outlined" onClick={() => setOpen(true)}>
                    ADD EVENT
                </Button>
            </div>

            {eventsError && (
                <div style={{ color: "red", marginBottom: 12 }}>
                    Failed to load events
                </div>
            )}

            <Table className="admin-table">
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Competition</TableCell>
                        <TableCell>Team A</TableCell>
                        <TableCell>Team B</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell width={100}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loadingEvents && (
                        <TableRow>
                            <TableCell colSpan={7}>Loading...</TableCell>
                        </TableRow>
                    )}

                    {!loadingEvents &&
                        filteredEvents.map((ev) => {
                            const compName =
                                competitions?.find((c) => c.id === ev.competition_id)?.name ||
                                ev.competition_id;
                            const teamAName =
                                teams?.find((t) => t.id === ev.team_a_id)?.name || ev.team_a_id;
                            const teamBName =
                                teams?.find((t) => t.id === ev.team_b_id)?.name || ev.team_b_id;

                            return (
                                <TableRow key={ev.id}>
                                    <TableCell>{ev.id}</TableCell>
                                    <TableCell>{new Date(ev.date).toLocaleString()}</TableCell>
                                    <TableCell>{compName}</TableCell>
                                    <TableCell>{teamAName}</TableCell>
                                    <TableCell>{teamBName}</TableCell>
                                    <TableCell>{ev.status}</TableCell>
                                    <TableCell>
                                        <div className="admin-actions">
                                            <Button
                                                size="small"
                                                className="admin-action admin-action--danger"
                                                onClick={() => handleDelete(ev.id)}
                                            >
                                                DELETE
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                    {!loadingEvents && filteredEvents.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7}>No events</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add event</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <TextField
                        label="Date"
                        type="datetime-local"
                        fullWidth
                        margin="dense"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Autocomplete
                        options={competitions || []}
                        loading={loadingCompetitions}
                        getOptionLabel={(option) => option.name || ""}
                        value={
                            competitions?.find((c) => c.id === Number(competitionId)) || null
                        }
                        onChange={(_, v) => {
                            setCompetitionId(v ? String(v.id) : "");
                            setTeamAId("");
                            setTeamBId("");
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Competition"
                                margin="dense"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingCompetitions ? (
                                                <CircularProgress size={16} />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    <Autocomplete
                        options={filteredTeams}
                        loading={loadingTeams}
                        getOptionLabel={(option) => option.name || ""}
                        value={filteredTeams.find((t) => t.id === Number(teamAId)) || null}
                        onChange={(_, v) => setTeamAId(v ? String(v.id) : "")}
                        disabled={!competitionId}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Team A"
                                margin="dense"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingTeams ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    <Autocomplete
                        options={filteredTeams}
                        loading={loadingTeams}
                        getOptionLabel={(option) => option.name || ""}
                        value={filteredTeams.find((t) => t.id === Number(teamBId)) || null}
                        onChange={(_, v) => setTeamBId(v ? String(v.id) : "")}
                        disabled={!competitionId}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Team B"
                                margin="dense"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingTeams ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
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

                    {formError && (
                        <div style={{ color: "red", fontSize: 13 }}>{formError}</div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        variant="contained"
                        disabled={isCreateDisabled || createMutation.isPending}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
