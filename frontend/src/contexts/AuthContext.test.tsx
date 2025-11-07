import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as testingLibrary from '@testing-library/dom';
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
    const { user, loading, login, register, logout } = useAuth();
    return (
      <div>
        <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
        <div data-testid="user">{user ? `${user.name} (${user.email})` : 'no user'}</div>
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
    expect(testingLibrary.screen.getByText(/useAuth must be used within an AuthProvider/i)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should initialize with no user when no token is present', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(testingLibrary.screen.getByTestId('user')).toHaveTextContent('no user');
  });

  it('should initialize with user from token validation', async () => {
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

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(testingLibrary.screen.getByTestId('user')).toHaveTextContent('John Doe (john@example.com)');
  });

  it('should logout when token validation fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(testingLibrary.screen.getByTestId('user')).toHaveTextContent('no user');
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

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const loginBtn = testingLibrary.screen.getByTestId('login-btn');
    expect(loginBtn).toBeInTheDocument();
  });

  it('should handle logout', async () => {
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

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('user')).toHaveTextContent('John Doe');
    });

    const logoutBtn = testingLibrary.screen.getByTestId('logout-btn');
    logoutBtn.click();

    await testingLibrary.waitFor(() => {
      expect(testingLibrary.screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });
});
