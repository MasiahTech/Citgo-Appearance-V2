# Citgo AppearanceV2

A modern, full-featured character appearance editor for FiveM (QBCore). Built with a sleek glassmorphic React UI and photo-realistic clothing thumbnails powered by uz_AutoShot.

Replaces illenium-appearance — everything runs from a single resource with full backward compatibility.

![FiveM](https://img.shields.io/badge/FiveM-Cerulean-orange)
![Framework](https://img.shields.io/badge/Framework-QBCore-blue)
![Lua](https://img.shields.io/badge/Lua-5.4-purple)
![React](https://img.shields.io/badge/React-18-61dafb)

---

## Table of Contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Setting Up Photo Thumbnails (uz_AutoShot)](#setting-up-photo-thumbnails-uz_autoshot)
- [Shop Interaction Options](#shop-interaction-options)
- [Configuration](#configuration)
- [Exports & Code Examples](#exports--code-examples)
- [Database Tables](#database-tables)
- [Backward Compatibility (illenium-appearance)](#backward-compatibility-illenium-appearance)
- [Building the UI](#building-the-ui)
- [Tech Stack](#tech-stack)
- [Credits](#credits)

---

## Features

### Clothing & Props
- Visual grid browser with **real photo thumbnails** for every drawable
- Texture variant selector per drawable
- **Hide button** — temporarily hide any clothing piece on the ped to see what's underneath, without changing your selection
- Search by drawable ID
- Virtualized rendering — handles thousands of items without lag

### Hair & Face
- Hair style picker with photo thumbnails
- 64-color hair palette (primary + highlight)
- Head blend (parent shapes, skin tones, mix sliders)
- Full head overlays — eyebrows, facial hair, makeup, blush, lipstick, complexion, blemishes, ageing, and more
- Eye color picker with 32-color palette

### Tattoo Parlor
- One tattoo per body zone (radio-select, not stacking)
- Automatic clothing strip for full visibility
- Cumulative pricing — pay per zone
- Clothing restored on exit

### Outfit System
- Save, load, and delete personal outfits
- Share outfits via short codes — paste a code, get the look
- Job outfits with boss management and minimum grade requirements
- Starter outfits for character creation (admin-manageable via `/starteroutfits`)

### Wardrobe
- Outfits-only view — personal outfits, job outfits, and outfit code import
- No clothing browsing or appearance editing — just pick an outfit and go
- **Job-locked wardrobe locations** — place locker rooms at police stations, hospitals, etc.
- Public wardrobes supported (set `job = nil`)
- Accessible via export: `exports['citgo_AppearanceV2']:openWardrobe()`

### Shop System
- Configurable shop types: Barber, Clothing Store, Plastic Surgeon, Tattoo Parlor
- Per-shop category restrictions and pricing
- Map blips with customizable sprites and colors
- Player invincibility during editing (configurable)

---

## Dependencies

### Required

| Resource | What It Does |
|---|---|
| [qb-core](https://github.com/qbcore-framework/qb-core) | QBCore framework — player data, callbacks, notifications |
| [oxmysql](https://github.com/overextended/oxmysql) | Database — stores appearances, outfits, and outfit codes |
| [ox_lib](https://github.com/overextended/ox_lib) | Shared library — callbacks, notifications, utilities |
| [uz_AutoShot](https://uz-scripts.com/docs/free/uz-autoshot) | Photo thumbnails — takes real screenshots of every clothing item |

### Optional

| Resource | What It Does |
|---|---|
| [core_focus](https://github.com/MasiahTech/core_focus) | Context menus at shop locations (used by default if no ox_lib options are enabled) |
| [ox_target](https://github.com/overextended/ox_target) | 3D targeting zones at shop locations (alternative to core_focus) |

> **You do not need illenium-appearance.** This resource replaces it entirely. See [Backward Compatibility](#backward-compatibility-illenium-appearance) for details.

---

## Installation

### Step 1: Add the Resource

Drop the `citgo_AppearanceV2` folder into your server's resources directory.

### Step 2: Update server.cfg

Add these lines to your `server.cfg`, **after** your framework and dependencies:

```
ensure oxmysql
ensure ox_lib
ensure qb-core
ensure uz_AutoShot
ensure citgo_AppearanceV2
```

If you use core_focus for shop interactions, make sure it starts before citgo_AppearanceV2:

```
ensure core_focus
ensure citgo_AppearanceV2
```

### Step 3: Configure

Open `config.lua` and adjust shop prices, locations, and interaction preferences to your liking. See [Configuration](#configuration) for details.

### Step 4: Generate Photo Thumbnails

The appearance editor shows real in-game photos of every clothing item. You need to generate these photos once using uz_AutoShot. See the next section for a step-by-step guide.

---

## Setting Up Photo Thumbnails (uz_AutoShot)

citgo_AppearanceV2 uses [uz_AutoShot](https://uz-scripts.com/docs/free/uz-autoshot) to display real photo thumbnails of every clothing item, hair style, and facial overlay in the editor. Without these photos, the editor will show placeholder icons instead of previews.

### What You Need

- [uz_AutoShot](https://uz-scripts.com/docs/free/uz-autoshot) installed and running
- [screenshot-basic](https://github.com/citizenfx/screenshot-basic) installed (required by uz_AutoShot)

### Quick Setup

1. Install uz_AutoShot into your resources folder
2. Add to your `server.cfg`:
   ```
   ensure screenshot-basic
   ensure uz_AutoShot
   ```
3. Start your server and join

### Taking Photos

1. Open the chat and type `/shotmaker` to enter the screenshot studio
2. Your character will be teleported to a studio environment with a green screen background
3. Select what you want to capture:
   - **Clothing** — captures all 11 component slots (tops, pants, shoes, etc.) and 5 prop slots (hats, glasses, etc.)
   - **Appearance Overlays** — captures facial overlays (beard, eyebrows, makeup, etc.)
4. Use the camera controls to adjust the angle:
   - **Left Mouse** — rotate around your character
   - **Scroll Wheel** — zoom in and out
   - **W / S** — adjust camera height
   - **Q / E** — adjust field of view
   - **C** — save the current camera angle for that category
   - **R** — reset camera to default
5. Click **Start** to begin the capture process
6. The system will automatically cycle through every drawable and texture variation, taking a screenshot of each one
7. Wait for the batch to complete — this can take a while depending on how many items exist

### Important Notes

- You need to run the capture process **twice** — once as a **male** character and once as a **female** character, so both genders have thumbnails
- Photos are stored locally on your server and served via FiveM's built-in `cfx-nui` protocol — no external hosting needed
- You only need to do this once. If you add new clothing mods later, run `/shotmaker` again to capture the new items
- You can customize the photo format (PNG, WebP, JPG), resolution, and other settings in uz_AutoShot's `Customize.lua`

### Verifying It Worked

After capturing, type `/wardrobe` in chat. This opens uz_AutoShot's built-in clothing browser where you can verify all thumbnails were captured correctly. If photos show up here, they will show up in citgo_AppearanceV2's editor.

---

## Shop Interaction Options

You have **three ways** for players to interact with shops. Choose the one that fits your server:

### Option 1: core_focus (Default)

If you have [core_focus](https://github.com/MasiahTech/core_focus) installed, shop interactions work automatically with no configuration needed. When a player walks near a shop, a context menu appears.

This is the default behavior when all three ox_lib options are set to `false` in your config. If core_focus is not installed and all options are `false`, players can still use the `/appearance` command.

### Option 2: ox_target

Uses [ox_target](https://github.com/overextended/ox_target) 3D targeting zones. Players aim at the shop location to see the interaction option.

```lua
Config.UseOxTarget = true
Config.UseOxRadial = false
Config.UseOxTextUI = false
```

### Option 3: ox_lib TextUI

Shows a "Press E" prompt when players are near a shop, using ox_lib's TextUI system.

```lua
Config.UseOxTarget = false
Config.UseOxRadial = false
Config.UseOxTextUI = true
```

### Option 4: ox_lib Radial Menu

Adds a radial menu option when players are near a shop.

```lua
Config.UseOxTarget = false
Config.UseOxRadial = true
Config.UseOxTextUI = false
```

> **Note:** When any ox_lib option is enabled, core_focus context menus are automatically disabled. Only enable one option at a time.

---

## Configuration

All settings are in `config.lua`.

### General Settings

```lua
Config.Command = 'appearance'        -- Chat command to open the full editor (all categories, free)
Config.SaveToInventory = true         -- Save appearance data to player inventory (requires core_inventory)
Config.InvincibleDuringEditor = true  -- Prevent player damage while editing
Config.OutfitCodeLength = 10          -- Length of generated outfit share codes
Config.AutomaticFade = true           -- Apply hair fade decorations automatically
```

> **Note:** `Config.SaveToInventory` only works if you have **core_inventory** installed. If you do not use core_inventory, set this to `false`.

### Interaction Mode

```lua
Config.UseOxTarget = false   -- Use ox_target sphere zones at shops
Config.UseOxRadial = false   -- Use ox_lib radial menu near shops
Config.UseOxTextUI = false   -- Use ox_lib TextUI "Press E" prompt near shops
-- When all are false, core_focus context menus are used (if installed)
```

### Shop Types

Each shop type defines its price, blip, allowed categories, and locations:

```lua
Config.Shops = {
    barber = {
        label = 'Barber Shop',
        price = 100,                -- Cost to use (cash, falls back to bank)
        blip  = { sprite = 71, color = 0, scale = 0.65, label = 'Barber' },
        icon  = 'fas fa-scissors',  -- Icon for core_focus context menu
        categories = {              -- What players can change at this shop
            'hair',
            'overlay:eyebrows',
            'overlay:beard',
            'overlay:makeUp',
            'overlay:blush',
            'overlay:lipstick',
            'overlay:chestHair',
        },
        locations = {               -- Shop coordinates (vec4: x, y, z, heading)
            vec4(-814.22, -183.7, 37.57, 116.91),
            vec4(136.78, -1708.4, 29.29, 144.19),
            -- Add more locations as needed
        },
    },

    clothing = {
        label = 'Clothing Store',
        price = 100,
        blip  = { sprite = 73, color = 47, scale = 0.65, label = 'Clothing' },
        categories = { 'component', 'prop', 'outfits' },
        locations = { ... },
    },

    surgeon = {
        label = 'Plastic Surgeon',
        price = 100,
        blip  = { sprite = 102, color = 2, scale = 0.65, label = 'Surgeon' },
        categories = { 'pedModel', 'headBlend', 'overlay:moleAndFreckles', 'overlay:complexion', 'overlay:blemishes', 'overlay:bodyBlemishes', 'eyeColor' },
        locations = { ... },
    },

    tattoo = {
        label = 'Tattoo Parlor',
        price = 100,
        blip  = { sprite = 75, color = 1, scale = 0.65, label = 'Tattoo' },
        categories = { 'tattoo' },
        locations = { ... },
    },
}
```

### Wardrobe Locations

Place locker rooms where players can access their outfits. Set `job` to restrict access to a specific job, or `nil` for a public wardrobe:

```lua
Config.Wardrobes = {
    {
        label    = 'LSPD Locker Room',
        job      = 'police',               -- Only police can use this wardrobe (nil = public)
        icon     = 'fas fa-shirt',          -- Icon for context menu / ox_target
        location = vec4(461.74, -998.86, 30.69, 0.0),
    },
    {
        label    = 'EMS Locker Room',
        job      = 'ambulance',
        icon     = 'fas fa-shirt',
        location = vec4(311.98, -595.32, 43.29, 0.0),
    },
}
```

Wardrobe locations use the same interaction method as shops (core_focus, ox_target, ox_radial, or ox_textui).

### Starter Outfits

Default outfits shown during character creation. Admins can manage these in-game via `/starteroutfits`:

```lua
Config.StarterOutfits = {
    male = {
        { name = 'Casual',   components = { [11]={drawable=0,texture=0}, [4]={drawable=0,texture=0}, ... }, props = {} },
        { name = 'Business', components = { ... }, props = {} },
    },
    female = {
        { name = 'Casual',   components = { ... }, props = {} },
    },
}
```

---

## Exports & Code Examples

### Opening the Editor

```lua
-- Open the full appearance editor (all categories, no charge)
-- Use this for admin menus, closets, or custom triggers
exports['citgo_AppearanceV2']:openAppearance()

-- Open a specific shop type (restricted categories, charges the player)
exports['citgo_AppearanceV2']:openAppearance('barber')
exports['citgo_AppearanceV2']:openAppearance('clothing')
exports['citgo_AppearanceV2']:openAppearance('surgeon')
exports['citgo_AppearanceV2']:openAppearance('tattoo')

-- Open the wardrobe (outfits only — personal, job, and import codes)
exports['citgo_AppearanceV2']:openWardrobe()

-- Open character creation editor
exports['citgo_AppearanceV2']:openCharacterCreation()

-- Open the job outfit editor
exports['citgo_AppearanceV2']:openJobOutfitEditor()
```

### Reading Appearance Data

```lua
-- Get the full appearance of a ped (client-side)
local ped = PlayerPedId()
local appearance = exports['citgo_AppearanceV2']:getPedAppearance(ped)

-- appearance contains:
-- {
--     model       = "mp_m_freemode_01",
--     headBlend   = { shapeFirst, shapeSecond, shapeMix, skinFirst, skinSecond, skinMix, ... },
--     faceFeatures = { noseWidth, nosePeakHigh, eyeBrownHigh, ... },
--     headOverlays = { beard = { style, opacity, color }, eyebrows = { ... }, ... },
--     components  = { { component_id = 11, drawable = 5, texture = 0 }, ... },
--     props       = { { prop_id = 0, drawable = 3, texture = 0 }, ... },
--     hair        = { style = 4, color = 0, highlight = 0, texture = 0 },
--     tattoos     = { ZONE_TORSO = { ... }, ZONE_LEFT_ARM = { ... }, ... },
--     eyeColor    = 0,
-- }
```

### Applying Appearance Data

```lua
-- Apply a full appearance to the player ped (client-side)
local ped = PlayerPedId()
exports['citgo_AppearanceV2']:setPedAppearance(ped, appearance)

-- Apply a full appearance including model change
exports['citgo_AppearanceV2']:setPlayerAppearance(appearance)
```

### Individual Setters

```lua
local ped = PlayerPedId()

-- Set a single clothing component
exports['citgo_AppearanceV2']:setPedComponent(ped, { component_id = 11, drawable = 5, texture = 0 })

-- Set a single prop
exports['citgo_AppearanceV2']:setPedProp(ped, { prop_id = 0, drawable = 3, texture = 0 })

-- Set hair
exports['citgo_AppearanceV2']:setPedHair(ped, { style = 4, color = 0, highlight = 0, texture = 0 })

-- Set eye color
exports['citgo_AppearanceV2']:setPedEyeColor(ped, 3)

-- Set head blend
exports['citgo_AppearanceV2']:setPedHeadBlend(ped, {
    shapeFirst = 0, shapeSecond = 0, shapeThird = 0,
    skinFirst = 0, skinSecond = 0, skinThird = 0,
    shapeMix = 0.5, skinMix = 0.5, thirdMix = 0.0
})

-- Set face features
exports['citgo_AppearanceV2']:setPedFaceFeatures(ped, { noseWidth = 0.0, nosePeakHigh = 0.0, ... })

-- Set head overlays
exports['citgo_AppearanceV2']:setPedHeadOverlays(ped, {
    beard = { style = 0, opacity = 1.0, color = 0, secondColor = 0 },
    eyebrows = { style = 0, opacity = 1.0, color = 0, secondColor = 0 },
    ...
})

-- Set tattoos
exports['citgo_AppearanceV2']:setPedTattoos(ped, {
    ZONE_TORSO = { { name = "tattoo_name", collection = "mpairraces_overlays", hashMale = "...", hashFemale = "..." } },
})

-- Change ped model
exports['citgo_AppearanceV2']:setPlayerModel("mp_f_freemode_01")
```

### All Available Exports

#### Editor / Wardrobe

| Export | Description |
|---|---|
| `openAppearance(shopType?)` | Open the appearance editor. Pass a shop type to restrict categories and charge |
| `openWardrobe()` | Open outfits-only view (personal + job outfits + import codes) |
| `openCharacterCreation()` | Open the character creation editor |
| `openJobOutfitEditor()` | Open the job outfit editor |

#### Getters / Setters

| Export | Description |
|---|---|
| `getPedAppearance(ped)` | Get full appearance data from a ped |
| `setPedAppearance(ped, appearance)` | Apply full appearance to a ped |
| `setPlayerAppearance(appearance)` | Change model and apply appearance |
| `getPedModel(ped)` | Get ped model name |
| `getPedComponents(ped)` | Get all clothing components |
| `getPedProps(ped)` | Get all props |
| `getPedHeadBlend(ped)` | Get head blend data |
| `getPedFaceFeatures(ped)` | Get face feature values |
| `getPedHeadOverlays(ped)` | Get head overlay data |
| `getPedHair(ped)` | Get hair data |
| `setPlayerModel(model)` | Change player ped model |
| `setPedHeadBlend(ped, data)` | Set head blend |
| `setPedFaceFeatures(ped, data)` | Set face features |
| `setPedHeadOverlays(ped, data)` | Set head overlays |
| `setPedHair(ped, data)` | Set hair style and color |
| `setPedEyeColor(ped, color)` | Set eye color |
| `setPedComponent(ped, component)` | Set single clothing component |
| `setPedComponents(ped, components)` | Set multiple components |
| `setPedProp(ped, prop)` | Set single prop |
| `setPedProps(ped, props)` | Set multiple props |
| `setPedTattoos(ped, tattoos)` | Set all tattoos |

---

## Database Tables

citgo_AppearanceV2 uses the same database tables as illenium-appearance. If you already had illenium-appearance installed, your existing data will work automatically.

| Table | Purpose |
|---|---|
| `playerskins` | Stores player appearance data (model, skin JSON) |
| `player_outfits` | Saved personal outfits (name, components, props) |
| `player_outfit_codes` | Shareable outfit codes linked to outfits |
| `management_outfits` | Job/gang outfits managed by bosses |

These tables are created automatically by the SQL files included with the original illenium-appearance installation. If you're setting up a fresh server, import the SQL from illenium-appearance's `sql/` folder first.

---

## Backward Compatibility (illenium-appearance)

citgo_AppearanceV2 **fully replaces** illenium-appearance. You can remove illenium-appearance from your server entirely.

### How It Works

The `fxmanifest.lua` includes:

```lua
provide 'illenium-appearance'
```

This tells FiveM that citgo_AppearanceV2 **is** illenium-appearance. Any other resource on your server that calls `exports['illenium-appearance']` will be automatically routed to citgo_AppearanceV2 — no code changes needed in those resources.

### What This Means For You

- **Remove illenium-appearance** from your resources folder and `server.cfg`
- **Do not** `ensure illenium-appearance` — citgo_AppearanceV2 handles everything
- Any resource calling `exports['illenium-appearance']:getPedAppearance()` will continue to work
- Any resource triggering `illenium-appearance:server:saveAppearance` or other events will continue to work
- The same database tables are used, so existing player data is preserved

### Migration Checklist

1. Stop your server
2. Remove `illenium-appearance` from your resources folder
3. Remove `ensure illenium-appearance` from your `server.cfg`
4. Add `ensure citgo_AppearanceV2` to your `server.cfg`
5. Start your server — everything works as before

---

## Commands

| Command | Access | Description |
|---|---|---|
| `/appearance` | Everyone | Opens the full appearance editor (all categories, free) |
| `/starteroutfits` | Admin (ACE restricted) | Opens the starter outfit manager for character creation presets |
| `/joboutfits` | Everyone | Opens the job outfit editor |

### Setting Up Admin Access for /starteroutfits

The `/starteroutfits` command requires the `command` ACE permission. Add the following to your `server.cfg` to grant access:

```cfg
# Grant to a specific player by their license
add_principal identifier.license:xxxxxxxxxxxxxxxxxxxx group.admin
add_ace group.admin command allow

# Or grant to all admins in your QBCore admin group
add_ace group.admin command allow
```

Only players with this permission can create, edit, or delete starter outfits. Regular players will not see or be able to use this command.

---

## Building the UI

A pre-built version is included in `html/build/`. You only need to rebuild if you modify the React source code.

```bash
cd html
npm install
npm run build
```

### Development Mode

```bash
cd html
npm run dev
```

This starts a local dev server with hot reload. The UI runs standalone with mock data — no FiveM needed for frontend development.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game Framework | QBCore (Lua 5.4) |
| Database | oxmysql (MySQL) |
| Shared Library | ox_lib (callbacks, notifications) |
| UI Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 4 + inline glassmorphic styles |
| Icons | lucide-react |
| Virtualization | react-window |
| Font | Inter (Google Fonts) |
| Thumbnails | uz_AutoShot (cfx-nui protocol) |

---

## UI Design

The interface uses a **glassmorphic dark theme** with a monochromatic gray palette and green accent (`#22c55e`). Two translucent panels float over the 3D ped model:

- **Left panel** (260px) — Category sidebar with collapsible sections
- **Right panel** (400px) — Content area with camera controls and action bar
- **Center** — Transparent viewport with orbit camera (drag to rotate, scroll to zoom)

---

## Credits

- **Author:** Citgo
- **UI Design & Development:** Citgo
- **Tattoo data:** Originally from [illenium-appearance](https://github.com/iLLeniumStudios/illenium-appearance) by iLLeniumStudios
- **Photo thumbnails:** Powered by [uz_AutoShot](https://uz-scripts.com/docs/free/uz-autoshot) by UZ Scripts

---

## License

MIT License — see [LICENSE](LICENSE) for details.
