import React from 'react';
import { isIOS, isAndroid } from '@/lib/platform';
import UndoPurchaseModalIOS from './UndoPurchaseModalIOS';
import UndoPurchaseModalAndroid from './UndoPurchaseModalAndroid';

interface UndoPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Platform-aware Undo Purchase Modal
 * Shows iOS-style Apple Pay modal on iOS, Stripe modal on Android/Web
 */
const UndoPurchaseModal: React.FC<UndoPurchaseModalProps> = (props) => {
  // Use iOS modal for iOS devices, Android/Stripe for everything else
  if (isIOS()) {
    return <UndoPurchaseModalIOS {...props} />;
  }
  
  // Android and Web use Stripe
  return <UndoPurchaseModalAndroid {...props} />;
};

export default UndoPurchaseModal;
