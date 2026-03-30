# Configuration Supabase Dashboard - SmartFitCoach

## 1. Activer la confirmation email

1. Aller dans **Authentication > Settings > Email Auth**
2. S'assurer que **Enable email confirmations** est **ON**
3. Sauvegarder

## 2. Configurer le template d'email de confirmation

1. Aller dans **Authentication > Email Templates > Confirm signup**
2. Copier-coller le contenu complet du fichier `email-template-confirm.html` dans le champ "Body"
3. Subject : `Bienvenue sur SmartFitCoach - Confirme ton compte`
4. Sauvegarder

## 3. Configurer les URLs

1. Aller dans **Authentication > URL Configuration**
2. **Site URL** : `https://smartfitcoach.com` (ou le domaine custom utilise)
3. **Redirect URLs** : ajouter `https://smartfitcoach.com` dans la liste
4. Sauvegarder

## 4. Verification

Apres configuration :
1. Creer un compte test avec une adresse email valide
2. Verifier la reception de l'email de confirmation (sujet, design, lien)
3. Cliquer sur le lien de confirmation
4. Verifier que la redirection vers l'app fonctionne
5. Verifier que l'ecran "Verifie ton email" s'affiche bien dans l'app apres inscription
6. Verifier que le bouton "J'ai confirme mon email" detecte bien la confirmation

## Notes

- Le template utilise la variable `{{ .ConfirmationURL }}` fournie par Supabase
- Le lien de confirmation expire en 24h (configurable dans les settings Supabase)
- Le projet Supabase : `https://uwaoxkgsgbzohakzgyvq.supabase.co`
