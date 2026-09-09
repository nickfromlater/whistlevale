# Whistlevale

**A model railway exhibit that anyone can contribute to.**

[Visit Whistlevale](https://whistlevale.com) · [Choose a bay](docs/contributing/grandhall.md) ·
[Contribute](CONTRIBUTING.md) · [Agents start here](AGENTS.md)

## The idea

Model railway clubs have built exhibits this way for a century. Nobody makes the
whole layout. Each person builds one scene to a shared standard, brings it along,
and the exhibition is whatever everyone brought that year.

Whistlevale is that exhibit, permanently open and running in a browser. The
trains are already circling and the galleries are already lit. The empty display
bays are the point: take one, make something for it, and it stands in the hall
under a plaque carrying the credit you chose.

You do not need to know this codebase. Every bay hands you a brief written for a
coding agent, and the first thing that brief tells the agent is to ask what you
want to build.

> **The Open Workshop** — *it doesn't have to be finished.*

## Room for your imagination

The Grand Exhibition has **112 numbered display bays across seven
galleries**, and almost all of them are empty. Pick one, run `npm run bay -- CC-07`
for a self-contained brief, and hand it to your coding agent with your idea
and chosen public credit. Selecting a bay does not reserve it.

Contributions are ordinary pull requests: a scene, a building, a train, a livery,
a poster, a whole room. Every one carries a credit you choose and is reviewed
before publication.

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
