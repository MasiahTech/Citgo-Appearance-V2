# Citgo AppearanceV2

https://any.coop/A7o2mz4pV3YKNB62EUDwKKFD3Sc9KgDUEM7CnHWz29LS8rNW/citgo-appearance-v2-documentation-and-integration-guide <<< DETAILED DCOUMENTATION

A modern, full-featured character appearance editor for FiveM (QBCore). Built with a sleek glassmorphic React UI and photo-realistic clothing thumbnails powered by uz_AutoShot.

![FiveM](https://img.shields.io/badge/FiveM-Cerulean-orange)
![Framework](https://img.shields.io/badge/Framework-QBCore-blue)
![Lua](https://img.shields.io/badge/Lua-5.4-purple)
![React](https://img.shields.io/badge/React-18-61dafb)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

**Clothing & Props**
- Visual grid browser with photo thumbnails for every drawable
- Texture variant selector per drawable
- Search by drawable ID
- Virtualized rendering — handles thousands of items without lag

**Hair & Face**
- Hair style picker with photo thumbnails
- 64-color hair palette (primary + highlight)
- Head blend (parent shapes, skin tones, mix sliders)
- Full head overlays — eyebrows, facial hair, makeup, blush, lipstick, complexion, blemishes, ageing, and more
- Eye color picker with 32-color palette

**Tattoo Parlor**
- One tattoo per body zone (radio-select, not stacking)
- Automatic clothing strip for full visibility
- Cumulative pricing — pay per zone
- Clothing restored on exit

**Outfit System**
- Save, load, and delete personal outfits
- Share outfits via short codes — paste a code, get the look
- Job outfits with boss management and minimum grade requirements
- Starter outfits for character creation (admin-manageable via `/starteroutfits`)

**Shop System**
- Configurable shop types: Barber, Clothing Store, Plastic Surgeon, Tattoo Parlor
- Per-shop category restrictions and pricing
- Blip integration with customizable sprites and colors
- Player invincibility during editing (configurable)

**Integration Options**
- `core_focus` context menus (default)
- `ox_target` sphere zones (optional)
- `ox_lib` radial menu (optional)
- `ox_lib` TextUI prompts (optional)

---

## Dependencies

| Resource | Purpose |
|---|---|
| [qb-core](https://github.com/qbcore-framework/qb-core) | Framework — callbacks, player data, notifications |
| [illenium-appearance](https://github.com/iLLeniumStudios/illenium-appearance) | Backend — ped appearance get/set, outfit SQL, tattoo data |
| [uz_AutoShot](https://github.com/Uz-Developers/uz_AutoShot) | Photo thumbnails for clothing, hair, and overlays |
| [ox_lib](https://github.com/overextended/ox_lib) | Optional — target zones, radial menu, TextUI |
| [core_focus](https://github.com/CornerCityRP/core_focus) | Optional — context menu at shop locations (default) |

---

## Installation

1. Drop `citgo_AppearanceV2` into your resources folder
2. Add `ensure citgo_AppearanceV2` to your `server.cfg` (after dependencies)
3. Configure `config.lua` to your liking

### Building the UI (optional — pre-built included)

```bash
cd html
npm install
npm run build
```

---

## Configuration

```lua
Config.Command = 'appearance'        -- Admin command to open full editor
Config.SaveToInventory = true         -- Save appearance to player inventory
Config.InvincibleDuringEditor = true  -- Players can't be killed while editing

-- Optional ox_lib integration (all disabled by default)
Config.UseOxTarget = false   -- ox_target sphere zones at shops
Config.UseOxRadial = false   -- Radial menu option near shops
Config.UseOxTextUI = false   -- TextUI "Press E" prompt near shops
```

When any `ox_lib` option is enabled, `core_focus` context menus are automatically disabled.

### Shop Types

Each shop defines its own price, blip, allowed categories, and locations:

```lua
Config.Shops = {
    barber = {
        label = 'Barber Shop',
        price = 100,
        blip  = { sprite = 71, color = 0, scale = 0.65, label = 'Barber' },
        categories = { 'hair', 'overlay:eyebrows', 'overlay:beard', ... },
        locations = { vec4(-814.22, -183.7, 37.57, 116.91), ... },
    },
    clothing = { ... },
    surgeon  = { ... },
    tattoo   = { ... },
}
```

### Starter Outfits

Default outfits shown during character creation. Admins can manage these in-game via `/starteroutfits`:

```lua
Config.StarterOutfits = {
    male = {
        { name = 'Casual', components = { [11]={drawable=0,texture=0}, ... }, props = {} },
    },
    female = { ... },
}
```

---

## Exports

### Client Exports

```lua
-- Open the full appearance editor (all categories, no charge)
exports['citgo_AppearanceV2']:openEditor()

-- Open a specific shop type (restricted categories, charges player)
exports['citgo_AppearanceV2']:openShop('barber')
exports['citgo_AppearanceV2']:openShop('clothing')
exports['citgo_AppearanceV2']:openShop('surgeon')
exports['citgo_AppearanceV2']:openShop('tattoo')
exports['citgo_AppearanceV2']:openShop('tattoo')
exports['citgo_AppearanceV2']:openCharacterCreation()
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game Framework | QBCore (Lua 5.4) |
| UI Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 4 + inline styles |
| Icons | lucide-react |
| Virtualization | react-window |
| Font | Inter (Google Fonts) |
| Design | Glassmorphic dark theme, monochromatic palette |

---

## UI Design

The interface follows a **glassmorphic dark theme** with a monochromatic gray palette and green accent (`#22c55e`). Two translucent panels float over the 3D ped model:

- **Left panel** (260px) — Category sidebar with collapsible sections
- **Right panel** (400px) — Content area with camera controls and action bar
- **Center** — Transparent viewport with orbit camera (drag to rotate, scroll to zoom)

All panels use `backdrop-filter: blur(24px)` over a semi-transparent black background. Typography uses Inter at small sizes (9–16px) for a compact, information-dense feel.

> Full design system documentation is maintained internally for consistency across future scripts.

---

## Credits

- **Author:** Citgo
- **UI Design & Development:** Citgo
- **Tattoo data:** Sourced from [illenium-appearance](https://github.com/iLLeniumStudios/illenium-appearance)
- **Photo thumbnails:** Powered by [uz_AutoShot](https://github.com/Uz-Developers/uz_AutoShot)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
