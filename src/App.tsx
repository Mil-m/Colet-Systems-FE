import { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { BetsTable } from "./components/BetsTable";
import { BookiesTable } from "./components/BookiesTable";
import { CustomersTable } from "./components/CustomersTable";
import { EventsTable } from "./components/EventsTable";

function App() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ width: "100%" }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Bets" />
                <Tab label="Customers" />
                <Tab label="Bookies" />
                <Tab label="Events" />
            </Tabs>

            {tab === 0 && <BetsTable />}
            {tab === 1 && <CustomersTable />}
            {tab === 2 && <BookiesTable />}
            {tab === 3 && <EventsTable />}
        </Box>
    );
}

export default App;
