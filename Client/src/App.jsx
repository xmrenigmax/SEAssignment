import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Landing from './pages/LandingPage';
import Error404 from './pages/Error404';
import { ThemeProvider } from './context/ThemeContext';
import { useLocalStorage } from './hooks/useLocalStorage';

// Layout Context
const LayoutContext = () => {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage('marcus-tour-complete', false);

  // Verify context is being created
  if (hasCompletedTour === undefined) console.warn("Warning: Tour state is undefined");

  return <Outlet context={{ hasCompletedTour, setHasCompletedTour }} />;
};

// Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutContext />,
    errorElement: <Error404 />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "*",
        element: <Landing />,
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <RouterProvider router={router} />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;