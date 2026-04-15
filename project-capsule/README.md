# Project Capsule

Lokale project & AI capsule tool. Een persoonlijk dashboard en extern AI-geheugen
voor developers die meerdere projecten beheren.

Draait op `localhost` (standaard poort `4321`) en gebruikt uitsluitend lokale
bestanden (JSON + Markdown) — geen database, geen cloud.

## Snel starten

```bash
cd project-capsule
npm install
npm start
```

Open [http://localhost:4321](http://localhost:4321) in je browser.

## Wat doet het?

- **Dashboard** — overzicht van al je projecten (naam, klant, status, laatste activiteit)
- **Nieuw project** — genereert mapstructuur + standaard docs vanuit een template
- **Projectdetail** — AI geheugen, changelog, taken, koppelingen, Git info
- **Idee-inbox** — vang losse ideeën af; later omzetten naar project
- **Notities** — globale notities los van projecten
- **Zoeken** — zoekt door projecten, prompts, changelogs, notities, taken
- **AI Context Builder** — genereert een kant-en-klare prompt uit projectdata
- **Clone** — dupliceer projecten met nieuwe metadata (code/docs/prompts naar keuze)
- **Git** — toont branch, status en laatste commit per project
- **Open in VS Code** — opent de projectmap in VS Code (via `code` CLI)
- **Map-scan** — vindt projectmappen die je buitenom hebt aangemaakt
- **Backup/export** — download een project als zip

## Mapstructuur per project

```
klanten/<klant>/<project>/
  ├─ code/
  ├─ docs/         (project.md, readme.md)
  ├─ ai/           (prompts.md, context.md)
  ├─ changelog/    (changelog.md)
  ├─ tasks/        (todo.md)
  ├─ assets/
  ├─ deploy/       (deploy.md)
  ├─ archive/
  ├─ .gitignore
  └─ .capsule.json (metadata)
```

## Configuratie

`data/config.json` bevat:
- `port` — server poort (default 4321)
- `root` — absolute pad naar de map met klanten (default: `./klanten`)
- `vscode` — commando om VS Code te openen (default: `code`)

## Status: v1

v1 focus: één-gebruiker, lokaal, simpel. Geen auth, geen cloud sync, geen database.
