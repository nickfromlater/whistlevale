#!/usr/bin/env node
// A discoverable task map for humans and agents. Recipes remain the authority;
// this command never edits, uploads, commits or installs anything.
const args=process.argv.slice(2),kind=args.find(a=>!a.startsWith('--'));
const routes={
 commons:{recipe:'docs/contributing/commons.md',files:['contributions/world.json','src/scenery/','src/rooms/commons.js','src/community-core.js','src/community.js','index.html'],checks:['test:contributions','test:rooms','test:map','test:cinema','test:geometry:full']},
 train:{recipe:'docs/contributing/trains.md',files:['src/trains.js','src/train-cabinet.js','assets/trains/'],checks:['test:trains','test:geometry:full']},
 livery:{recipe:'docs/contributing/trains.md',files:['src/trains.js'],checks:['test:trains','test:geometry:full']},
 building:{recipe:'docs/contributing/buildings.md',files:['contributions/world.json','src/scenery/','src/community-core.js','src/community.js','index.html','src/railway.js','src/rooms.js'],checks:['test:startup','test:geometry:full']},
 layout:{recipe:'contributions/README.md#layouts',files:['contributions/layouts/','src/railway.js'],checks:['test:startup']},
 people:{recipe:'contributions/README.md#shared-buildings-people-and-scenery',files:['contributions/world.json','src/people.js','src/community.js'],checks:['test:rooms','test:geometry:full']},
 vignette:{recipe:'contributions/README.md#shared-buildings-people-and-scenery',files:['contributions/world.json','src/people.js','src/community.js'],checks:['test:rooms','test:geometry:full']},
 prop:{recipe:'contributions/README.md#shared-buildings-people-and-scenery',files:['src/people.js','src/rooms.js','src/community.js'],checks:['test:geometry:full']},
 planting:{recipe:'CONTRIBUTING.md#landscape-detail-and-camera-checks',files:['src/rooms/','src/rooms.js','contributions/world.json'],checks:['test:geometry:full']},
 furniture:{recipe:'CONTRIBUTING.md#working-on-a-room',files:['src/rooms.js','src/rooms/','src/shop-house.js'],checks:['test:map','test:rooms','test:geometry:full']},
 structure:{recipe:'CONTRIBUTING.md#working-on-a-room',files:['src/railway.js','src/rooms/'],checks:['test:geometry:full']},
 district:{recipe:'CONTRIBUTING.md#working-on-a-room',proposal:true,files:['src/railway.js','src/rooms/'],checks:['test:startup','test:geometry:full']},
 signal:{recipe:'CONTRIBUTING.md#working-on-a-room',files:['src/railway.js'],checks:['test:startup','test:geometry:full']},
 room:{recipe:'CONTRIBUTING.md#adding-a-room',proposal:true,files:['src/rooms/','src/rooms.js','index.html'],checks:['test:rooms','test:map','test:geometry:full']},
 art:{recipe:'CONTRIBUTING.md#trains-and-illustrations',files:['src/rooms.js','src/railway.js','src/rooms/'],checks:['test:rooms','test:geometry:full']},
 audio:{recipe:'assets/audio/README.md',proposal:true,files:['src/soundscape.js','src/playlist.js','assets/audio/README.md'],checks:['test:audio','test:delivery']},
 code:{recipe:'CONTRIBUTING.md',files:['AGENTS.md'],checks:[]}
};
if(args.includes('--list'))console.log(args.includes('--json')?JSON.stringify(routes,null,2):Object.entries(routes).map(([key,r])=>key.padEnd(12)+r.recipe+(r.proposal?' (proposal first)':'')).join('\n'));
else if(!kind||args.includes('--help'))console.log('Usage: npm run contribute -- <train|building|layout|…> [--json]\n       npm run contribute -- --list [--json]\n\nRead AGENTS.md first. No installation or credentials required. This command only prints guidance.');
else if(!routes[kind]){console.error('Unknown contribution kind: '+kind+'. Use --list.');process.exitCode=2;}
else{
 const recipe={kind,...routes[kind],attribution:'docs/contributing/attribution.md',requiredChecks:['check:contributions','test'],prTemplate:'.github/PULL_REQUEST_TEMPLATE.md',preview:'python3 scripts/serve.py --port 4175',completion:['Actual requested model/behavior','Chosen public credits preserved in exports','Relevant automated checks passed','Desktop and phone visual evidence','Focused PR for maintainer review']};
 console.log(args.includes('--json')?JSON.stringify(recipe,null,2):'Read '+recipe.recipe+'\nEdit: '+recipe.files.join(', ')+'\nCredit: '+recipe.attribution+'\nRun: npm run check:contributions -- --json; npm test'+recipe.checks.map(c=>'; npm run '+c).join('')+'\nPreview: '+recipe.preview+'\nSubmit with '+recipe.prTemplate);
}
