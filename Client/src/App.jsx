import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import Landing from './pages/LandingPage';
import Error404 from './pages/Error404';

/**
 * Root Layout Component.
 * Acts as a wrapper for routes that need shared access to the Tour state.
 * @returns {JSX.Element} The outlet context provider.
 */
const RootLayout = () => {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage('marcus-tour-complete', false);

  return (
    <Outlet context={{ hasCompletedTour, setHasCompletedTour }} />
  );
};

// Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <Error404 />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "*",
        element: <Error404 />,
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

/**
 * Main Application Component.
 * Wraps the router with global context providers (Theme, Chat).
 */
function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <RouterProvider router={ router } />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;