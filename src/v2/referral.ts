// Partage du lien de parrainage (feuille de partage native, sinon copie).
// Source unique : utilisé par l'accueil et l'écran « Merci pour ta visite ».
export async function shareReferralLink(code: string): Promise<void> {
  const link = `${window.location.origin}/jeu?ref=${code}`;
  const text = 'Je te parraine chez La Base 🥤 Tourne la roue, gagne un cadeau à récupérer en boutique 🎁 : ';
  try {
    if (navigator.share) {
      await navigator.share({ title: 'La Base Shakes & Drinks', text, url: link });
      return;
    }
  } catch {
    /* annulé → fallback copie */
  }
  try {
    await navigator.clipboard.writeText(link);
    window.alert('Lien de parrainage copié ! Partage-le à tes amis 🤝');
  } catch {
    window.prompt('Copie ton lien de parrainage :', link);
  }
}
