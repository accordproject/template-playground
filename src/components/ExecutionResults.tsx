import React, { useState } from "react";
import type { ExecutionResults as ExecutionResultsData } from "../store/store";

interface ExecutionResultsProps {
  results: ExecutionResultsData;
  error?: string;
}

const tabs = ["response", "state", "events"] as const;

type ExecutionTab = (typeof tabs)[number];

const getEventValue = (event: unknown, key: "type" | "message") => {
  if (!event || typeof event !== "object" || !(key in event)) {
    return "";
  }

  const value = event[key as keyof typeof event];
  return typeof value === "string" ? value : String(value ?? "");
};

const ExecutionResults: React.FC<ExecutionResultsProps> = ({
  results,
  error,
}) => {

  const [activeTab, setActiveTab] = useState<ExecutionTab>("response");
  const currentData = results[activeTab];
  const events = Array.isArray(results.events) ? results.events : [];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#111827",
        overflow: "hidden",
      }}
    >

      {/* HEADER */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #1f2937",
          fontSize: "14px",
          fontWeight: 600,
          color: "#e5e7eb",
          background: "#111827",
        }}
      >
        Execution Results
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px 10px",
          borderBottom: "1px solid #1f2937",
          background: "#111827",
        }}
      >
        {tabs.map((tab) => {

          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 12px",
                border: "none",
                background: isActive
                  ? "#1f2937"
                  : "transparent",
                color: isActive
                  ? "#ffffff"
                  : "#9ca3af",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "14px",
          background: "#111827",
        }}
      >

        {error ? (

          <div
            style={{
              color: "#ef4444",
              fontSize: "13px",
            }}
          >
            {error}
          </div>

        ) : activeTab === "events" && events.length > 0 ? (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontFamily: "monospace",
              fontSize: "13px",
            }}
          >
            {events.map((event, index) => (
              <div
                key={index}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                <div
                  style={{
                    color: "#93c5fd",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {getEventValue(event, "type")}
                </div>
                <div
                  style={{
                    color: "#d1d5db",
                    lineHeight: 1.5,
                  }}
                >
                  {getEventValue(event, "message")}
                </div>
              </div>
            ))}
          </div>

        ) : !currentData ||
          (Array.isArray(currentData) &&
            currentData.length === 0) ? (

          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            No {activeTab} available
          </div>

        ) : (

          <pre
            style={{
              margin: 0,
              fontSize: "13px",
              lineHeight: 1.7,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              color: "#e5e7eb",
            }}
          >
            {JSON.stringify(currentData, null, 2)
              .split("\n")
              .map((line, index) => {

                const isKey = line.includes(":");

                return (
                  <div key={index}>

                    {isKey ? (
                      <>
                        <span style={{ color: "#60a5fa" }}>
                          {line.split(":")[0]}
                        </span>

                        <span style={{ color: "#e5e7eb" }}>
                          :{line.split(":").slice(1).join(":")}
                        </span>
                      </>
                    ) : (
                      <span>{line}</span>
                    )}

                  </div>
                );
              })}
          </pre>

        )}
      </div>
    </div>
  );
};

export default ExecutionResults;
