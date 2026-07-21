# Hoshi account-deletion page design

## Purpose

Publish a dedicated, localised account-deletion instruction page at
`/{locale}/games/hoshi/delete-account`. The page gives Hoshi players a clear
in-app deletion path and an alternative support-email path.

## Scope

- Add German and English page copy in the existing `hoshi` i18n namespace.
- Add a dedicated Hoshi page, its localised routes, static-generation entries,
  and the neutral English-fallback alias.
- Present the in-app flow as four numbered instructions.
- Add a mailto alternative using `support@yakuma.de` and the subject
  `Hoshi Account Deletion`.
- Update the German and English Hoshi Terms of Service to link to the
  corresponding localised page.
- Generate the legal-document date registry after changing the Terms files.

## Page structure

The page uses the existing Hoshi `PageShell`, solid Hoshi header, Hoshi page
typography, colour tokens, footer, and `PageMeta` pattern. It contains:

1. A concise hero that explains that a Hoshi account can be deleted in the app
   or through support.
2. A centred instruction section. Each row has a black, white-numbered badge on
   the left, a visual minus separator, and left-aligned instruction text. The
   rows use the app's translated labels verbatim:
   - German: `Einstellungen`, `Konto`, `Konto löschen`, `Konto löschen`.
   - English: `Settings`, `Account`, `Delete account`, `Delete account`.
3. An alternative-support section containing a mailto link for
   `support@yakuma.de` with the prefilled subject `Hoshi Account Deletion`.
4. A plainly visible consequence notice: deletion removes the Hoshi cloud
   account, but does not delete local game saves and does not cancel Apple App
   Store or Google Play subscriptions.

## Interaction and accessibility

- The four in-app instructions are rendered as an ordered list so the flow is
  meaningful without CSS.
- The mailto link is a normal keyboard-accessible link and exposes the address
  and subject in localised copy.
- Number badges are decorative reinforcement; the list order remains available
  to assistive technology.
- At narrow widths, each row preserves the number, separator, and readable
  left-aligned text without horizontal overflow.

## Routing and localisation

- Localised routes:
  - `/de/games/hoshi/delete-account`
  - `/en/games/hoshi/delete-account`
- The neutral route `/games/hoshi/delete-account` redirects to the English
  page, consistent with the current static GitHub Pages fallback.
- The alternate-language switch retains the same path because both localised
  routes exist.
- Title and description metadata are localised and use the canonical localised
  route path.

## Legal-document updates

The existing account-deletion links in each Hoshi Terms of Service are updated
to use the matching public route. The German document links to `/de/...` and
the English document links to `/en/...`; surrounding prose remains in its
current language.

## Verification

- Run linting and the production build/verification scripts.
- Verify both localised routes, the neutral redirect, and their generated
  static output.
- Inspect desktop and mobile layouts to confirm the requested number, minus,
  and text alignment.
- Confirm that the generated Terms dates reflect the modified documents.
