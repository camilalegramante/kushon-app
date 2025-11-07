import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as testingLibrary from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'user-123', name: 'John Doe', email: 'john@example.com', roles: ['USER'] },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
    }),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with logo', () => {
    render(
      <BrowserRouter>
        <Header userName="John" />
      </BrowserRouter>
    );

    expect(testingLibrary.screen.getByText('Kushon')).toBeInTheDocument();
  });

  it('should display welcome text with user name', () => {
    render(
      <BrowserRouter>
        <Header userName="Jane Doe" />
      </BrowserRouter>
    );

    expect(testingLibrary.screen.getByText('Olá, Jane Doe')).toBeInTheDocument();
  });

  it('should display default user name when not provided', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(testingLibrary.screen.getByText('Olá, Usuário')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(
      <BrowserRouter>
        <Header userName="John" />
      </BrowserRouter>
    );

    const logoutBtn = testingLibrary.screen.getByText('Sair');
    expect(logoutBtn).toBeInTheDocument();
  });

  it('should navigate to home when logo is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Header userName="John" />
      </BrowserRouter>
    );

    const logo = testingLibrary.screen.getByText('Kushon');
    await user.click(logo);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should logout and navigate to home when logout button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Header userName="John" />
      </BrowserRouter>
    );

    const logoutBtn = testingLibrary.screen.getByText('Sair');
    await user.click(logoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
