"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEHandler = (eventType: string, data: unknown) => void;

export function useSSE(onEvent: SSEHandler) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/sse");

      es.addEventListener("activity", (e) => {
        try {
          handlerRef.current("activity", JSON.parse(e.data));
        } catch {}
      });

      es.addEventListener("notification", (e) => {
        try {
          handlerRef.current("notification", JSON.parse(e.data));
        } catch {}
      });

      es.addEventListener("audit", (e) => {
        try {
          handlerRef.current("audit", JSON.parse(e.data));
        } catch {}
      });

      es.addEventListener("stats", (e) => {
        try {
          handlerRef.current("stats", JSON.parse(e.data));
        } catch {}
      });

      es.onerror = () => {
        es?.close();
        // Reconnect after 5s
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);
}
