import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../../components/layout/header";
import { Loading } from "../../components/ui/loading";
import { HospitalScene } from "../../components/hospital-map/hospital-scene";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";

export const Route = createFileRoute("/app/hospital-map")({
  component: HospitalMapPage,
});

function HospitalMapPage() {
  const locations = useAsync(() => api.forecasts.getLocationRisks(), []);
  const patients = useAsync(() => api.patients.getAll(), []);

  const isLoading = locations.loading || patients.loading;

  return (
    <div className="flex h-screen flex-col">
      <Header
        title="Hospital Map"
        subtitle="3D bed-level infection risk visualization"
      />
      <div className="flex-1 p-4">
        {isLoading ? (
          <Loading />
        ) : locations.data && patients.data ? (
          <HospitalScene locations={locations.data} patients={patients.data} />
        ) : null}
      </div>
    </div>
  );
}
