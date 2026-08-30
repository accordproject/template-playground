/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useMemo } from "react";
import { Card, Tag, Typography, Empty, Badge } from "antd";
import { ClockCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import JSONEditor from "../editors/JSONEditor";
import "../styles/components/ObligationsList.css";

const { Text } = Typography;

interface ObligationsListProps {
  eventsJson: string;
}

const formatGlobalTimestamp = (dateStr: string | number) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * Strips raw Concerto resource URI prefixes like resource:org.accordproject.party@0.2.0.Party#Dan -> Dan
 */
const cleanResourceUri = (val: string): string => {
  if (typeof val !== "string") return String(val);
  return val.replace(/resource:[^#\s]+#([a-zA-Z0-9_-]+)/g, "$1");
};

/**
 * Capitalizes field labels (e.g. amount -> Amount, description -> Description)
 */
const formatLabel = (field: string): string => {
  if (!field) return "";
  return field.charAt(0).toUpperCase() + field.slice(1);
};



/**
 * Helper to render formatted values (MonetaryAmount, Duration, resource URIs, or JSON fallback)
 */
const renderFormattedValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return <Text type="secondary">null</Text>;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    // MonetaryAmount shape: { doubleValue: number, currencyCode: string }
    if (typeof obj.doubleValue === "number" && typeof obj.currencyCode === "string") {
      const formattedAmount = obj.doubleValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (
        <Text className="obligation-detail-value" strong>
          {obj.currencyCode} {formattedAmount}
        </Text>
      );
    }

    // Duration shape: { amount: number, unit: string }
    if (typeof obj.amount === "number" && typeof obj.unit === "string") {
      return (
        <Text className="obligation-detail-value">
          {obj.amount} {obj.unit}
        </Text>
      );
    }

    // Party resource shape: { partyId: string }
    if (typeof obj.partyId === "string") {
      return <Text className="obligation-detail-value">{obj.partyId}</Text>;
    }

    // Fallback to formatted JSON block for complex nested objects
    return (
      <pre className="obligation-json-block">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "string") {
    const cleaned = cleanResourceUri(value);
    return <Text className="obligation-detail-value">{cleaned}</Text>;
  }

  return <Text className="obligation-detail-value">{String(value)}</Text>;
};

const ObligationsList: React.FC<ObligationsListProps> = ({ eventsJson }) => {
  const { parsedEvents, isFallback, isEmpty } = useMemo(() => {
    if (!eventsJson || eventsJson.trim() === "" || eventsJson === "[]") {
      return { parsedEvents: [], isFallback: false, isEmpty: true };
    }

    try {
      const parsed = JSON.parse(eventsJson) as unknown;

      if (!Array.isArray(parsed)) {
        return { parsedEvents: [], isFallback: true, isEmpty: false };
      }

      if (parsed.length === 0) {
        return { parsedEvents: [], isFallback: false, isEmpty: true };
      }

      // Check if it's a standard event array (each object should have $class)
      const isValidShape = parsed.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).$class === "string"
      );

      if (!isValidShape) {
        return { parsedEvents: [], isFallback: true, isEmpty: false };
      }

      return {
        parsedEvents: parsed as Record<string, unknown>[],
        isFallback: false,
        isEmpty: false,
      };
    } catch (e) {
      return { parsedEvents: [], isFallback: true, isEmpty: false };
    }
  }, [eventsJson]);

  if (isFallback) {
    return <JSONEditor id="events" value={eventsJson} readOnly={true} />;
  }

  if (isEmpty) {
    return (
      <div className="obligations-list-container">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No events emitted"
        />
      </div>
    );
  }

  return (
    <div className="obligations-list-container">
      {parsedEvents.map((event, index) => {
        const fqn = event.$class as string;
        const shortName = fqn.split(".").pop() || fqn;
        const timestampStr = event.$timestamp as string | number | undefined;
        const timestamp = timestampStr !== undefined ? formatGlobalTimestamp(timestampStr) : null;

        // Detect if it is an obligation type.
        const isObligation =
          event.deadline !== undefined ||
          event.promisor !== undefined ||
          event.promisee !== undefined ||
          fqn.includes("Obligation");

        // Custom fields are all keys except standard ones
        const standardKeys = [
          "$class",
          "$identifier",
          "$timestamp",
          "deadline",
          "promisor",
          "promisee",
          "contract",
        ];
        const customFields = Object.keys(event).filter((k) => !standardKeys.includes(k));

        return (
          <Card
            key={(event.$identifier as string | undefined) ?? `${fqn}-${timestampStr ?? ""}-${index}`}
            className={`obligation-card ${!isObligation ? "obligation-card-generic" : ""}`}
            size="small"
          >
            <div className="obligation-header">
              <div className="obligation-title">
                <Tag color={isObligation ? "blue" : "green"}>{shortName}</Tag>
                {isObligation && (
                  <Badge
                    status="processing"
                    text={shortName.toLowerCase().includes("obligation") ? undefined : "Obligation"}
                  />
                )}
              </div>
              {timestamp && (
                <Text type="secondary" className="obligation-timestamp">
                  <ClockCircleOutlined /> {timestamp}
                </Text>
              )}
            </div>

            <div className="obligation-details">
              {event.deadline !== undefined && (
                <div className="obligation-detail-row">
                  <Text className="obligation-detail-label">
                    <CalendarOutlined /> Deadline :
                  </Text>
                  <Text className="obligation-detail-value" strong>
                    {formatGlobalTimestamp(event.deadline as string | number)}
                  </Text>
                </div>
              )}

              {event.promisor !== undefined && (
                <div className="obligation-detail-row">
                  <Text className="obligation-detail-label">Promisor :</Text>
                  {renderFormattedValue(event.promisor)}
                </div>
              )}

              {event.promisee !== undefined && (
                <div className="obligation-detail-row">
                  <Text className="obligation-detail-label">Promisee :</Text>
                  {renderFormattedValue(event.promisee)}
                </div>
              )}

              {customFields.map((field) => {
                const value = event[field];
                const isObject = typeof value === "object" && value !== null;
                const obj = isObject ? (value as Record<string, unknown>) : null;
                const isMonetaryOrDuration =
                  obj !== null &&
                  (typeof obj.doubleValue === "number" ||
                    typeof obj.amount === "number" ||
                    typeof obj.partyId === "string");

                return (
                  <div
                    key={field}
                    className={`obligation-detail-row ${
                      isObject && !isMonetaryOrDuration ? "obligation-detail-row-vertical" : ""
                    }`}
                  >
                    <Text className="obligation-detail-label">{formatLabel(field)} :</Text>
                    {renderFormattedValue(value)}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ObligationsList;
