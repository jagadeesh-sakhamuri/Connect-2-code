import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './routes/appRoutes';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './shared/context/ThemeContext';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { hydrateProgress } from './features/progress/redux/progressSlice';

const ProgressHydrator: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const scopeKey = isAuthenticated
    ? String(user?.id ?? user?.email ?? 'authenticated')
    : 'guest';

  React.useEffect(() => {
    void dispatch(hydrateProgress());
  }, [dispatch, scopeKey]);

  return null;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ProgressHydrator />
      <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#F9FAFB',
            border: '1px solid #1F2937',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#F43F5E',
              secondary: '#111827',
            },
          },
        }}
      />
      <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
