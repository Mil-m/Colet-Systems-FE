export interface Bet {
    id: number;
    bookie: string | null;
    bookie_description: any;
    customer_id: number | null;
    customer_name?: string | null;
    event_id: number | null;
    sport: string | null;
    placement_status: string | null;
    outcome: string | null;
    stake_amount: number | null;
    stake_currency: string | null;
    odds: number | null;
    created_at: string | null;
}
