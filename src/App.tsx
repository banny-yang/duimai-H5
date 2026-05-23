import { useEffect, useMemo, useState } from "react";

import { EventPickerPage } from "@/components/EventPickerPage";
import {
  readEventGuidFromUrl,
  redirectLegacyEventGuidUrl,
} from "@/api/runner-api";
import RunnerApp from "@/RunnerApp";

export default function App() {
  redirectLegacyEventGuidUrl();

  const initialGuid = useMemo(() => readEventGuidFromUrl(), []);
  const [eventGuid, setEventGuid] = useState<string | undefined>(initialGuid);

  useEffect(() => {
    const onPop = () => setEventGuid(readEventGuidFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!eventGuid) {
    return <EventPickerPage />;
  }

  return <RunnerApp eventGuid={eventGuid} />;
}
