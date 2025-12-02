/**
 * Subscription Management Component
 * Allows users to manage auto-renewal and view subscription status
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionManager() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user?.uid || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setAutoRenew(data.subscription.autoRenew ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async () => {
    try {
      const token = await user?.getIdToken();
      const newValue = !autoRenew;
      
      const response = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          autoRenew: newValue,
        }),
      });

      if (response.ok) {
        setAutoRenew(newValue);
        toast.success(`Auto-renewal ${newValue ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error);
      toast.error('Failed to update auto-renewal');
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 font-mono text-sm">Loading subscription...</p>
        </CardContent>
      </Card>
    );
  }

  if (userProfile?.plan !== 'PREMIUM') {
    return null;
  }

  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  return (
    <Card className="bg-black/40 border-white/10">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-mono">SUBSCRIPTION</h3>
          <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs font-mono">
            PREMIUM
          </span>
        </div>

        {/* Expiration Status */}
        <div className="p-4 bg-white/5 border border-white/10 rounded">
          <div className="flex items-start gap-3">
            {isExpired ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : isExpiringSoon ? (
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-mono text-white mb-1">
                {isExpired ? 'Subscription Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active Subscription'}
              </p>
              <p className="text-xs font-mono text-gray-400">
                {expiresAt ? (
                  <>
                    {isExpired ? 'Expired' : 'Expires'} on {expiresAt.toLocaleDateString()}
                    {!isExpired && ` (${daysRemaining} days remaining)`}
                  </>
                ) : (
                  'No expiration date set'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Renewal Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-sm font-mono text-white">Auto-Renewal</p>
              <p className="text-xs font-mono text-gray-400">
                {autoRenew ? 'Automatically renew subscription' : 'Manual renewal required'}
              </p>
            </div>
          </div>
          <Switch
            checked={autoRenew}
            onCheckedChange={toggleAutoRenew}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Warning for disabled auto-renewal */}
        {!autoRenew && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-xs text-yellow-400 font-mono">
              ⚠️ Auto-renewal is disabled. You'll need to manually renew before expiration.
            </p>
          </div>
        )}

        {/* Expiring soon warning */}
        {isExpiringSoon && autoRenew && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <p className="text-xs text-blue-400 font-mono">
              💡 Your subscription will auto-renew in {daysRemaining} days.
            </p>
          </div>
        )}

        {/* Expired warning */}
        {isExpired && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-xs text-red-400 font-mono mb-2">
              ⚠️ Your subscription has expired. Renew now to continue using premium features.
            </p>
            <Button
              onClick={() => window.location.href = '/premium-signup'}
              className="w-full bg-white text-black hover:bg-white/90 font-mono text-sm"
            >
              RENEW NOW
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
