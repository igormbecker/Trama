import useSWR from "swr";
import styles from "./status.module.css";
import { useState } from "react";

async function fetchAPI(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status}`);
  }

  return response.json();
}

export default function StatusPage() {
  const [theme, setTheme] = useState("light");
  const { data, error, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 5000,
  });

  const database = data?.dependencies?.database;
  const isHealthy = Boolean(database) && !error;

  let updatedAt = "Loading...";
  let statusLabel = "Checking...";
  let connectionMessage = "PostgreSQL · waiting for connection";
  let statusClass = styles.pending;
  let errorMessage = null;
  let bdStatusInfo = <p>Loading database information...</p>;
  let jsonResult = "Loading...";

  if (data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
    jsonResult = JSON.stringify(data, null, 2);
    statusLabel = isHealthy ? "Healthy" : "Disconnected";
  }

  if (isHealthy) {
    connectionMessage = "PostgreSQL · connection established";
    statusClass = styles.healthy;
  }

  if (!isLoading) {
    bdStatusInfo = <p>Database information is unavailable.</p>;

    if (database) {
      bdStatusInfo = <DatabaseInfo database={database} />;
    }
  }

  if (error) {
    statusLabel = "Unavailable";

    errorMessage = (
      <p className={styles.error} role="alert">
        Unable to retrieve the current status. Please try again shortly.
      </p>
    );

    if (!data) {
      updatedAt = "Unavailable";
      jsonResult = "Response unavailable.";
    }
  }

  return (
    <div className={styles.page} data-theme={theme}>
      <style jsx global>{`
        body {
          margin: 0;
        }
      `}</style>
      <header className={styles.header}>
        <span className={styles.brand}>&gt;_Diagnostics center</span>
        <label className={styles.themeControl}>
          Tema
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
      </header>

      <main className={styles.main}>
        <div className={styles.introduction}>
          <div>
            <h1 className={styles.title}>Infrastructure status</h1>
            <p className={styles.subtitle}>{connectionMessage}</p>
          </div>

          <span className={`${styles.badge} ${statusClass}`} role="status">
            ● {statusLabel}
          </span>
        </div>

        {errorMessage}

        <div className={styles.grid}>
          <section className={styles.panel}>
            <h2>Database</h2>
            {bdStatusInfo}
          </section>

          <section className={`${styles.panel} ${styles.payload}`}>
            <h2>API response</h2>
            <pre className={styles.json}>{jsonResult}</pre>
          </section>
        </div>

        <p className={styles.updatedAt}>Last updated · {updatedAt}</p>
      </main>

      <footer className={styles.footer}>
        <span>/api/v1/status</span>
        <span>&gt;_bectec.</span>
      </footer>
    </div>
  );
}

function DatabaseInfo({ database }) {
  const openedConnections = database.opened_connections;
  const maxConnections = database.max_connections;

  const version = database.version ?? "Unknown";
  const openedConnectionsLabel = openedConnections ?? "Unknown";
  const maxConnectionsLabel = maxConnections ?? "Unknown";

  let connectionUsage = null;
  let capacityInfo = null;

  if (typeof openedConnections === "number" && maxConnections > 0) {
    connectionUsage = (openedConnections / maxConnections) * 100;
  }

  if (connectionUsage !== null) {
    capacityInfo = (
      <div className={styles.capacity}>
        <div className={styles.capacityLabel}>
          <span>Connection usage</span>
          <span>{Math.round(connectionUsage)}%</span>
        </div>

        <meter
          className={styles.meter}
          min={0}
          max={maxConnections}
          value={openedConnections}
          aria-label="Database connection usage"
        />
      </div>
    );
  }

  return (
    <>
      <dl className={styles.metrics}>
        <div>
          <dt>Version</dt>
          <dd>{version}</dd>
        </div>

        <div>
          <dt>Open connections</dt>
          <dd>{openedConnectionsLabel}</dd>
        </div>

        <div>
          <dt>Connection limit</dt>
          <dd>{maxConnectionsLabel}</dd>
        </div>
      </dl>

      {capacityInfo}
    </>
  );
}
