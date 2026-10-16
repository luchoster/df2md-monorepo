-- Whether the customer has chosen a password on this site. Every new profile starts at false:
-- accounts imported from Snipcart are sent to /set-password right after their first email-code
-- sign-in. The register form chooses a password, so signUp sets it to true straight away.
-- Server-set only: it is not in the customer's column grant, so it can't be flipped from the browser.

alter table public.profiles add column password_set boolean not null default false;
