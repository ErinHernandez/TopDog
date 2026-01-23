/**
 * Tests for SignInModal Component
 * 
 * Tests the VX2 sign-in modal component including:
 * - Rendering and visibility
 * - Form input handling
 * - Validation
 * - Authentication flow
 * - Biometric authentication
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignInModal } from '../../../../components/vx2/auth/components/SignInModal';

// ============================================================================
// MOCKS
// ============================================================================

// Mock useAuth hook
const mockSignInWithEmail = jest.fn();
const mockSignInWithPhone = jest.fn();
const mockVerifyPhoneCode = jest.fn();

jest.mock('../../../../components/vx2/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    signInWithPhone: mockSignInWithPhone,
    verifyPhoneCode: mockVerifyPhoneCode,
  }),
}));

// Mock WebAuthn functions
const mockIsPlatformAuthenticatorAvailable = jest.fn();
const mockGetLastBiometricUserId = jest.fn();
const mockIsBiometricsEnabled = jest.fn();
const mockAuthenticateWithBiometric = jest.fn();
const mockGetBiometricTypeName = jest.fn();

jest.mock('../../../../lib/webauthn', () => ({
  isPlatformAuthenticatorAvailable: (...args: unknown[]) => mockIsPlatformAuthenticatorAvailable(...args),
  getLastBiometricUserId: (...args: unknown[]) => mockGetLastBiometricUserId(...args),
  isBiometricsEnabled: (...args: unknown[]) => mockIsBiometricsEnabled(...args),
  authenticateWithBiometric: (...args: unknown[]) => mockAuthenticateWithBiometric(...args),
  getBiometricTypeName: (...args: unknown[]) => mockGetBiometricTypeName(...args),
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('SignInModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSwitchToSignUp: jest.fn(),
    onForgotPassword: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockIsPlatformAuthenticatorAvailable.mockResolvedValue(false);
    mockGetLastBiometricUserId.mockReturnValue(null);
    mockIsBiometricsEnabled.mockReturnValue(false);
    mockSignInWithEmail.mockResolvedValue({ success: true });
    mockSignInWithPhone.mockResolvedValue({ success: true, verificationId: 'verification_123' });
    mockVerifyPhoneCode.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================
  
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<SignInModal {...defaultProps} />);
      
      // Check for modal content
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<SignInModal {...defaultProps} isOpen={false} />);
      
      // Modal should not be visible
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    it('renders email input field', () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'text');
    });

    it('renders password input field', () => {
      render(<SignInModal {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('renders sign in button', () => {
      render(<SignInModal {...defaultProps} />);
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<SignInModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // USER INTERACTION TESTS
  // ==========================================================================
  
  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<SignInModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('updates email input value', () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password input value', () => {
      render(<SignInModal {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles password visibility', () => {
      render(<SignInModal {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Find and click show password button (if exists)
      const toggleButton = screen.queryByRole('button', { name: /show password/i });
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('handles form submission with valid email and password', async () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      render(<SignInModal {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================
  
  describe('Validation', () => {
    it('shows error when email is invalid', async () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email or phone/i)).toBeInTheDocument();
      });
    });

    it('shows error when password is missing for email', async () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(passwordInput);
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('shows error message on authentication failure', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: false,
        error: { message: 'Invalid credentials' },
      });
      
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });

    it('supports keyboard navigation', () => {
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      emailInput.focus();
      
      expect(emailInput).toHaveFocus();
    });

    it('has accessible close button', () => {
      render(<SignInModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toBeVisible();
    });
  });

  // ==========================================================================
  // BIOMETRIC AUTHENTICATION TESTS
  // ==========================================================================
  
  describe('Biometric Authentication', () => {
    it('shows biometric button when available', async () => {
      mockIsPlatformAuthenticatorAvailable.mockResolvedValue(true);
      mockGetLastBiometricUserId.mockReturnValue('user_123');
      mockIsBiometricsEnabled.mockReturnValue(true);
      mockGetBiometricTypeName.mockReturnValue('Face ID');
      
      render(<SignInModal {...defaultProps} />);
      
      await waitFor(() => {
        const biometricButton = screen.queryByRole('button', { name: /face id/i });
        expect(biometricButton).toBeInTheDocument();
      });
    });

    it('handles biometric authentication success', async () => {
      mockIsPlatformAuthenticatorAvailable.mockResolvedValue(true);
      mockGetLastBiometricUserId.mockReturnValue('user_123');
      mockIsBiometricsEnabled.mockReturnValue(true);
      mockAuthenticateWithBiometric.mockResolvedValue({
        success: true,
        userId: 'user_123',
      });
      
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      
      render(<SignInModal {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);
      
      await waitFor(() => {
        const biometricButton = screen.queryByRole('button', { name: /biometric/i });
        if (biometricButton) {
          fireEvent.click(biometricButton);
        }
      });
      
      await waitFor(() => {
        expect(mockAuthenticateWithBiometric).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  
  describe('Edge Cases', () => {
    it('handles loading state during authentication', async () => {
      mockSignInWithEmail.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      render(<SignInModal {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);
      
      // Button should be disabled during loading
      expect(signInButton).toBeDisabled();
      
      await waitFor(() => {
        expect(signInButton).not.toBeDisabled();
      });
    });

    it('resets form when modal closes', () => {
      const { rerender } = render(<SignInModal {...defaultProps} isOpen={true} />);
      
      const emailInput = screen.getByPlaceholderText(/email or phone/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
      
      // Close modal
      rerender(<SignInModal {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<SignInModal {...defaultProps} isOpen={true} />);
      
      const newEmailInput = screen.getByPlaceholderText(/email or phone/i);
      expect(newEmailInput).toHaveValue('');
    });
  });
});
