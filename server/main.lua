-- ── citgo_AppearanceV2 — Server ──────────────────────────────────────────────
-- Outfit saving/loading/codes handled by illenium-appearance (SQL).
-- This file handles: shop charges, starter outfit admin management.

local QBCore = exports['qb-core']:GetCoreObject()

-- ── Shop charge ─────────────────────────────────────────────────────────────

RegisterNetEvent('citgo_appearance:chargePlayer')
AddEventHandler('citgo_appearance:chargePlayer', function(shopType, tattooZoneCount)
    local src    = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local shop = Config.Shops and Config.Shops[shopType]
    if not shop or not shop.price or shop.price <= 0 then return end

    -- Tattoo shops charge per zone with a selected tattoo
    local price = shop.price
    if shopType == 'tattoo' and type(tattooZoneCount) == 'number' and tattooZoneCount > 0 then
        price = shop.price * tattooZoneCount
    end
    if Player.PlayerData.money['cash'] >= price then
        Player.Functions.RemoveMoney('cash', price, 'appearance-shop-' .. (shopType or 'unknown'))
    elseif Player.PlayerData.money['bank'] >= price then
        Player.Functions.RemoveMoney('bank', price, 'appearance-shop-' .. (shopType or 'unknown'))
    else
        TriggerClientEvent('citgo_appearance:chargeResult', src, false)
        return
    end

    TriggerClientEvent('citgo_appearance:chargeResult', src, true)
end)

-- ── Commands (server-side to avoid production mode restrictions) ────────────

RegisterCommand(Config.Command, function(source)
    TriggerClientEvent('citgo_appearance:openEditor', source)
end, false)

RegisterCommand('starteroutfits', function(source)
    TriggerClientEvent('citgo_appearance:openStarterOutfitAdmin', source)
end, true)

RegisterCommand('joboutfits', function(source)
    TriggerClientEvent('citgo_appearance:openJobOutfitEditor', source)
end, false)

-- ── Starter outfit management (admin) ───────────────────────────────────────

RegisterNetEvent('citgo_appearance:saveStarterOutfit')
AddEventHandler('citgo_appearance:saveStarterOutfit', function(data)
    local src = source
    if not IsPlayerAceAllowed(src, 'command') then return end

    local gender = data.gender or 'male'
    if not Config.StarterOutfits then Config.StarterOutfits = {} end
    if not Config.StarterOutfits[gender] then Config.StarterOutfits[gender] = {} end

    local outfit = {
        name       = data.name or ('Outfit #' .. (#Config.StarterOutfits[gender] + 1)),
        components = data.components or {},
        props      = data.props      or {},
    }
    Config.StarterOutfits[gender][#Config.StarterOutfits[gender] + 1] = outfit

    -- Persist to KVP so it survives restarts
    SetResourceKvp('starterOutfits_' .. gender, json.encode(Config.StarterOutfits[gender]))

    -- Send updated list back to client
    TriggerClientEvent('citgo_appearance:starterOutfitsUpdated', src, gender, Config.StarterOutfits[gender])
end)

RegisterNetEvent('citgo_appearance:deleteStarterOutfit')
AddEventHandler('citgo_appearance:deleteStarterOutfit', function(data)
    local src = source
    if not IsPlayerAceAllowed(src, 'command') then return end

    local gender = data.gender or 'male'
    local index  = tonumber(data.index)
    if not Config.StarterOutfits or not Config.StarterOutfits[gender] then return end
    if not index or index < 1 or index > #Config.StarterOutfits[gender] then return end

    table.remove(Config.StarterOutfits[gender], index)
    SetResourceKvp('starterOutfits_' .. gender, json.encode(Config.StarterOutfits[gender]))

    TriggerClientEvent('citgo_appearance:starterOutfitsUpdated', src, gender, Config.StarterOutfits[gender])
end)

-- ── Provide starter outfits to client on request ────────────────────────────

QBCore.Functions.CreateCallback('citgo_appearance:getStarterOutfits', function(source, cb, gender)
    local outfits = Config.StarterOutfits and Config.StarterOutfits[gender] or {}
    cb(outfits)
end)

-- ── Load KVP-saved starter outfits on start ─────────────────────────────────

CreateThread(function()
    for _, gender in ipairs({'male', 'female'}) do
        local stored = GetResourceKvpString('starterOutfits_' .. gender)
        if stored then
            local decoded = json.decode(stored)
            if decoded then
                Config.StarterOutfits[gender] = decoded
            end
        end
    end
end)
