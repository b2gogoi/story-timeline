# Story Timeline

Story Timeline is a browser-based React app for presenting a date range as a vertical 9:16 story. An animated timeline moves between a start date, configurable stops, and an end date. The composition can show a calendar ruler, a progress and age counter, and an age-category dial.

## Requirements

- Node.js with npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal. To create and preview a production build:

```sh
npm run build
npm run preview
```

The build script runs the TypeScript compiler in check-only mode before creating the Vite production bundle.

## Using the app

The left panel configures the timeline and its appearance. The preview is displayed in a 9:16 frame.

### Dates and stops

- Set the athlete's date of birth, the timeline start, and the timeline end.
- Edit or remove the intermediate stops, or add a stop.
- Use **even stops** to distribute the selected number of stops evenly between start and end.
- The counter maps the full start-to-end range to 1,000 units.

The initial dates and stops are defined in `src/App.tsx`; changing those values changes the initial story.

### Playback

- **Auto** plays the timeline continuously. Adjust top speed, braking sharpness, and pause duration at each stop.
- **Loop back to start** repeats the plan after the final stop.
- **Manual** moves through the stops with the on-screen Previous and Next buttons or the arrow keys. Playback controls are disabled while manual mode is selected.
- **Restart** resets the timeline clock.
- Press **F** or use **Full screen** to toggle full-screen view. The keyboard shortcut is ignored while typing into a form field.

### Appearance and components

Choose the background colors, split point, and text/tick color. In the Components section, toggle the timeline ruler, units/age counter, or Masters dial. The ruler has additional controls for scroll direction and the number of months visible in the frame.

## How it works

`src/App.tsx` owns the configuration, derives a playback plan from the start, stops, and end dates, and connects the controls and story preview.

`src/lib/timeline.ts` contains date conversion helpers and the pure timeline model. Each leg's duration is based on its date distance, configured speed, and easing power; the plan also includes a hold at each stop. `positionAt` maps elapsed plan time to a date position.

`src/lib/clock.tsx` runs the animation clock with `requestAnimationFrame` and exposes a React context for subscribing to frames and stepping between stops. In automatic mode, it advances through the plan; in manual mode, it eases to the selected stop.

`src/components/Story.tsx` renders the 9:16 composition. The component registry in `src/components/registry.ts` determines which layers appear and their stacking order. Each visual layer subscribes to the shared clock rather than maintaining its own timer.

## Project layout

```text
src/
  App.tsx                 App state, defaults, and overall layout
  main.tsx                React entry point
  index.css               Global styles
  components/
    Controls.tsx          Configuration panel
    Counter.tsx           Units and age display
    MastersDial.tsx       Age-category drum
    Ruler.tsx             Calendar ruler and its controls
    StepControls.tsx      Manual previous/next controls
    Story.tsx             9:16 composition container
    registry.ts           Visual component registry and layer order
    ui.tsx                Shared control primitives
  lib/
    clock.tsx             Shared playback clock and React hooks
    timeline.ts           Date math and playback-plan functions
```

## Adding a visual component

1. Create a component in `src/components` that accepts `ViewProps` from `src/lib/timeline.ts`.
2. Use `useFrame` from `src/lib/clock.tsx` to respond to the shared animation frame. This keeps all layers in sync.
3. Add a new ID to the `ComponentId` union and the corresponding visibility value to the default `show` configuration in `src/App.tsx`.
4. Register the component in `src/components/registry.ts`. The registry entry supplies its ID, label, view, and optional controls. Registry order is stacking order, with later entries rendered above earlier ones.
5. If the component needs settings, add a control component that accepts `ControlProps` and register it as `Controls`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |

There are currently no test or lint scripts in `package.json`.