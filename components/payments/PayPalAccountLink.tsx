/**
 * PayPal Account Link Component
 *
 * Displays linked PayPal account status and allows connecting/disconnecting
 * Users must link via OAuth - no manual email entry allowed
 */

import React, { useState } from 'react';
import type { LinkedPayPalAccount } from '../../lib/paypal/paypalTypes';

interface PayPalAccountLinkProps {
  linkedAccount: LinkedPayPalAccount | null;
  linkedAccounts?: LinkedPayPalAccount[];
  onConnect: () => void;
  onDisconnect: (accountId: string) => Promise<void>;
  onSetPrimary?: (accountId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PayPalAccountLink({
  linkedAccount,
  linkedAccounts = [],
  onConnect,
  onDisconnect,
  onSetPrimary,
  isLoading = false,
}: PayPalAccountLinkProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this PayPal account?')) {
      return;
    }

    setDisconnecting(accountId);
    try {
      await onDisconnect(accountId);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    if (!onSetPrimary) return;

    setSettingPrimary(accountId);
    try {
      await onSetPrimary(accountId);
    } finally {
      setSettingPrimary(null);
    }
  };

  // Show multiple accounts if provided
  const accounts = linkedAccounts.length > 0 ? linkedAccounts : linkedAccount ? [linkedAccount] : [];

  if (accounts.length > 0) {
    return (
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
          >
            <div className="flex items-center gap-3">
              <PayPalIcon className="w-8 h-8" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">PayPal Connected</p>
                  {account.isPrimary && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  {account.verified && (
                    <VerifiedBadge />
                  )}
                </div>
                <p className="text-sm text-gray-500">{account.paypalEmail}</p>
                <p className="text-xs text-gray-400">
                  Linked {new Date(account.linkedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!account.isPrimary && onSetPrimary && accounts.length > 1 && (
                <button
                  onClick={() => handleSetPrimary(account.id)}
                  disabled={settingPrimary === account.id}
                  className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
                >
                  {settingPrimary === account.id ? 'Setting...' : 'Set as Primary'}
                </button>
              )}
              <button
                onClick={() => handleDisconnect(account.id)}
                disabled={disconnecting === account.id}
                className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
              >
                {disconnecting === account.id ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ))}

        {/* Option to link another account */}
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="flex items-center gap-3 p-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 w-full transition-colors disabled:opacity-50"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
            <PlusIcon className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-700">Link Another PayPal Account</p>
            <p className="text-sm text-gray-500">Add an additional PayPal account for withdrawals</p>
          </div>
        </button>
      </div>
    );
  }

  // No accounts linked - show connect button
  return (
    <button
      onClick={onConnect}
      disabled={isLoading}
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 w-full transition-colors disabled:opacity-50"
    >
      <PayPalIcon className="w-8 h-8" />
      <div className="text-left flex-1">
        <p className="font-medium text-gray-900">Connect PayPal</p>
        <p className="text-sm text-gray-500">
          Link your PayPal account for withdrawals
        </p>
      </div>
      <ArrowRightIcon className="w-5 h-5 text-gray-400" />
    </button>
  );
}

// PayPal Icon Component
function PayPalIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.62A.769.769 0 015.701 2h6.577c2.177 0 3.78.45 4.758 1.337.916.836 1.23 2.05.93 3.607-.074.393-.175.757-.303 1.088-.486 1.266-1.466 2.25-2.91 2.926-1.388.65-3.086.979-5.042.979h-.896a.774.774 0 00-.762.652l-.654 4.13-.352 2.231a.641.641 0 01-.633.55H4.944l.001.001-.864-.164h3.001z"
        fill="#253B80"
      />
      <path
        d="M18.966 6.964c-.074.393-.175.757-.303 1.088-.486 1.266-1.466 2.25-2.91 2.926-1.388.65-3.086.979-5.042.979h-.896a.774.774 0 00-.762.652l-1.006 6.361a.641.641 0 00.633.74h3.369l.847-5.373a.774.774 0 01.762-.652h.896c1.956 0 3.654-.329 5.042-.979 1.444-.676 2.424-1.66 2.91-2.926.128-.331.229-.695.303-1.088.306-1.557-.014-2.771-.93-3.607a3.38 3.38 0 00-.913.879z"
        fill="#179BD7"
      />
      <path
        d="M10.149 11.609a.774.774 0 01.762-.652h3.8c.45 0 .877-.024 1.28-.073.403-.049.784-.122 1.143-.22.359-.098.695-.22 1.008-.368a4.61 4.61 0 001.454-.959c.916.836 1.23 2.05.93 3.607-.074.393-.175.757-.303 1.088-.486 1.266-1.466 2.25-2.91 2.926-1.388.65-3.086.979-5.042.979h-.896a.774.774 0 00-.762.652l-1.006 6.361a.641.641 0 01-.633.55H5.606l2.077-13.23 2.466-.661z"
        fill="#222D65"
      />
    </svg>
  );
}

// Verified Badge Component
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}

// Plus Icon Component
function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// Arrow Right Icon Component
function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default PayPalAccountLink;
