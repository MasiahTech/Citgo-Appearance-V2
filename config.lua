if not Config then Config = {} end

Config.Command = 'appearance'
Config.SaveToInventory = true
Config.InvincibleDuringEditor = true

-- ── Optional ox_lib integration (all disabled by default) ───────────────────
Config.UseOxTarget  = false  -- Use ox_target zones at shop locations
Config.UseOxRadial  = false  -- Add radial menu option when near a shop
Config.UseOxTextUI  = false  -- Show TextUI prompt when near a shop (press E to open)

-- GTA component slots shown as clothing categories (GTA component IDs 0-11)
Config.Components = {
    { id = 11, label = 'Tops',        icon = 'Shirt'        },
    { id = 8,  label = 'Undershirt',  icon = 'Shirt'        },
    { id = 4,  label = 'Pants',       icon = 'Shirt'        },
    { id = 6,  label = 'Shoes',       icon = 'Footprints'   },
    { id = 3,  label = 'Torso',       icon = 'Shirt'        },
    { id = 5,  label = 'Bag',         icon = 'ShoppingBag'  },
    { id = 9,  label = 'Vest',        icon = 'Shield'       },
    { id = 10, label = 'Decals',      icon = 'Paintbrush'   },
    { id = 1,  label = 'Mask',        icon = 'HardHat'      },
    { id = 7,  label = 'Accessories', icon = 'Gem'          },
}

Config.Props = {
    { id = 0, label = 'Hat',       icon = 'HardHat' },
    { id = 1, label = 'Glasses',   icon = 'Glasses' },
    { id = 2, label = 'Earrings',  icon = 'Ear'     },
    { id = 6, label = 'Watch',     icon = 'Watch'   },
    { id = 7, label = 'Bracelet',  icon = 'Gem'     },
}

-- Starter outfits shown during character creation (per gender)
-- Admins can manage these via /starteroutfits command
Config.StarterOutfits = {
    male = {
        { name = 'Casual',   components = { [11]={drawable=0,texture=0}, [4]={drawable=0,texture=0}, [6]={drawable=1,texture=0}, [3]={drawable=0,texture=0}, [8]={drawable=15,texture=0} }, props = {} },
        { name = 'Business', components = { [11]={drawable=4,texture=0}, [4]={drawable=10,texture=0}, [6]={drawable=10,texture=0}, [3]={drawable=4,texture=0}, [8]={drawable=15,texture=0} }, props = {} },
        { name = 'Street',   components = { [11]={drawable=15,texture=0}, [4]={drawable=4,texture=0}, [6]={drawable=6,texture=0}, [3]={drawable=11,texture=0}, [8]={drawable=15,texture=0} }, props = {} },
    },
    female = {
        { name = 'Casual',   components = { [11]={drawable=0,texture=0}, [4]={drawable=0,texture=0}, [6]={drawable=1,texture=0}, [3]={drawable=0,texture=0}, [8]={drawable=2,texture=0} }, props = {} },
        { name = 'Business', components = { [11]={drawable=7,texture=0}, [4]={drawable=3,texture=0}, [6]={drawable=3,texture=0}, [3]={drawable=3,texture=0}, [8]={drawable=2,texture=0} }, props = {} },
        { name = 'Street',   components = { [11]={drawable=3,texture=0}, [4]={drawable=1,texture=0}, [6]={drawable=5,texture=0}, [3]={drawable=5,texture=0}, [8]={drawable=2,texture=0} }, props = {} },
    },
}

-- ── Shop System ──────────────────────────────────────────────────────────────
-- Each shop type defines: price, blip, allowed categories, and locations.
-- The /appearance command opens ALL categories for free (admin/closet mode).
-- Shops opened via core_focus charge the player and restrict categories.

Config.Shops = {
    barber = {
        label = 'Barber Shop',
        price = 100,
        blip  = { sprite = 71, color = 0, scale = 0.65, label = 'Barber' },
        icon  = 'fas fa-scissors',
        categories = {
            'hair',
            'overlay:eyebrows',
            'overlay:beard',
            'overlay:makeUp',
            'overlay:blush',
            'overlay:lipstick',
            'overlay:chestHair',
        },
        locations = {
            vec4(-814.22, -183.7, 37.57, 116.91),
            vec4(136.78, -1708.4, 29.29, 144.19),
            vec4(-1282.57, -1116.84, 6.99, 89.25),
            vec4(1931.41, 3729.73, 32.84, 212.08),
            vec4(1212.8, -472.9, 65.2, 60.94),
            vec4(-32.9, -152.3, 56.1, 335.22),
            vec4(-278.1, 6228.5, 30.7, 49.32),
        },
    },

    surgeon = {
        label = 'Plastic Surgeon',
        price = 100,
        blip  = { sprite = 102, color = 2, scale = 0.65, label = 'Surgeon' },
        icon  = 'fas fa-syringe',
        categories = {
            'pedModel',
            'headBlend',
            'overlay:moleAndFreckles',
            'overlay:complexion',
            'overlay:blemishes',
            'overlay:bodyBlemishes',
            'eyeColor',
        },
        locations = {
            vec4(298.78, -572.81, 43.26, 114.27),
        },
    },

    clothing = {
        label = 'Clothing Store',
        price = 100,
        blip  = { sprite = 73, color = 47, scale = 0.65, label = 'Clothing' },
        icon  = 'fas fa-shirt',
        categories = {
            'component',
            'prop',
            'outfits',
        },
        locations = {
            vec4(1693.2, 4828.11, 42.07, 188.66),
            vec4(-705.5, -149.22, 37.42, 122.0),
            vec4(-1192.61, -768.4, 17.32, 216.6),
            vec4(425.91, -801.03, 29.49, 177.79),
            vec4(-168.73, -301.41, 39.73, 238.67),
            vec4(75.39, -1398.28, 29.38, 6.73),
            vec4(-827.39, -1075.93, 11.33, 294.31),
            vec4(-1445.86, -240.78, 49.82, 36.17),
            vec4(9.22, 6515.74, 31.88, 131.27),
            vec4(615.35, 2762.72, 42.09, 170.51),
            vec4(1191.61, 2710.91, 38.22, 269.96),
            vec4(-3171.32, 1043.56, 20.86, 334.3),
            vec4(-1105.52, 2707.79, 19.11, 317.19),
            vec4(-1119.24, -1440.6, 5.23, 300.5),
            vec4(124.82, -224.36, 54.56, 335.41),
        },
    },

    tattoo = {
        label = 'Tattoo Parlor',
        price = 100,
        blip  = { sprite = 75, color = 1, scale = 0.65, label = 'Tattoo' },
        icon  = 'fas fa-pen-nib',
        categories = { 'tattoo' },
        locations = {
            vec4(1322.6, -1651.9, 51.2, 42.47),
            vec4(-1154.01, -1425.31, 4.95, 23.21),
            vec4(322.62, 180.34, 103.59, 156.2),
            vec4(-3169.52, 1074.86, 20.83, 253.29),
            vec4(1864.1, 3747.91, 33.03, 17.23),
            vec4(-294.24, 6200.12, 31.49, 195.72),
        },
    },
}
