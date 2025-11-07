import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

const TestComponent = () => {
  try {
    const { toasts, showToast, removeToast } = useToast();
    return (
      <div>
        <div data-testid="toast-count">{toasts.length}</div>
        <div data-testid="toasts">
          {toasts.map((toast) => (
            <div key={toast.id} data-testid={`toast-${toast.id}`} className={`toast-${toast.type}`}>
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}>Close</button>
            </div>
          ))}
        </div>
        <button data-testid="show-success" onClick={() => showToast('Success!', 'success')}>
          Show Success
        </button>
        <button data-testid="show-error" onClick={() => showToast('Error!', 'error')}>
          Show Error
        </button>
        <button data-testid="show-warning" onClick={() => showToast('Warning!', 'warning')}>
          Show Warning
        </button>
        <button data-testid="show-info" onClick={() => showToast('Info!', 'info')}>
          Show Info
        </button>
        <button data-testid="show-custom-duration" onClick={() => showToast('Custom Duration', 'success', 2000)}>
          Show Custom Duration
        </button>
      </div>
    );
  } catch (error) {
    return <div>Error: {(error as Error).message}</div>;
  }
};

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should throw error when useToast is used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ErrorComponent = () => {
      const { toasts } = useToast();
      return <div>{toasts.length}</div>;
    };

    expect(() => render(<ErrorComponent />)).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });

  it('should initialize with empty toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should show success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      const btn = screen.getByTestId('show-success');
      btn.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    const toast = screen.getByText('Success!');
    expect(toast.parentElement).toHaveClass('toast-success');
  });

  it('should show error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      const btn = screen.getByTestId('show-error');
      btn.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    const toast = screen.getByText('Error!');
    expect(toast.parentElement).toHaveClass('toast-error');
  });

  it('should show multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByTestId('show-success').click();
      screen.getByTestId('show-error').click();
      screen.getByTestId('show-warning').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('should remove toast manually', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      const btn = screen.getByTestId('show-success');
      btn.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      const toastDiv = screen.getByText('Success!').closest('div');
      const closeBtn = toastDiv?.querySelector('button');
      closeBtn?.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should auto-remove toast after default duration (4000ms)', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      const btn = screen.getByTestId('show-success');
      btn.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should respect custom duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      const btn = screen.getByTestId('show-custom-duration');
      btn.click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should show all toast types', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByTestId('show-success').click();
      screen.getByTestId('show-error').click();
      screen.getByTestId('show-warning').click();
      screen.getByTestId('show-info').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('4');

    expect(screen.getByText('Success!').parentElement).toHaveClass('toast-success');
    expect(screen.getByText('Error!').parentElement).toHaveClass('toast-error');
    expect(screen.getByText('Warning!').parentElement).toHaveClass('toast-warning');
    expect(screen.getByText('Info!').parentElement).toHaveClass('toast-info');
  });
});
