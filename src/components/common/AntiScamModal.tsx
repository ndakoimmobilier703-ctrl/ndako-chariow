import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PhoneCall, X } from 'lucide-react';

interface AntiScamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCall: () => void;
  phoneNumber: string;
}

export const AntiScamModal: React.FC<AntiScamModalProps> = ({
  isOpen,
  onClose,
  onConfirmCall,
  phoneNumber,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg p-6 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <DialogTitle className="text-lg md:text-xl font-black text-amber-700 dark:text-amber-400 tracking-tight uppercase">
            ATTENTION AUX ARNAQUES IMMOBILIÈRES !
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/90 leading-relaxed space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              Pour votre sécurité, ne versez jamais d'argent pour une caution ou une avance de loyer sans avoir visité le logement et vérifié l'identité du propriétaire ou de l'agent immobilier.
            </p>
            <p className="text-muted-foreground">
              Méfiez-vous des demandes de paiement urgentes avant toute visite.
            </p>
            <p className="text-foreground font-medium bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
              Privilégiez toujours une visite physique du logement avant de prendre une décision.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 text-xs text-muted-foreground">
          Numéro du bailleur : <span className="font-bold text-foreground font-mono">{phoneNumber}</span>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto font-medium"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={onConfirmCall}
            className="w-full sm:w-auto bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Continuer vers l'appel</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
