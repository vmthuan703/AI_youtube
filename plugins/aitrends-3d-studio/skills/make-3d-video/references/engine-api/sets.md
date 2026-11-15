# Sets and props — `T.W.*` (engine/world3d.js)

Part of the engine reference (`../engine-api.md`). Grep it for the call you need instead of reading it all.

Sets build into the stage and return anchors:
- `T.W.city(st, { seed, length, lights, focus:[x,z], cars, props, signs, front, wet, crosswalk, moon, stars })` → night
  street along x: road z ∈ [−4, 4], sidewalks to ±7 at y = 0.15, building row behind z < −7, street lamps, parked cars,
  skyline, moon. Returns `{ lamps, lane:[-2, 2], sidewalk: 0.15 }`.
- `T.W.suburb(st, { seed, length, lights, focus, fence, moon, stars })` → houses with lit windows, lawns, fences, trees, road along x. Colours follow the stage mood (`M.houses`, `M.tree`); moon and stars only at night unless asked.
- `T.W.room(st, { kind: bedroom|living|office|classroom|kitchen|hallway|hospital|empty, w, d, h, wall, floor, window:
  'back'|'left'|'right'|false, view: 'day'|'night', ceiling, curtains, lockerColor, boardText, desks, clock, wainscot, contact })` → floor centred at the origin, back wall
  at z = −d/2, side walls at x = ±w/2, open toward +z. Returns `{ w, d, h, window, lamps, backZ, bedTop, monitor }`.
  Walls have a light falloff, baseboards and a crown moulding; hospital, classroom and office add a two-tone wainscot. Every floor-standing
  prop gets a soft contact shadow (`contact: false` skips them). **Location kits:** `hospital` builds a bed with rails (`bedX`, `bedZ`,
  `bedColor`), a heart monitor (`bpm`, `bpmText`), a drip stand, a privacy curtain, a bedside cabinet, a visitor chair, a sink and a clock;
  `classroom` adds a wall clock, a cork board, a poster and a bookcase. The props alone: `T.W.hospitalBed`, `heartMonitor`, `ivPole`,
  `curtain`, `bedsideCabinet`, `wallClock({time: '10:10' | t => minutes})`, `bulletinBoard`. `T.contactShadow(obj)` gives any prop a soft
  shadow on the floor (add it with `st.add`).
- `T.W.explainer(st, { color, lineZ, light, line, dust })` → the purple diagram stage of the references: flat backdrop with a
  fine faint grid, a floor meeting it in a thin light line at z = lineZ (default 0), fine dust floating up through the light (`dust: false` off). Stand characters on the line, frame
  front-on with fov 18–28 (`T.dolly` from z ≈ 10–13), and add `UI.pill/statCard/tag/heading/nameLabel` in `overlay`.
- `T.W.veil(st, { pos, w, h, opacity, color, lookAt })` → a dark transparent sheet that pushes a busy set back behind
  small foreground characters (the "blurred scene" explainer variant, with `dof`).
- `T.W.gym(st, { floor, rows, crowd, crowdN })` → basketball court (lines, hoops at x = ±13), bleachers with a crowd at
  z < −8, strip lights. `T.W.diner(st, { booths, booth, wall, trim })` → checkered floor, red booths + white tables along
  the window wall (returns `booths: [[x, z], …]`; seat characters at z ± 0.75 with `sitDesk`), counter + stools.
  `T.W.gameshow(st, { doorColors })` → stage, three numbered doors at z = −4.2 (`doors`), spotlights, bulb marquee.
  `T.W.casino(st, { tableX, tableZ, slots, carpet })` → roulette table with a spinning `wheel` (call
  `wheel.update(t, { speed, settle })`), chips, slot machines along the back wall. `T.W.rouletteWheel()` alone.
  `T.W.store(st, {})` → shop aisle with colourful shelves and strip lights.
- `T.W.room(st, { kind: 'hallway', lockerColors: ['#2f6a72', '#b8403a'], lockerRun: 8, strips })` → lockers in colour
  runs and fluorescent strip lights (the reference hallway).
- `T.W.park(st, { seed, trees, lights, focus })`, `T.W.studio(st, { color, intensity, pos, target, gloss, bg })` (dark
  void + spotlight pool: explanations, "imagine…", title reveals), `T.W.house(o)`, `T.W.skyline(o)`, `T.W.stars(n)`,
  `T.W.moon(o)`.
- Props (stand on y = 0, face +z): `building(w,h,d,{color, lit, sign, shop})`, `neonSign(text,{color,w})`,
  `streetLamp({light})`, `trafficLight({state:'red'|'yellow'|'green'})`, `tree({s, type:'pine'})`, `bench`, `hydrant`,
  `trashCan`, `car({color, type: sedan|sports|suv|taxi|police|van, lights, headlights, driver})` (front = +z), `table`,
  `desk`, `chair({h})`, `officeChair`, `bed({color})`, `sofa`, `shelf`, `door`, `tv({w, draw})`, `laptop({draw})`,
  `phone({draw})` (screen = `phone.screen.update(t)`), `cup`, `bottle({color, label})`, `book`, `plant`, `deskLamp`,
  `ceilingLamp`, `whiteboard({text, dark, draw})`, `locker({color})`, `counter`, `fridge`, `rug`, `poster({text})`,
  `money({n})`, `ball`, `crowd({n, area:[x0,x1,z0,z1], colors, hairColors, s, yaw, rise, riseFrom, y0, cheer, still})` (instanced mini people in the
style's skin with hair, arms and muted tops; `rise` lifts rows for bleachers: y = y0 + (riseFrom − z) × rise). Added with `st.add`, they bob, sway
and raise their arms in waves; `cheer` 0–1 (or a function of t) sets how many cheer, `still: true` freezes them).
- **Nature** (engine/nature3d.js, 0.2.7; every set returns `heightAt(x, z)`: stand people with `ch.place(x, set.heightAt(x, z), z)`):
  `T.W.beach(st, { seed, shoreZ: -2, bay, palms, framePalms, rocks, bushes, sun, sunPos })` → dry sand toward the camera, the sea beyond (a bay, so the sides
  curve away), lapping foam, two palms that frame a shot from z ≈ 8 looking out to sea; with mood `sunrise`/`golden`/`dusk` a low sun and a glittering
  path on the water. Wading: place a character at `heightAt` below 0 and the water shows the legs. `T.W.island(st, { r: 9, cx, cz, palms })` → a round
  island in open sea (aerial and stranded shots). `T.W.snow(st, { slope: 0.12, pines, mountains, falling, aurora, tracks, stars })` → a snowy slope rising
  away from camera, snow-capped pines, peaks, falling snow; `aurora: true` for arctic nights. `T.W.farm(st, { barn: [x, z], silo, fence, fields, hay })` →
  red barn, silo, white fences, crop rows, hay bales. `T.W.underwater(st, { depth: 9, rays, fish, weeds, coral, bubbles, surface })` → sea floor at y 0,
  god rays, swaying seaweed, caustic light, a fish school. `T.W.space(st)` + `T.W.planet(st, { r, pos, spin, tilt, sea, land, clouds, atmosphere })` →
  a toy Earth in deep space (mood `void`). Props: `palm({ h, lean, dir })`, `pine({ s, snow })`, `rock({ s })`, `bush({ s })`, `mountain({ h, r })`,
  `campfire(st, { pos, size })`, `fishSchool(st, { n, center, radius })`, `seaweed(st, { pos, h })`, `aurora(st)`, `sun(st, { pos })`, `water(st, {...})`,
  `foam(st, { path | ring })`, `terrain(w, d, seg, h(x, z), colour(x, z, y))`. Everything that moves animates itself.
- **Animals** (engine/animals3d.js): `T.W.cow()`, `sheep`, `pig`, `dog`, `cat`, `bird`, `crab`, `bee`, `fish` (or `T.W.animal(kind, { color, seed })`) — toy shapes with the
  cast's glossy dot eyes, standing on y 0, facing +z. Call `a.update(t, { walk | run: 0..1, look, nod, wag, fly, snap, raise, blink })` every frame and move them yourself
  (`a.position.x = …`); legs swing, tails wag, wings flap, eyes blink. Sizes match a 1.75 m person (cow 1.5 m, dog 0.75 m, cat 0.55 m).
- **Sports and big crowds** (engine/sports3d.js): `T.W.stadium(st, { kind: 'football'|'soccer', n: 5000, cheer, lights })` → a 100 × 64 m pitch at the origin, stands
  on four sides full of instanced people, floodlight towers. `T.W.boxingRing(st, { crowd: 700 })` → raised ring (canvas at y = `top` 1.1), ropes, corner pads, a hard
  spotlight, stepped seats all round. `T.W.track(st, { lanes, length, crowd })` → straight track along x, `laneZ(i)`, start and finish lines, bleachers.
  `T.W.pool(st, { lanes, length, depth })` → tiled pool, lane ropes, blocks, ladders; the surface is y 0 and see-through, a swimmer stands at y ≈ −0.95.
  `T.W.stand({ len, rows, n })` → one block of stepped seats with people (rotate/move it). `T.W.formation(st, { cols, rows, gap, pos, colors, hairColors, same })` →
  people in a grid (an army of clones: `colors: [HERO.color], hairColors: [HERO.hairColor], same: true`). `T.W.crowd({ positions: [[x, z], …] })` places a crowd exactly.
- **Screens and signs** (engine/screens3d.js): `T.W.newsWall(st, { cols, rows, w, items: [{ tag, text }], pos, yaw })` → a wall of TVs running news with a host, a tag,
  a headline and a ticker. `T.W.scoreboard3d({ title, rows: [[rank, name, value, highlight, colour]], timer, w, h })` → a results board on legs (rows pop in).
  `T.W.billboard({ title, sub, icon, color })` → a lit roadside billboard on posts. Draw functions for any screen (`T.screen`, `T.W.tv/phone/laptop({ draw })`):
  `T.W.newsDraw({ tag, text, ticker })`, `T.W.feedDraw({ title, user, views: [from, to], t0, dur, live })` (a post whose view count climbs), `T.W.boardDraw({...})`.
  Animate a phone screen with `phone.screen.update(t)`.
- **School sets, ready-made** (engine/school3d.js, 0.2.8). Use these before writing a project set: every teen story goes through them.
  `T.W.busStop(st, { busX, door })` → sidewalk z −2..1 (top y 0.15 = `walk`), road z 1..8, a school bus at the curb, door open; `step[0]`, `step[1]` are the two
  step positions [x, y, z] for getting off (move the character down them with a small hop, then onto `walk`), `door` the top of the steps.
  `T.W.schoolBus({ door })` → the bus alone (front +x, door on +z, `.door` swings). `T.W.busInside(st, { rows, moving, night })` → aisle along x, front +x,
  `seat(row, side)` → [x, z] for pose 'sit' with yaw π/2 (facing the front); call `b.update(t)` in draw so the street slides past the windows.
  `T.W.lockerHall(st, { w, d, banner })` → lockers on both walls; `locker(i, side)` → { x, z, yaw, door, front }: stand at `front` facing the locker, open with `door.rotation.y = −1.7`.
  `T.W.schoolFront(st, { name, bus })` → facade with the name, steps, flag, path, sidewalk and bus (as busStop). `T.W.cafeteria(st, { tables })` → long tables (top 0.76),
  benches at z ± 0.72, `seat(table, side, i)`. `T.W.court(st)` → outdoor basketball court, hoops at x ±11.5 (rim 3.05), fence, benches; `T.W.hoop()` alone.
  `T.W.schoolYard(st)` → PE field 40 × 24 with a running lane, goals at x ±18, coach bench `coach`, school behind. Indoor basketball / dodgeball: `T.W.gym`.
- **Everyday places, ready-made** (engine/places10.js, 1.0). Reach for these before writing a project set; they already use the 1.0 look.
  `T.W.stairwell(st, { n, floorLabel })` → two flights + landing with a window and light shafts; `up` (whole climb), `upA`, `upB` are paths for `T.climb`,
  `landing`, `H1` (landing height). `T.W.classroom(st, { board: [lines], boardDraw, rows, cols, clock })` → desks facing the board at z = −d/2;
  `seat(row, col)` → [x, z, yaw] for pose 'sitStudy' (desks 0.645 high: forearms rest on the top; 'sitDesk' is for 0.76 office desks); `teacher`, `board`. `T.W.cityBusStop(st, { busX, shelterX, wet, ad, route })` → shelter with a lit ad,
  bench (`bench(i)` → [x, z, yaw], y 0.15), city bus (`bus`, `door`, `step`), sidewalk top `walk` 0.15. `T.W.shopStreet(st, { names, wet, tables, scooters })` →
  shophouses with lit fronts, awnings, signs, balconies, string lights; `shops[i].door`, `table(i)`. `T.W.residential(st, { houses, cars, wet })` → brownstones;
  `stoops[i] = { base, top, door, up }`. `T.W.streetFood(st, { name, menu, tables, wet })` → food stall with steam and bulbs; `vendor`, `seat(i)`, `counter`.
  `T.W.cafe(st, { rain, menu, tables })` → counter, espresso machine, pendants, big window; `seat(i)`, `barista`, `counter`.
  Props: `T.W.stairs({ n, rise, run, w, rails })` (`.path(x)` → climb path once placed), `cityBus`, `awning`, `stool`, `lowTable`, `pendantLamp`, `scooter`,
  `menuBoard`, `aFrame`, `acUnit`, `planter`. Extras: `T.W.passersby(st, { cast: [roster outfits], lane: [x0, x1, z], n })` walk the sidewalk on their own.
  These sets animate through `st.onTick` (dust in light shafts, steam, rain on glass, passers-by, the sky dome); the player ticks them after draw().
- **More places** (engine/places10b.js, 1.0): `T.W.supermarket(st, { aisles, names, checkouts, name })` → shelves along z; `aisle(i)` → x of aisle i,
  `checkout(i)` → [x, z], `cashier(i)` → [x, z, yaw]. `T.W.hospitalHall(st, { sign, room })` → corridor along z; `door(i, side)` → { x, z, yaw, n },
  `station`, `panels` / `lights` (flicker them). `T.W.rooftop(st, { lights })` → roof at y 0 with parapet, water tank, vents, stair hut, city below; `edge`,
  `ledge(i)`, `door`. `T.W.trainStation(st, { board, name, line, trainX })` → platform along x (top y 0), `train` (move `.position.x`; arriving: ease out),
  `edgeZ`, `doorZ`, `bench(i)`. Props: `shelfUnit`, `cart`, `gurney`, `wheelchair`, `waterTank`, `trainCar`.
- **American high school** (engine/school10.js, 1.0.1; with school3d.js lockerHall / cafeteria / schoolFront / schoolBus / court, `T.W.gym`, `T.W.classroom`,
  `T.W.stairwell` it covers a whole US high-school story). Each returns anchors `[x, z, yaw]` (4th value = floor height when not 0):
  `library` → `seat(table, side, i)`, `aisle(i)`, `desk`, `librarian` · `chemLab` → `station(i)` (stand), `teacher`, `flask` (glowing reaction) ·
  `auditorium` → `stageY`, `stage(x)`, `podium`, `seat(row, i)`, `spots` · `footballField` (Friday night: `{ home, score: { home, guest, quarter, clock },
  crowd, lights }`) → `sideline(i)`, `bleacher(row, i)`, `board` · `lockerRoom` → `bench(i)`, `locker(i)`, `shower` · `bandRoom` → `seat(row, i)` (risers),
  `podium`, `piano` · `principalOffice` → `principal`, `guest(i)`, `door` (flag, trophy case, test paper with a red F) · `detention` (the classroom after
  school, low sun, the board says DETENTION; classroom anchors + `teacher` chair) · `nurseOffice` → `bed` (pose 'sit' at its y), `nurse` · `restroom` →
  `sink(i)` facing a real wall mirror, `stall(i)` · `studentLot` (`{ wet, buses, cars, gap: [x0, x1] }` keeps a strip free for the camera) → `car(i)`,
  `busDoor` · `promHall` (the gym with a balloon arch, banner, disco ball and moving light dots) → `arch`, `punch` · `dinerUS` (50s diner: booths,
  stools, jukebox, neon) → `booth(i, side)`, `stool(i)`, `jukebox` · `suburbStop` (porch houses, mailboxes, stop sign, the yellow bus: move
  `bus.position.x`; `{ autumn, wet }`) → `stop`, `busDoor`, `porch(i)`. Props: `bookcase bankerLamp labBench beaker trophyCase usFlag bleachers scoreboard
  goalPost musicStand drumKit piano examBed mailbox stopSign pickup jukebox discoBall balloon balloonArch paSpeaker testPaper tray milkshake umbrella gradCap
  football pompom newspaper ballotBox sinkUnit`, `T.W.bell(st, { pos, yaw, t0, dur })` (rings), `T.W.LETTERMAN` (spread into an outfit for a varsity jacket).
- **swingDoor** (1.0.2): `T.W.swingDoor({ w, h, color, hinge: 'L' | 'R' })` a door on a real hinge (`.setAngle(a)`, `.handle`); open it
  with `T.act.door`.
- **School weather, seasons, time of day** (engine/season10.js, 1.0.1, all tick themselves): `T.stage({ ...T.W.schoolTime('afterSchool') })` (morning ·
  noon · afterSchool · evening · night · storm · snow); `T.W.fallDay(st, { area, y })` maple leaves + piles; `T.W.snowDay(st, { area, groundY })` snow caps +
  snowfall (after the set); `T.W.breath(st, ch, { every })` cold breath; `T.W.windowRain(st, { pos, w, h, yaw })` drops running down a window (inside);
  `T.W.fogGlass(st, { pos, w, h, yaw, draw: 'heart' | 'smile' | text })`; `T.W.powerCut(st, { t0, room })` blackout (lightning still flashes);
  `T.W.alarmLight(st, { pos, t0 })` rotating red beacon (tornado drill); `T.W.capToss(st, { at, n, t0 })` graduation caps; `T.W.confetti(st, { area, t0 })`;
  `T.W.haze(st, { area, opacity })` (stadium lights, morning fog); `T.W.blowingPaper(st, { area, wind })`.
- **Dramatic light and weather** (engine/weather10.js, 1.0, all tick themselves): `T.W.lightning(st, { times })` double-strobe flashes;
  `T.W.cloudShadows(st, { at: [x, z] })` cloud shadows sliding over the ground, the sun dims when one passes; `T.W.headlights(st, { from, to, aim, t0, dur,
  power, angle, shadow })` a sweeping car beam (indoors: start at the window, `shadow: false`); `T.W.flicker(t, { rate, depth })` multiplier for a failing
  tube (`L.intensity = base * flicker`). `T.W.snowCover(st, { amount, groundY })` after the set: snow caps on every upward surface + patchy ground;
  `T.W.puddles(st, { area: [x0, x1, z0, z1], n, y })` mirror puddles in one reflection pass; `T.W.leaves(st, { area: [x0, x1, y0, y1, z0, z1], n, ground })`.
- **1.0 look helpers** (engine/look10.js; all switch off with `render.mjs --legacy` for before/after): `T.W.mirror(st, { w, d, x, z, y, strength, blur })`
  polished/wet floors (fresnel, blurred; ~0.15 indoors, 0.4–0.5 wet streets); `T.W.skyDome(st, { clouds, sun, seed })` painted sky with clouds and a sun glow;
  `T.W.shafts(st, { pos, dir, len, w, h, n, gap, along, opacity, motes })` light beams with dust; `T.W.aoStrip(st, { from, to, yaw, up, out })` soft
  darkening where a wall meets the floor; `T.W.stringLights({ from, to, n, sag, lights, colors })`.
  Materials: `T.mat(c, { clearcoat, clearcoatRough, sheen, sheenRough, sheenColor })` switches to the physical material. Characters get a clearcoat on
  skin, hair and shoes and a sheen on cloth automatically (`style.gloss` 0..1.5, 0 = the matte 0.2 look). `T.stage` lights every standard material with
  the mood's own sky/ground/sun (`env` 0..1, default 0.42; `style.env`). `st.fitShadow([x,y,z], size)` tightens the sun's shadow box around the action.
- **Home sets, ready-made** (engine/home15.js, 1.0.5; promoted from five past videos that each rebuilt them). Seats are [x, z, yaw, seatY]:
  `T.W.teenBedroom(st, { night, wall, bed, poster, skate })` → bed back-left, desk + lamp + chair right, window, rug, poster, skateboard;
  `bedTop` [x, y, z] (pose 'sit'), `lieAt` (pose 'lie'), `desk` top, `chair`, `door`, `lamp`. `T.W.homeKitchen(st, { night, seats: 2|4, plates })`
  → counter + cabinets + sink, fridge, dining table under a pendant; `seat(i)`, `table`, `fridge` / `counter` stand spots, `photo` spot.
  `T.W.livingRoom(st, { night, tv: drawFn, sofa })` → wall TV that lights the room (`tv.screen.update(t)`), sofa facing it (`sofa(i)`), `stand`.
  `T.W.phoneClose(st, { draw | feed, tilt })` → a glowing phone in front of a dark bedroom for screen inserts (camera z ≈ 1.75, fov 22–28).
  Props: `T.W.ambulance()`, `T.W.fireTruck()` (front +x, light bar `.bar`), `T.W.ladder({ h })`, `T.W.skateboard()`, `T.W.cake({ candles, icing })`.
- **Catalogue** (engine/catalog.json, 1.0.5): every set, prop, action and effect above with Vietnamese names and aliases, used by
  `tools/set_match.py` before shots are planned (references/set-match.md). `node render.mjs --catalog [id,id]` renders a still per set.
  **Use a catalogue set before writing a project set**; add new engine sets to the catalogue in the same commit.
- Project sets: write `scenes/sets/<name>.js` exporting `function build(T, st, o)` that composes these, so every shot in
  a location uses the same geometry. Invent new props from boxes/cylinders/rounded boxes when the script needs them.

