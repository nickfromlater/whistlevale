# Whistlevale

**A miniature railway house that anyone can build in.**
Wander seven galleries, watch the trains — then claim an empty exhibition bay and
add something of your own. Your name goes on a plaque beside it, and the house
walks visitors to it.

[Visit Whistlevale](https://whistlevale.com) · [Claim a bay](contributions/README.md) ·
[Contribute](CONTRIBUTING.md) · [Agents start here](AGENTS.md)

## One hundred open bays

The Grand Exhibition has **one hundred numbered display bays across seven
galleries**, and almost all of them are empty. Pick one, run `npm run bay -- CC-07`
for a self-contained brief, and hand it to your coding agent — it will ask what
*you* want to make before it writes anything.

Contributions are ordinary pull requests: a scene, a building, a train, a livery,
a poster, a whole room. Every one carries a credit you choose, and every one
becomes a named stop on the slow tour.

> **The Open Workshop** — *it doesn't have to be finished.*

## The house

Alder Valley, the **Coastal Gallery**, the **Mountain Loft**, the **Makers' Shop**,
and **The Commons** — a shared landscape with a gentle circuit around it, where
first contributions go. Choose a train, wander, or settle into slow cinema and let
the conductor take you round. Alder Valley also has a layout editor with shareable
exports.

Built with plain JavaScript and a custom WebGL 2 renderer. **No package
dependencies, no build step for contributors, no account and no API key** — clone
it and it runs.

## Run locally

Use **Node.js 24+**, **Python 3.10+**, and a browser with WebGL 2.

```sh
git clone https://github.com/nickfromlater/whistlevale.git
cd whistlevale
npm run dev
```

Open [localhost:4174](http://127.0.0.1:4174/). No `npm install` required.

## Make something for the house

A train with character. A little bakery. A scene on a station platform.
Contributions can be small; they should make the world more convincing and a
pleasure to explore. Your chosen credit travels with your work.

Start with the [contribution guide](CONTRIBUTING.md). For Codex, Claude Code,
Copilot, or another coding agent, point it at this repository and ask:

> Read AGENTS.md, then help me contribute a [describe your train or building].
> Follow the relevant recipe, preserve attribution, test locally, and prepare a pull request.

[Train recipe](docs/contributing/trains.md) ·
[Building recipe](docs/contributing/buildings.md) ·
[Grow The Commons](docs/contributing/commons.md) ·
[Exhibit in the Grand Hall](docs/contributing/grandhall.md)

Larger changes, including whole rooms, start with a proposal. Every contribution
is reviewed before publication.

## More

[Controls and experience](docs/EXPERIENCE.md) ·
[Development and checks](CONTRIBUTING.md#local-development) ·
[Optional audio](assets/audio/README.md)

Code and repository artwork use the [MIT license](LICENSE).
Optional recordings have separate rights described in the audio guide.
