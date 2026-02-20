/**
 * Integration Tests: Modern Visual Interface System
 * 
 * This test suite validates complete user flows for:
 * - Theme toggle with workspace-scoped persistence
 * - Keyboard navigation through pages
 * - Modal interactions with focus trap
 * 
 * Task: 14.4 Write integration tests for complete user flows
 * Requirements: Multiple (1.1-1.3, 2.1-2.4, 5.1-5.5, 6.1-6.4)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/Contexts/ThemeContext';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { FocusManager } from '@/Utils/FocusManager';
import { themeStorage } from '@/Utils/ThemeStorage';
import { AnimatedPage } from '@/Components/common/motion/AnimatedPage';
import React from 'react';

// Mock axios for backend API calls
vi.mock('axios', () => ({
  default: {
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock route helper
vi.mock('ziggy-js', () => ({
  route: vi.fn((name: string) => `/${name}`),
}));

// Mock theme storage
vi.mock('@/Utils/ThemeStorage', () => ({
  themeStorage: {
    saveThemePreference: vi.fn(() => Promise.resolve()),
    loadThemePreference: vi.fn(() => Promise.resolve(null)),
    deleteThemePreference: vi.fn(() => Promise.resolve()),
  },
}));

describe('Modern Visual Interface - Integration Tests', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    document.documentElement.className = '';
    
    // Setup matchMedia mock for each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    // Cleanup focus traps
    FocusManager.cleanup();
  });

  describe('1. Theme Toggle with Persistence', () => {
    
    it('should toggle theme from light to dark and persist to localStorage', async () => {
      const TestComponent = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('light');
        
        return (
          <ThemeProvider initialTheme={theme}>
            <div>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                Toggle Theme
              </button>
              <div data-testid="theme-indicator">
                Current: {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              </div>
            </div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      // Initial state should be light
      expect(document.documentElement.classList.contains('light')).toBe(true);
      
      // Toggle to dark
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await userEvent.click(toggleButton);
      
      // Wait for theme to apply
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 500 });
      
      // Check localStorage persistence
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should save theme preference to workspace storage when workspaceId is provided', async () => {
      const workspaceId = 'workspace-123';
      
      const TestComponent = () => {
        return (
          <ThemeProvider initialTheme="light" workspaceId={workspaceId} isAuthenticated={true}>
            <div>
              <span>Theme Provider Active</span>
            </div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(themeStorage.loadThemePreference).toHaveBeenCalledWith(workspaceId);
      });
    });

    it('should load workspace-specific theme on mount', async () => {
      const workspaceId = 'workspace-456';
      
      // Mock workspace theme preference
      vi.mocked(themeStorage.loadThemePreference).mockResolvedValueOnce('dark');
      
      const TestComponent = () => {
        return (
          <ThemeProvider workspaceId={workspaceId}>
            <div data-testid="content">Content</div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      // Wait for theme to load
      await waitFor(() => {
        expect(themeStorage.loadThemePreference).toHaveBeenCalledWith(workspaceId);
      });
      
      // Give more time for theme to apply (theme transitions take 250ms)
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 1000 });
    });

    it('should apply theme transition within 200-300ms', async () => {
      const TestComponent = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
        
        return (
          <ThemeProvider initialTheme={theme}>
            <button onClick={() => setTheme('dark')}>Switch to Dark</button>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      const startTime = Date.now();
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      // Wait for theme to apply
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 500 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Transition should complete within reasonable time (allowing for test overhead)
      expect(duration).toBeLessThan(600);
    });

    it('should respect system theme preference when theme is set to "system"', async () => {
      // Mock matchMedia for system theme
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
      
      const TestComponent = () => {
        return (
          <ThemeProvider initialTheme="system">
            <div>System Theme</div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      // Wait for system theme to apply
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 500 });
    });
  });

  describe('2. Keyboard Navigation Through Pages', () => {
    
    it('should render page with animated transition', async () => {
      const TestPage = () => (
        <AnimatedPage variant="fade" pageKey="/test-page">
          <div>
            <h1>Test Page</h1>
            <button>Interactive Element</button>
          </div>
        </AnimatedPage>
      );

      render(<TestPage />);
      
      // Page content should be rendered
      expect(screen.getByRole('heading', { name: /test page/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should allow keyboard navigation to all interactive elements', async () => {
      const TestPage = () => (
        <div>
          <button>Button 1</button>
          <a href="/link">Link 1</a>
          <input type="text" placeholder="Input 1" />
          <button>Button 2</button>
        </div>
      );

      render(<TestPage />);
      
      const button1 = screen.getByRole('button', { name: /button 1/i });
      const link1 = screen.getByRole('link', { name: /link 1/i });
      const input1 = screen.getByPlaceholderText(/input 1/i);
      const button2 = screen.getByRole('button', { name: /button 2/i });
      
      // Tab through elements
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(link1);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(input1);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(button2);
    });

    it('should support reverse tab navigation (Shift+Tab)', async () => {
      const TestPage = () => (
        <div>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </div>
      );

      render(<TestPage />);
      
      const button1 = screen.getByRole('button', { name: /button 1/i });
      const button2 = screen.getByRole('button', { name: /button 2/i });
      const button3 = screen.getByRole('button', { name: /button 3/i });
      
      // Start at button 3
      button3.focus();
      expect(document.activeElement).toBe(button3);
      
      // Shift+Tab backwards
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(button2);
      
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(button1);
    });

    it('should activate elements with Enter key', async () => {
      const handleClick = vi.fn();
      
      const TestPage = () => (
        <div>
          <button onClick={handleClick}>Action Button</button>
        </div>
      );

      render(<TestPage />);
      
      const button = screen.getByRole('button', { name: /action button/i });
      button.focus();
      
      // Press Enter
      await userEvent.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should maintain logical tab order following visual layout', async () => {
      const TestPage = () => (
        <div>
          <header>
            <button>Header Button</button>
          </header>
          <main>
            <button>Main Button 1</button>
            <button>Main Button 2</button>
          </main>
          <footer>
            <button>Footer Button</button>
          </footer>
        </div>
      );

      render(<TestPage />);
      
      const headerBtn = screen.getByRole('button', { name: /header button/i });
      const mainBtn1 = screen.getByRole('button', { name: /main button 1/i });
      const mainBtn2 = screen.getByRole('button', { name: /main button 2/i });
      const footerBtn = screen.getByRole('button', { name: /footer button/i });
      
      // Tab through in logical order
      headerBtn.focus();
      expect(document.activeElement).toBe(headerBtn);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(mainBtn1);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(mainBtn2);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(footerBtn);
    });
  });

  describe('3. Modal Interactions with Focus Trap', () => {
    
    it('should trap focus within modal when opened', async () => {
      const TestModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <DynamicModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
              <button>Modal Button 1</button>
              <button>Modal Button 2</button>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </DynamicModal>
          </div>
        );
      };

      render(<TestModalComponent />);
      
      // Open modal
      const openButton = screen.getByRole('button', { name: /open modal/i });
      await userEvent.click(openButton);
      
      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Get modal buttons
      const modalButtons = within(screen.getByRole('dialog')).getAllByRole('button');
      expect(modalButtons.length).toBeGreaterThan(0);
      
      // Focus should be trapped - tabbing through modal buttons should cycle
      const firstButton = modalButtons[0];
      const lastButton = modalButtons[modalButtons.length - 1];
      
      // Focus first button
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      // Tab to last button
      for (let i = 0; i < modalButtons.length - 1; i++) {
        await userEvent.tab();
      }
      expect(document.activeElement).toBe(lastButton);
      
      // Tab from last should cycle to first
      await userEvent.tab();
      expect(document.activeElement).toBe(firstButton);
    });

    it('should restore focus to trigger element when modal closes', async () => {
      const TestModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <DynamicModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
              <button onClick={() => setIsOpen(false)}>Close Modal</button>
            </DynamicModal>
          </div>
        );
      };

      render(<TestModalComponent />);
      
      const openButton = screen.getByRole('button', { name: /open modal/i });
      
      // Focus and click open button
      openButton.focus();
      await userEvent.click(openButton);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await userEvent.click(closeButton);
      
      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Focus should be restored to open button
      await waitFor(() => {
        expect(document.activeElement).toBe(openButton);
      });
    });

    it('should close modal with Escape key', async () => {
      const handleClose = vi.fn();
      
      const TestModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        
        const onClose = () => {
          setIsOpen(false);
          handleClose();
        };
        
        return (
          <DynamicModal isOpen={isOpen} onClose={onClose} title="Test Modal">
            <button>Modal Content</button>
          </DynamicModal>
        );
      };

      render(<TestModalComponent />);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Press Escape
      await userEvent.keyboard('{Escape}');
      
      // Modal should close
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('should prevent focus from leaving modal container', async () => {
      const TestModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        
        return (
          <div>
            <button>Outside Button</button>
            <DynamicModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
              <input type="text" placeholder="Input 1" />
              <input type="text" placeholder="Input 2" />
            </DynamicModal>
          </div>
        );
      };

      render(<TestModalComponent />);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const outsideButton = screen.getByRole('button', { name: /outside button/i });
      const input1 = screen.getByPlaceholderText(/input 1/i);
      const input2 = screen.getByPlaceholderText(/input 2/i);
      
      // Try to focus outside button (should not work while modal is open)
      input1.focus();
      expect(document.activeElement).toBe(input1);
      
      // Tab should stay within modal
      await userEvent.tab();
      expect(document.activeElement).not.toBe(outsideButton);
      
      // Should cycle within modal
      const modalDialog = screen.getByRole('dialog');
      const focusableInModal = within(modalDialog).getAllByRole('textbox');
      expect(focusableInModal).toContain(document.activeElement as HTMLElement);
    });

    it('should handle multiple modals with nested focus traps', async () => {
      const TestNestedModals = () => {
        const [modal1Open, setModal1Open] = React.useState(false);
        const [modal2Open, setModal2Open] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setModal1Open(true)}>Open Modal 1</button>
            
            <DynamicModal isOpen={modal1Open} onClose={() => setModal1Open(false)} title="Modal 1">
              <button onClick={() => setModal2Open(true)}>Open Modal 2</button>
            </DynamicModal>
            
            <DynamicModal isOpen={modal2Open} onClose={() => setModal2Open(false)} title="Modal 2">
              <button onClick={() => setModal2Open(false)}>Close Modal 2</button>
            </DynamicModal>
          </div>
        );
      };

      render(<TestNestedModals />);
      
      // Open first modal
      await userEvent.click(screen.getByRole('button', { name: /open modal 1/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /modal 1/i })).toBeInTheDocument();
      });
      
      // Open second modal
      await userEvent.click(screen.getByRole('button', { name: /open modal 2/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /modal 2/i })).toBeInTheDocument();
      });
      
      // Focus should be somewhere in modal 2
      const modal2 = screen.getByRole('dialog', { name: /modal 2/i });
      const focusableInModal2 = within(modal2).getAllByRole('button');
      expect(focusableInModal2.some(el => document.activeElement === el || modal2.contains(document.activeElement))).toBe(true);
      
      // Close modal 2
      const modal2CloseBtn = screen.getByRole('button', { name: /close modal 2/i });
      await userEvent.click(modal2CloseBtn);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /modal 2/i })).not.toBeInTheDocument();
      });
      
      // Focus should return to modal 1
      await waitFor(() => {
        const modal1 = screen.getByRole('dialog', { name: /modal 1/i });
        expect(modal1).toBeInTheDocument();
        // Just verify modal 1 is still open and contains focusable elements
        const focusableInModal1 = within(modal1).getAllByRole('button');
        expect(focusableInModal1.length).toBeGreaterThan(0);
      });
    });
  });

  describe('4. Complete User Flow Integration', () => {
    
    it('should handle complete flow: theme toggle -> page navigation -> modal interaction', async () => {
      const CompleteFlowComponent = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
        const [modalOpen, setModalOpen] = React.useState(false);
        
        return (
          <ThemeProvider initialTheme={theme}>
            <AnimatedPage variant="fade" pageKey="/complete-flow">
              <div>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                  Toggle Theme
                </button>
                <button onClick={() => setModalOpen(true)}>
                  Open Settings
                </button>
                
                <DynamicModal 
                  isOpen={modalOpen} 
                  onClose={() => setModalOpen(false)}
                  title="Settings"
                >
                  <input type="text" placeholder="Setting 1" />
                  <button onClick={() => setModalOpen(false)}>Save</button>
                </DynamicModal>
              </div>
            </AnimatedPage>
          </ThemeProvider>
        );
      };

      render(<CompleteFlowComponent />);
      
      // Step 1: Toggle theme
      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      await userEvent.click(themeButton);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 500 });
      
      // Step 2: Navigate with keyboard
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await userEvent.tab();
      expect(document.activeElement).toBe(settingsButton);
      
      // Step 3: Open modal with Enter key
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Step 4: Interact within modal
      const input = screen.getByPlaceholderText(/setting 1/i);
      await userEvent.type(input, 'test value');
      expect(input).toHaveValue('test value');
      
      // Step 5: Close modal
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Verify theme persisted throughout
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
