import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { lazy, Suspense } from "react";

// Lazy load heavy components
const Analytics = lazy(() => import("@/pages/Analytics"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Documents = lazy(() => import("@/pages/Documents"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const Help = lazy(() => import("@/pages/Help"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const VehicleDetails = lazy(() => import("@/pages/VehicleDetails"));
const VehicleApproval = lazy(() => import("@/pages/VehicleApproval"));
const VehicleComparison = lazy(() => import("@/pages/VehicleComparison"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const VehiclesByStatus = lazy(() => import("@/pages/VehiclesByStatus"));
const VehicleStatistics = lazy(() => import("@/pages/VehicleStatistics"));
const MyVehicles = lazy(() => import("@/pages/MyVehicles"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Vehicles />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/my-vehicles">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <MyVehicles />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/documents">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Documents />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/help">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Help />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <AdminUsers />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicle/:id">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <VehicleDetails />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/approval">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <VehicleApproval />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles/compare">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <VehicleComparison />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <UserProfile />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles/by-status">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <VehiclesByStatus />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/statistics">
        <ProtectedRoute>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <VehicleStatistics />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
