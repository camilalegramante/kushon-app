import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

global.fetch = vi.fn();

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const TestComponent = () => {
  try {
    const { user, token, loading, login, register, logout } = useAuth();
    return (
      <div>
        <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
        <div data-testid="user">{user ? `${user.name} (${user.email})` : 'no user'}</div>
        <div data-testid="token">{token ? 'has token' : 'no token'}</div>
        <button data-testid="login-btn" onClick={() => login('test@example.com', 'password')}>
          Login
        </button>
        <button data-testid="register-btn" onClick={() => register('Test', 'test@example.com', 'password')}>
          Register
        </button>
        <button data-testid="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    );
  } catch (error) {
    return <div>Error: {(error as Error).message}</div>;
  }
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);
    expect(screen.getByText(/useAuth must be used within an AuthProvider/i)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should initialize with no user when no token is present', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no user');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
  });

  it('should initialize with token from localStorage', async () => {
    localStorageMock.setItem('token', 'existing-token');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['USER'],
        },
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('John Doe (john@example.com)');
    expect(screen.getByTestId('token')).toHaveTextContent('has token');
  });

  it('should logout when token validation fails', async () => {
    localStorageMock.setItem('token', 'invalid-token');

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no user');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
    expect(localStorageMock.getItem('token')).toBeNull();
  });

  it('should handle login attempt', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              access_token: 'new-token',
              user: {
                id: 'user-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                roles: ['USER'],
              },
            },
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const loginBtn = screen.getByTestId('login-btn');
    expect(loginBtn).toBeInTheDocument();
  });

  it('should handle logout', async () => {
    localStorageMock.setItem('token', 'existing-token');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['USER'],
        },
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    });

    const logoutBtn = screen.getByTestId('logout-btn');
    await logoutBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    expect(screen.getByTestId('token')).toHaveTextContent('no token');
    expect(localStorageMock.getItem('token')).toBeNull();
  });
});
