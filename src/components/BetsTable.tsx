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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Bet } from "../types";

const LIMIT = 10;

interface BetsResponse {
    items: Bet[];
    total: number;
}

export const BetsTable: React.FC = () => {
    const [status, setStatus] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["bets", status, search, page],
        queryFn: async () => {
            const offset = (page - 1) * LIMIT;
            const res = await api.get<BetsResponse>("/bets/", {
                params: {
                    status: status || undefined,
                    search: search || undefined,
                    limit: LIMIT,
                    offset,
                },
            });
            return res.data;
        },
    });

    const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

    const handleApply = () => {
        setPage(1);
        refetch();
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>Bets</h2>

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <TextField
                    label="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Select
                    size="small"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    displayEmpty
                >
                    <MenuItem value="">All statuses</MenuItem>
                    <MenuItem value="placed">Placed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                </Select>
                <Button variant="contained" onClick={handleApply}>
                    Apply
                </Button>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
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
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={7}>Loading...</TableCell>
                        </TableRow>
                    )}

                    {!isLoading &&
                        data?.items?.map((bet) => (
                            <TableRow key={bet.id}>
                                <TableCell>{bet.customer_name || bet.customer_id}</TableCell>
                                <TableCell>{bet.sport}</TableCell>
                                <TableCell>{bet.odds}</TableCell>
                                <TableCell>
                                    {bet.stake_amount} {bet.stake_currency}
                                </TableCell>
                                <TableCell>{bet.placement_status}</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                    <Button size="small">VIEW</Button>
                                    <Button size="small">EDIT</Button>
                                    <Button size="small" color="error">
                                        DELETE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                    {!isLoading && data && data.items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7}>No data</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Pagination
                sx={{ marginTop: 2 }}
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
            />
        </div>
    );
};
