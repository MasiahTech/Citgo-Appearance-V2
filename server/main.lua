-- ── citgo_AppearanceV2 — Server ──────────────────────────────────────────────
-- Self-contained: appearance persistence, outfits, codes, shop charges, starter outfits.

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

-- ── Appearance persistence & outfit management ──────────────────────────────

local outfitCache = {}

local function getOutfitsForPlayer(citizenid)
    outfitCache[citizenid] = {}
    local result = Database.PlayerOutfits.GetAllByCitizenID(citizenid)
    for i = 1, #result do
        outfitCache[citizenid][#outfitCache[citizenid] + 1] = {
            id = result[i].id,
            name = result[i].outfitname,
            model = result[i].model,
            components = json.decode(result[i].components),
            props = json.decode(result[i].props)
        }
    end
end

local function GenerateUniqueCode()
    local code, exists
    repeat
        code = GenerateNanoID(Config.OutfitCodeLength or 10)
        exists = Database.PlayerOutfitCodes.GetByCode(code)
    until not exists
    return code
end

-- Callback handlers

local function handleGenerateOutfitCode(_, outfitID)
    local existingOutfitCode = Database.PlayerOutfitCodes.GetByOutfitID(outfitID)
    if not existingOutfitCode then
        local code = GenerateUniqueCode()
        local id = Database.PlayerOutfitCodes.Add(outfitID, code)
        if not id then
            print("Something went wrong while generating outfit code")
            return
        end
        return code
    end
    return existingOutfitCode.code
end

local function handleImportOutfitCode(src, outfitName, outfitCode)
    local citizenID = Framework.GetPlayerID(src)
    local existingOutfitCode = Database.PlayerOutfitCodes.GetByCode(outfitCode)
    if not existingOutfitCode then return nil end

    local playerOutfit = Database.PlayerOutfits.GetByID(existingOutfitCode.outfitid)
    if not playerOutfit then return end

    if playerOutfit.citizenid == citizenID then return end
    if Database.PlayerOutfits.GetByOutfit(outfitName, citizenID) then return end

    local id = Database.PlayerOutfits.Add(citizenID, outfitName, playerOutfit.model, playerOutfit.components, playerOutfit.props)
    if not id then
        print("Something went wrong while importing the outfit")
        return
    end

    outfitCache[citizenID][#outfitCache[citizenID] + 1] = {
        id = id,
        name = outfitName,
        model = playerOutfit.model,
        components = json.decode(playerOutfit.components),
        props = json.decode(playerOutfit.props)
    }

    return true
end

local function handleGetOutfits(src)
    local citizenID = Framework.GetPlayerID(src)
    if outfitCache[citizenID] == nil then
        getOutfitsForPlayer(citizenID)
    end
    return outfitCache[citizenID]
end

local function handleGetManagementOutfits(src, mType, gender)
    local job = Framework.GetJob(src)
    if mType == "Gang" then
        job = Framework.GetGang(src)
    end

    local grade = tonumber(job.grade.level)
    local managementOutfits = {}
    local result = Database.ManagementOutfits.GetAllByJob(mType, job.name, gender)

    for i = 1, #result do
        if grade >= result[i].minrank then
            managementOutfits[#managementOutfits + 1] = {
                id = result[i].id,
                name = result[i].name,
                model = result[i].model,
                gender = result[i].gender,
                components = json.decode(result[i].components),
                props = json.decode(result[i].props)
            }
        end
    end
    return managementOutfits
end

-- Register under both new and old (illenium-appearance) names for backward compatibility
lib.callback.register("citgo_appearance:server:generateOutfitCode", handleGenerateOutfitCode)
lib.callback.register("illenium-appearance:server:generateOutfitCode", handleGenerateOutfitCode)

lib.callback.register("citgo_appearance:server:importOutfitCode", handleImportOutfitCode)
lib.callback.register("illenium-appearance:server:importOutfitCode", handleImportOutfitCode)

lib.callback.register("citgo_appearance:server:getOutfits", handleGetOutfits)
lib.callback.register("illenium-appearance:server:getOutfits", handleGetOutfits)

lib.callback.register("citgo_appearance:server:getManagementOutfits", handleGetManagementOutfits)
lib.callback.register("illenium-appearance:server:getManagementOutfits", handleGetManagementOutfits)

-- Event handlers

local function handleSaveAppearance(appearance)
    local src = source
    local citizenID = Framework.GetPlayerID(src)
    if appearance ~= nil then
        Framework.SaveAppearance(appearance, citizenID)
    end
end

local function handleSaveOutfit(name, model, components, props)
    local src = source
    local citizenID = Framework.GetPlayerID(src)
    if outfitCache[citizenID] == nil then
        getOutfitsForPlayer(citizenID)
    end
    if model and components and props then
        local id = Database.PlayerOutfits.Add(citizenID, name, model, json.encode(components), json.encode(props))
        if not id then return end
        outfitCache[citizenID][#outfitCache[citizenID] + 1] = {
            id = id,
            name = name,
            model = model,
            components = components,
            props = props
        }
    end
end

local function handleDeleteOutfit(id)
    local src = source
    local citizenID = Framework.GetPlayerID(src)
    Database.PlayerOutfitCodes.DeleteByOutfitID(id)
    Database.PlayerOutfits.DeleteByID(id)

    for k, v in ipairs(outfitCache[citizenID]) do
        if v.id == id then
            table.remove(outfitCache[citizenID], k)
            break
        end
    end
end

local function handleSaveManagementOutfit(outfitData)
    Database.ManagementOutfits.Add(outfitData)
end

local function handleDeleteManagementOutfit(id)
    Database.ManagementOutfits.DeleteByID(id)
end

-- Register under both new and old names
RegisterNetEvent("citgo_appearance:server:saveAppearance", handleSaveAppearance)
RegisterNetEvent("illenium-appearance:server:saveAppearance", handleSaveAppearance)

RegisterNetEvent("citgo_appearance:server:saveOutfit", handleSaveOutfit)
RegisterNetEvent("illenium-appearance:server:saveOutfit", handleSaveOutfit)

RegisterNetEvent("citgo_appearance:server:deleteOutfit", handleDeleteOutfit)
RegisterNetEvent("illenium-appearance:server:deleteOutfit", handleDeleteOutfit)

RegisterNetEvent("citgo_appearance:server:saveManagementOutfit", handleSaveManagementOutfit)
RegisterNetEvent("illenium-appearance:server:saveManagementOutfit", handleSaveManagementOutfit)

RegisterNetEvent("citgo_appearance:server:deleteManagementOutfit", handleDeleteManagementOutfit)
RegisterNetEvent("illenium-appearance:server:deleteManagementOutfit", handleDeleteManagementOutfit)
