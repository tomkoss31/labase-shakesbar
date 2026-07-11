// Helper analytics — track des events business clés
// Wraps @vercel/analytics pour qu'on puisse changer de provider sans casser
// les call sites. Aussi : no-op si analytics pas dispo (dev local).
import { track as vercelTrack } from '@vercel/analytics';

type EventName =
  | 'order_started'      // ouverture panier
  | 'order_paid_square'  // paiement Square réussi
  | 'order_paid_cash'    // commande espèces (pending_cash créée)
  | 'order_whatsapp'     // commande envoyée via WhatsApp
  | 'wheel_spun'         // roue cadeau utilisée
  | 'wheel_public_spun'  // roue publique utilisée
  | 'auth_signed_in'     // connexion réussie
  | 'review_google_click' // clic « Laisser un avis Google » (redirection)
  | 'review_feedback'     // clic « Un souci ? Dis-le-nous » (mail privé)
  | 'review_skipped'      // user a fermé le prompt
  | 'admin_console_open' // /console.html déverrouillée
  | 'qr_my_code_open'    // user ouvre son QR au comptoir
  | 'install_prompt_show'// PWA install banner shown
  | 'install_prompt_accept';

interface EventProps {
  // Valeurs numériques (Vercel les agrège)
  total_cents?: number;
  items_count?: number;
  // Valeurs string (max 30 chars)
  source?: string;
  reward_code?: string;
  segment_id?: string;
}

export function track(event: EventName, props?: EventProps) {
  try {
    vercelTrack(event, props as Record<string, string | number | boolean | null>);
  } catch {
    // Silently fail si pas dispo
  }
}
