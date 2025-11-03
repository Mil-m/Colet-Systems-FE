import { useState } from "react";
import { BetsTable } from "./components/BetsTable";
import { BookiesTable } from "./components/BookiesTable";
import { EventsTable } from "./components/EventsTable";
import { CustomersTable } from "./components/CustomersTable";
import { Button } from "@mui/material";

type View = "bets" | "bookies" | "events" | "customers";

function App() {
    const [view, setView] = useState<View>("bets");

    return (
        <div>
            <div style={{ display: "flex", gap: 12, padding: 16 }}>
                <Button
                    variant={view === "bets" ? "contained" : "text"}
                    onClick={() => setView("bets")}
                >
                    Bets
                </Button>
                <Button
                    variant={view === "bookies" ? "contained" : "text"}
                    onClick={() => setView("bookies")}
                >
                    Bookies
                </Button>
                <Button
                    variant={view === "events" ? "contained" : "text"}
                    onClick={() => setView("events")}
                >
                    Events
                </Button>
                <Button
                    variant={view === "customers" ? "contained" : "text"}
                    onClick={() => setView("customers")}
                >
                    Customers
                </Button>
            </div>

            {view === "bets" && <BetsTable />}
            {view === "bookies" && <BookiesTable />}
            {view === "events" && <EventsTable />}
            {view === "customers" && <CustomersTable />}
        </div>
    );
}

export default App;
