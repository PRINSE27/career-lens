import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import JobMatches from "./pages/JobMatches";

function App() {
  return (
    <BrowserRouter>
      <Routes>
<Route
  path="/job-matches"
  element={
    <ProtectedRoute>
      <JobMatches />
    </ProtectedRoute>
  }
/>

        {/* Public Home Page */}
        <Route
          path="/"
          element={<Landing />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* Protected Pages */}
{/* Protected Pages */}

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/job-matches"
  element={
    <ProtectedRoute>
      <JobMatches />
    </ProtectedRoute>
  }
/>

        

      </Routes>
    </BrowserRouter>
  );
}

export default App;