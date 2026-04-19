-- ── citgo_AppearanceV2 — Client ─────────────────────────────────────────────
local QBCore = exports['qb-core']:GetCoreObject()

local originalAppearance = nil
local isOpen         = false
local activeShopType = nil   -- nil = free/command mode, 'barber'/'surgeon'/'clothing'/'tattoo'
local activeMode     = nil   -- nil = normal, 'characterCreation', 'jobOutfitEditor', 'starterOutfitAdmin'
local currentGender  = 'male'

-- ── Orbit camera ─────────────────────────────────────────────────────────────
local cam, camAngleH, camDist, camOffsetZ = nil, 0.0, 2.8, 0.5

local function updateCam()
    if not cam then return end
    local ped = PlayerPedId()
    if not DoesEntityExist(ped) then return end
    local pc  = GetEntityCoords(ped)
    local rad = math.rad(camAngleH)
    SetCamCoord(cam, pc.x + camDist * math.sin(rad), pc.y + camDist * math.cos(rad), pc.z + camOffsetZ)
    PointCamAtCoord(cam, pc.x, pc.y, pc.z + camOffsetZ)
end

local function createCam()
    cam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
    SetCamActive(cam, true)
    RenderScriptCams(true, true, 500, true, true)
    updateCam()
end

local function destroyCam()
    if cam then
        RenderScriptCams(false, true, 500, true, true)
        DestroyCam(cam, true)
        cam = nil
    end
end

-- ── Build slot metadata ──────────────────────────────────────────────────────
local function buildSlots(ped, appearance)
    local slots = { components = {}, props = {} }

    local compLookup = {}
    if appearance.components then
        for _, c in ipairs(appearance.components) do
            compLookup[c.component_id] = { drawable = c.drawable, texture = c.texture }
        end
    end
    for _, comp in ipairs(Config.Components) do
        local id = comp.id
        local numDrawables = GetNumberOfPedDrawableVariations(ped, id)
        local cur = compLookup[id] or { drawable = 0, texture = 0 }
        local numTextures = {}
        for d = 0, numDrawables - 1 do
            numTextures[tostring(d)] = GetNumberOfPedTextureVariations(ped, id, d)
        end
        slots.components[#slots.components + 1] = {
            id = id, label = comp.label, icon = comp.icon,
            numDrawables = numDrawables, numTextures = numTextures, current = cur,
        }
    end

    local propLookup = {}
    if appearance.props then
        for _, p in ipairs(appearance.props) do
            propLookup[p.prop_id] = { drawable = p.drawable, texture = p.texture }
        end
    end
    for _, prop in ipairs(Config.Props) do
        local id = prop.id
        local numDrawables = GetNumberOfPedPropDrawableVariations(ped, id)
        local cur = propLookup[id] or { drawable = -1, texture = 0 }
        local numTextures = {}
        for d = 0, numDrawables - 1 do
            numTextures[tostring(d)] = GetNumberOfPedPropTextureVariations(ped, id, d)
        end
        slots.props[#slots.props + 1] = {
            id = id, label = prop.label, icon = prop.icon,
            numDrawables = numDrawables, numTextures = numTextures, current = cur,
        }
    end

    slots.hairDrawables = GetNumberOfPedDrawableVariations(ped, 2)
    return slots
end

-- ── Outfit helpers (must be defined before openEditor) ──────────────────────

local function convertOutfits(illeniumOutfits)
    local result = {}
    for _, o in ipairs(illeniumOutfits or {}) do
        local comps = {}
        for _, c in ipairs(o.components or {}) do
            comps[tostring(c.component_id)] = { drawable = c.drawable, texture = c.texture }
        end
        local props = {}
        for _, p in ipairs(o.props or {}) do
            props[tostring(p.prop_id)] = { drawable = p.drawable, texture = p.texture }
        end
        result[#result + 1] = { id = o.id, name = o.name, components = comps, props = props }
    end
    return result
end

local function toCompArray(map)
    local arr = {}
    for id, val in pairs(map or {}) do
        arr[#arr + 1] = { component_id = tonumber(id), drawable = val.drawable or 0, texture = val.texture or 0 }
    end
    return arr
end

local function toPropArray(map)
    local arr = {}
    for id, val in pairs(map or {}) do
        arr[#arr + 1] = { prop_id = tonumber(id), drawable = val.drawable or -1, texture = val.texture or 0 }
    end
    return arr
end

local function pushOutfitsToNUI()
    if not isOpen then return end
    local gender = currentGender
    lib.callback('citgo_appearance:server:getOutfits', false, function(outfits)
        if not isOpen then return end
        -- Filter outfits by current gender (illenium stores model hash)
        local maleHash   = GetHashKey('mp_m_freemode_01')
        local femaleHash = GetHashKey('mp_f_freemode_01')
        local filtered = {}
        for _, o in ipairs(outfits or {}) do
            local isMaleOutfit = (o.model == maleHash)
            if (gender == 'male' and isMaleOutfit) or (gender == 'female' and not isMaleOutfit) then
                filtered[#filtered + 1] = o
            end
        end
        SendNUIMessage({
            type       = 'outfits',
            outfits    = convertOutfits(filtered),
        })
    end)
end

local function pushJobOutfitsToNUI()
    if not isOpen then return end
    local PlayerData = QBCore.Functions.GetPlayerData()
    local job = PlayerData.job
    if not job or job.name == 'unemployed' then
        SendNUIMessage({ type = 'jobOutfits', jobOutfits = {}, isBoss = false })
        return
    end
    local gender = currentGender == 'male' and 'Male' or 'Female'
    lib.callback('citgo_appearance:server:getManagementOutfits', false, function(outfits)
        if not isOpen then return end
        SendNUIMessage({
            type       = 'jobOutfits',
            jobOutfits = convertOutfits(outfits or {}),
            isBoss     = job.isboss or false,
            jobName    = job.name,
            jobLabel   = job.label,
        })
    end, 'Job', gender)
end

-- ── Clothing strip/restore for tattoo parlor ────────────────────────────────

local savedClothing = nil

local function stripClothing(ped)
    savedClothing = {}
    for i = 0, 11 do
        savedClothing[i] = {
            drawable = GetPedDrawableVariation(ped, i),
            texture  = GetPedTextureVariation(ped, i),
        }
    end
    SetPedComponentVariation(ped, 11, 15, 0, 0) -- jacket: bare
    SetPedComponentVariation(ped, 8,  15, 0, 0) -- undershirt: bare
    SetPedComponentVariation(ped, 3,  15, 0, 0) -- torso: bare
    SetPedComponentVariation(ped, 4,  61, 0, 0) -- pants: shorts
    SetPedComponentVariation(ped, 6,   1, 0, 0) -- shoes: basic
    SetPedComponentVariation(ped, 1,   0, 0, 0) -- mask: none
    SetPedComponentVariation(ped, 5,   0, 0, 0) -- bag: none
    SetPedComponentVariation(ped, 7,   0, 0, 0) -- accessories: none
    SetPedComponentVariation(ped, 9,   0, 0, 0) -- vest: none
    SetPedComponentVariation(ped, 10,  0, 0, 0) -- decals: none
end

local function restoreClothing(ped)
    if not savedClothing then return end
    for i = 0, 11 do
        local c = savedClothing[i]
        if c then SetPedComponentVariation(ped, i, c.drawable, c.texture, 0) end
    end
    savedClothing = nil
end

-- ── Open editor (shared by command + shops + exports) ───────────────────────

local function openEditor(shopType, editorMode)
    if isOpen then return end
    local ped = PlayerPedId()

    originalAppearance = AppearanceLib.getPedAppearance(ped)
    local slots  = buildSlots(ped, originalAppearance)
    local gender = IsPedMale(ped) and 'male' or 'female'
    currentGender = gender

    camAngleH  = GetEntityHeading(ped)
    camDist    = 2.8
    camOffsetZ = 0.5

    activeShopType = shopType or nil
    activeMode     = editorMode or nil

    -- Strip clothing for tattoo parlor so tattoos are visible
    if shopType == 'tattoo' then
        stripClothing(ped)
    end

    local shop = shopType and Config.Shops[shopType]

    -- Determine categories based on mode
    local categories = shop and shop.categories or nil
    if editorMode == 'characterCreation' then
        categories = {
            'hair', 'headBlend',
            'overlay:eyebrows', 'overlay:beard', 'overlay:makeUp', 'overlay:blush',
            'overlay:lipstick', 'overlay:complexion', 'overlay:moleAndFreckles',
            'overlay:ageing', 'overlay:sunDamage', 'overlay:blemishes',
            'overlay:chestHair', 'overlay:bodyBlemishes',
            'eyeColor', 'pedModel', 'starterOutfits',
        }
    elseif editorMode == 'starterOutfitAdmin' then
        categories = { 'component', 'prop', 'starterOutfits' }
    elseif editorMode == 'wardrobe' then
        categories = { 'outfits' }
    end

    -- Fetch starter outfits from server (server holds KVP-persisted data)
    local starterOutfits = nil
    if not categories or editorMode == 'characterCreation' or editorMode == 'starterOutfitAdmin' then
        QBCore.Functions.TriggerCallback('citgo_appearance:getStarterOutfits', function(outfits)
            starterOutfits = outfits or {}
        end, gender)
        while starterOutfits == nil do Wait(0) end
    end

    isOpen = true
    if Config.InvincibleDuringEditor then
        SetEntityInvincible(ped, true)
    end
    exports['ZSX_UIV2']:HideInterface(true)
    createCam()
    SetNuiFocus(true, true)
    SendNUIMessage({
        type           = 'open',
        gender         = gender,
        appearance     = originalAppearance,
        slots          = slots,
        shopType       = shopType or nil,
        shopLabel      = shop and shop.label or nil,
        shopPrice      = shop and shop.price or nil,
        categories     = categories,
        editorMode     = editorMode or nil,
        starterOutfits = starterOutfits,
    })

    -- Push outfits based on mode
    if not editorMode or editorMode == nil then
        pushOutfitsToNUI()
        pushJobOutfitsToNUI()
    elseif editorMode == 'wardrobe' then
        pushOutfitsToNUI()
        pushJobOutfitsToNUI()
    elseif editorMode == 'jobOutfitEditor' then
        pushJobOutfitsToNUI()
    end
end

-- ── Exports ─────────────────────────────────────────────────────────────────

exports('openAppearance', function(shopType)
    openEditor(shopType or nil)
end)

exports('openCharacterCreation', function()
    openEditor(nil, 'characterCreation')
end)

exports('openJobOutfitEditor', function()
    openEditor(nil, 'jobOutfitEditor')
end)

exports('openWardrobe', function()
    openEditor(nil, 'wardrobe')
end)

-- ── Command events (triggered from server-side RegisterCommand) ─────────────

RegisterNetEvent('citgo_appearance:openEditor', function()
    openEditor(nil)
end)

RegisterNetEvent('citgo_appearance:openStarterOutfitAdmin', function()
    openEditor(nil, 'starterOutfitAdmin')
end)

RegisterNetEvent('citgo_appearance:openJobOutfitEditor', function()
    openEditor(nil, 'jobOutfitEditor')
end)

-- ── Character creation hook ─────────────────────────────────────────────────

RegisterNetEvent('qb-clothes:client:CreateFirstCharacter', function()
    openEditor(nil, 'characterCreation')
end)

-- ── Live preview NUI callbacks ───────────────────────────────────────────────

RegisterNUICallback('applyComponent', function(data, cb)
    local ped = PlayerPedId()
    local id = tonumber(data.id)
    if id and id >= 0 and id <= 11 then
        SetPedComponentVariation(ped, id, tonumber(data.drawable) or 0, tonumber(data.texture) or 0, 0)
    end
    cb('ok')
end)

RegisterNUICallback('applyProp', function(data, cb)
    local ped = PlayerPedId()
    local id  = tonumber(data.id)
    local d   = tonumber(data.drawable) or 0
    if id then
        if d < 0 then ClearPedProp(ped, id)
        else SetPedPropIndex(ped, id, d, tonumber(data.texture) or 0, true) end
    end
    cb('ok')
end)

RegisterNUICallback('applyHair', function(data, cb)
    local ped = PlayerPedId()
    SetPedHairColor(ped, tonumber(data.color) or 0, tonumber(data.highlight) or 0)
    if data.style ~= nil then
        SetPedComponentVariation(ped, 2, tonumber(data.style) or 0, 0, 0)
    end
    cb('ok')
end)

RegisterNUICallback('applyBlend', function(data, cb)
    SetPedHeadBlendData(PlayerPedId(),
        tonumber(data.shapeFirst) or 0, tonumber(data.shapeSecond) or 0, 0,
        tonumber(data.skinFirst) or 0, tonumber(data.skinSecond) or 0, 0,
        tonumber(data.shapeMix) or 0.0, tonumber(data.skinMix) or 0.0, 0.0, false)
    cb('ok')
end)

local OVERLAY_INDICES = {
    blemishes = 0, beard = 1, eyebrows = 2, ageing = 3, makeUp = 4, blush = 5,
    complexion = 6, sunDamage = 7, lipstick = 8, moleAndFreckles = 9, chestHair = 10, bodyBlemishes = 11,
}

RegisterNUICallback('applyOverlay', function(data, cb)
    local ped = PlayerPedId()
    local idx = OVERLAY_INDICES[data.name]
    if idx then
        local opacity = math.min(0.999, tonumber(data.opacity) or 0.0)
        SetPedHeadOverlay(ped, idx, tonumber(data.style) or 0, opacity)
        local ct = 1
        if data.name == 'blush' or data.name == 'lipstick' or data.name == 'makeUp' then ct = 2 end
        SetPedHeadOverlayColor(ped, idx, ct, tonumber(data.color) or 0, tonumber(data.secondColor) or 0)
    end
    cb('ok')
end)

RegisterNUICallback('applyEyeColor', function(data, cb)
    SetPedEyeColor(PlayerPedId(), tonumber(data.value) or 0)
    cb('ok')
end)

-- ── Tattoo NUI callbacks ────────────────────────────────────────────────────

RegisterNUICallback('getTattooData', function(_, cb)
    local ped    = PlayerPedId()
    local isMale = currentGender == 'male'
    local appearance = AppearanceLib.getPedAppearance(ped) or {}
    local currentTattoos = appearance.tattoos or {}

    local zones = {}
    for zoneName, tattooList in pairs(Config.Tattoos or {}) do
        if zoneName ~= 'ZONE_HAIR' then
            local filtered = {}
            for _, t in ipairs(tattooList) do
                local hash = isMale and t.hashMale or t.hashFemale
                if hash and hash ~= '' then
                    local applied = false
                    if currentTattoos[zoneName] then
                        for _, ct in ipairs(currentTattoos[zoneName]) do
                            if ct.name == t.name then applied = true; break end
                        end
                    end
                    filtered[#filtered + 1] = {
                        name       = t.name,
                        label      = t.label,
                        zone       = zoneName,
                        collection = t.collection,
                        hash       = hash,
                        applied    = applied,
                    }
                end
            end
            if #filtered > 0 then
                zones[zoneName] = filtered
            end
        end
    end
    cb({ zones = zones })
end)

RegisterNUICallback('applyTattooPreview', function(data, cb)
    local ped = PlayerPedId()
    ClearPedDecorations(ped)
    for _, tattoo in ipairs(data.tattoos or {}) do
        AddPedDecorationFromHashes(ped,
            GetHashKey(tattoo.collection),
            GetHashKey(tattoo.hash))
    end
    cb('ok')
end)

-- ── Camera NUI callbacks ─────────────────────────────────────────────────────

RegisterNUICallback('rotateCamera', function(data, cb)
    camAngleH = camAngleH + ((data.deltaX or 0) * 0.35); updateCam(); cb('ok')
end)

RegisterNUICallback('zoomCamera', function(data, cb)
    camDist = math.max(0.4, math.min(7.0, camDist + (data.delta or 0) * 0.2)); updateCam(); cb('ok')
end)

RegisterNUICallback('adjustCamHeight', function(data, cb)
    camOffsetZ = math.max(-0.6, math.min(2.0, camOffsetZ + (data.delta or 0) * 0.05)); updateCam(); cb('ok')
end)

RegisterNUICallback('setCameraPreset', function(data, cb)
    local p = data.preset
    if     p == 'face'  then camDist = 0.9;  camOffsetZ = 0.65
    elseif p == 'chest' then camDist = 1.55; camOffsetZ = 0.42
    elseif p == 'full'  then camDist = 2.8;  camOffsetZ = 0.50
    elseif p == 'feet'  then camDist = 1.8;  camOffsetZ = -0.10
    elseif p == 'reset' then camAngleH = GetEntityHeading(PlayerPedId()); camDist = 2.8; camOffsetZ = 0.50
    end
    updateCam(); cb('ok')
end)

RegisterNUICallback('resetCamera', function(_, cb)
    camAngleH = GetEntityHeading(PlayerPedId()); camDist = 2.8; camOffsetZ = 0.50; updateCam(); cb('ok')
end)

-- ── Confirm / Cancel ─────────────────────────────────────────────────────────

local function closeEditor()
    isOpen = false
    local ped = PlayerPedId()
    restoreClothing(ped)
    if Config.InvincibleDuringEditor then
        SetEntityInvincible(ped, false)
    end
    activeShopType = nil
    activeMode     = nil
    destroyCam()
    exports['ZSX_UIV2']:HideInterface(false)
    SetNuiFocus(false, false)
end

RegisterNUICallback('confirm', function(data, cb)
    if activeShopType then
        local tattooZoneCount = data and data.tattooZoneCount or 0
        TriggerServerEvent('citgo_appearance:chargePlayer', activeShopType, tattooZoneCount)
    end

    local finalAppearance = AppearanceLib.getPedAppearance(PlayerPedId())
    TriggerServerEvent('citgo_appearance:server:saveAppearance', finalAppearance)

    if Config.SaveToInventory and GetResourceState('core_inventory') == 'started' then
        exports['core_inventory']:addClothingItemFromPedSkinInClothHolder(PlayerPedId(), false, true, true)
    end

    closeEditor()
    cb('ok')
end)

RegisterNUICallback('cancel', function(_, cb)
    if originalAppearance then
        AppearanceLib.setPedAppearance(PlayerPedId(), originalAppearance)
    end
    closeEditor()
    cb('ok')
end)

-- ── Ped model switching (surgeon) ────────────────────────────────────────────

RegisterNUICallback('changePedModel', function(data, cb)
    local targetModel = GetHashKey(data.model or 'mp_m_freemode_01')

    RequestModel(targetModel)
    local t = 0
    while not HasModelLoaded(targetModel) and t < 5000 do Wait(10); t = t + 10 end
    if not HasModelLoaded(targetModel) then cb({ error = 'failed' }); return end

    SetPlayerModel(PlayerId(), targetModel)
    SetModelAsNoLongerNeeded(targetModel)

    local ped = PlayerPedId()
    SetPedDefaultComponentVariation(ped)
    SetPedHeadBlendData(ped, 0, 0, 0, 0, 0, 0, 0.0, 0.0, 0.0, false)

    local appearance = AppearanceLib.getPedAppearance(ped)
    local gender     = (data.model == 'mp_f_freemode_01') and 'female' or 'male'
    currentGender    = gender
    local slots      = buildSlots(ped, appearance)

    -- Fetch updated starter outfits from server for new gender
    local starterOutfits = nil
    if not activeShopType or activeMode == 'characterCreation' or activeMode == 'starterOutfitAdmin' then
        QBCore.Functions.TriggerCallback('citgo_appearance:getStarterOutfits', function(outfits)
            starterOutfits = outfits or {}
        end, gender)
        while starterOutfits == nil do Wait(0) end
    end

    SendNUIMessage({
        type           = 'pedModelChanged',
        gender         = gender,
        appearance     = appearance,
        slots          = slots,
        starterOutfits = starterOutfits,
    })
    cb('ok')
end)

-- ── Outfit NUI callbacks ─────────────────────────────────────────────────────

RegisterNUICallback('applyOutfit', function(data, cb)
    local ped = PlayerPedId()
    if data.components then
        for id, val in pairs(data.components) do
            local cid = tonumber(id)
            if cid and cid >= 0 and cid <= 11 then
                SetPedComponentVariation(ped, cid, tonumber(val.drawable) or 0, tonumber(val.texture) or 0, 0)
            end
        end
    end
    if data.props then
        for id, val in pairs(data.props) do
            local pid = tonumber(id)
            local d   = tonumber(val.drawable) or -1
            if pid then
                if d < 0 then ClearPedProp(ped, pid)
                else SetPedPropIndex(ped, pid, d, tonumber(val.texture) or 0, true) end
            end
        end
    end
    cb('ok')
end)

RegisterNUICallback('saveOutfit', function(data, cb)
    TriggerServerEvent('citgo_appearance:server:saveOutfit',
        data.name, GetEntityModel(PlayerPedId()), toCompArray(data.components), toPropArray(data.props))
    Citizen.SetTimeout(700, pushOutfitsToNUI)
    cb('ok')
end)

RegisterNUICallback('deleteOutfit', function(data, cb)
    TriggerServerEvent('citgo_appearance:server:deleteOutfit', data.id)
    Citizen.SetTimeout(500, pushOutfitsToNUI)
    cb('ok')
end)

RegisterNUICallback('generateOutfitCode', function(data, cb)
    lib.callback('citgo_appearance:server:generateOutfitCode', false, function(code)
        if not isOpen then return end
        if code then
            SendNUIMessage({ type = 'outfitCode', code = code })
        else
            SendNUIMessage({ type = 'codeError', message = 'Could not generate a code.' })
        end
    end, data.outfitId)
    cb('ok')
end)

RegisterNUICallback('importOutfitCode', function(data, cb)
    lib.callback('citgo_appearance:server:importOutfitCode', false, function(success)
        if not isOpen then return end
        if success then
            Citizen.SetTimeout(400, function()
                lib.callback('citgo_appearance:server:getOutfits', false, function(outfits)
                    if not isOpen then return end
                    local converted = convertOutfits(outfits)
                    SendNUIMessage({ type = 'outfits', outfits = converted })
                    for _, o in ipairs(converted) do
                        if o.name == data.name then
                            SendNUIMessage({ type = 'importedOutfit', outfit = o })
                            break
                        end
                    end
                end)
            end)
        else
            SendNUIMessage({ type = 'codeError', message = 'Code not found, expired, or name already used.' })
        end
    end, data.name, data.code)
    cb('ok')
end)

-- ── Job outfit NUI callbacks (boss-managed) ─────────────────────────────────

RegisterNUICallback('saveJobOutfit', function(data, cb)
    local PlayerData = QBCore.Functions.GetPlayerData()
    if not PlayerData.job or not PlayerData.job.isboss then
        cb('not_boss')
        return
    end

    local ped = PlayerPedId()
    local outfitData = {
        JobName    = PlayerData.job.name,
        Type       = 'Job',
        MinRank    = tonumber(data.minGrade) or 0,
        Name       = data.name,
        Gender     = currentGender == 'male' and 'Male' or 'Female',
        Model      = GetEntityModel(ped),
        Components = toCompArray(data.components),
        Props      = toPropArray(data.props),
    }
    TriggerServerEvent('citgo_appearance:server:saveManagementOutfit', outfitData)
    Citizen.SetTimeout(700, pushJobOutfitsToNUI)
    cb('ok')
end)

RegisterNUICallback('deleteJobOutfit', function(data, cb)
    local PlayerData = QBCore.Functions.GetPlayerData()
    if not PlayerData.job or not PlayerData.job.isboss then
        cb('not_boss')
        return
    end
    TriggerServerEvent('citgo_appearance:server:deleteManagementOutfit', data.id)
    Citizen.SetTimeout(500, pushJobOutfitsToNUI)
    cb('ok')
end)

-- ── Starter outfit admin callbacks ──────────────────────────────────────────

RegisterNUICallback('saveStarterOutfit', function(data, cb)
    TriggerServerEvent('citgo_appearance:saveStarterOutfit', {
        gender     = currentGender,
        name       = data.name,
        components = data.components,
        props      = data.props,
    })
    cb('ok')
end)

RegisterNUICallback('deleteStarterOutfit', function(data, cb)
    TriggerServerEvent('citgo_appearance:deleteStarterOutfit', {
        gender = currentGender,
        index  = data.index,
    })
    cb('ok')
end)

-- ── Starter outfit updates from server ──────────────────────────────────────

RegisterNetEvent('citgo_appearance:starterOutfitsUpdated', function(gender, outfits)
    if not isOpen then return end
    if gender == currentGender then
        SendNUIMessage({ type = 'starterOutfitsUpdated', starterOutfits = outfits or {} })
    end
end)

-- ── Shop blips + context menus (core_focus) ─────────────────────────────────

local activeShopMenu = nil
local SHOP_RADIUS    = 9.0

local function getNearestShop()
    local ped    = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local best, bestDist = nil, SHOP_RADIUS
    for shopType, shop in pairs(Config.Shops) do
        for _, loc in ipairs(shop.locations) do
            local dist = #(coords - vector3(loc.x, loc.y, loc.z))
            if dist < bestDist then
                bestDist = dist
                best     = shopType
            end
        end
    end
    return best
end

CreateThread(function()
    for _, shop in pairs(Config.Shops) do
        for _, loc in ipairs(shop.locations) do
            if shop.blip and shop.blip.sprite then
                local blip = AddBlipForCoord(loc.x, loc.y, loc.z)
                SetBlipSprite(blip, shop.blip.sprite)
                SetBlipColour(blip, shop.blip.color or 0)
                SetBlipScale(blip, shop.blip.scale or 0.65)
                SetBlipAsShortRange(blip, true)
                BeginTextCommandSetBlipName('STRING')
                AddTextComponentSubstringPlayerName(shop.blip.label or shop.label)
                EndTextCommandSetBlipName(blip)
            end
        end
    end
end)

local useOxInteraction = Config.UseOxTarget or Config.UseOxRadial or Config.UseOxTextUI

if not useOxInteraction then
    CreateThread(function()
        while true do
            local nearest = getNearestShop()

            if nearest ~= activeShopMenu then
                if activeShopMenu then
                    exports['core_focus']:RemoveContextMenu('appearance_shop')
                    activeShopMenu = nil
                end

                if nearest and not isOpen then
                    local shop = Config.Shops[nearest]
                    exports['core_focus']:AddContextMenu('appearance_shop', {
                        enabled = true,
                        label   = shop.label,
                        icon    = shop.icon or 'fas fa-store',
                        options = {
                            {
                                label  = 'Open ' .. shop.label,
                                icon   = shop.icon or 'fas fa-store',
                                action = function()
                                    openEditor(nearest)
                                end,
                            },
                        },
                    })
                    activeShopMenu = nearest
                end
            end

            Wait(nearest and 500 or 1500)
        end
    end)
end

-- ── Optional: ox_target zones at shop locations ─────────────────────────────

if Config.UseOxTarget and GetResourceState('ox_target') == 'started' then
    for shopType, shop in pairs(Config.Shops) do
        for i, loc in ipairs(shop.locations) do
            exports.ox_target:addSphereZone({
                coords = vec3(loc.x, loc.y, loc.z),
                radius = 1.5,
                debug  = false,
                options = {
                    {
                        name  = 'appearance_' .. shopType .. '_' .. i,
                        icon  = shop.icon or 'fas fa-store',
                        label = 'Open ' .. shop.label,
                        onSelect = function()
                            openEditor(shopType)
                        end,
                    },
                },
            })
        end
    end
end

-- ── Optional: ox_lib radial menu when near a shop ───────────────────────────

if Config.UseOxRadial and GetResourceState('ox_lib') == 'started' then
    local radialActive = nil

    CreateThread(function()
        while true do
            local nearest = getNearestShop()

            if nearest ~= radialActive then
                if radialActive then
                    lib.removeRadialItem('appearance_shop')
                    radialActive = nil
                end

                if nearest and not isOpen then
                    local shop = Config.Shops[nearest]
                    lib.addRadialItem({
                        id      = 'appearance_shop',
                        icon    = shop.icon or 'fas fa-store',
                        label   = shop.label,
                        onSelect = function()
                            openEditor(nearest)
                        end,
                    })
                    radialActive = nearest
                end
            end

            Wait(nearest and 500 or 1500)
        end
    end)
end

-- ── Optional: ox_lib TextUI prompt when near a shop ─────────────────────────

if Config.UseOxTextUI and GetResourceState('ox_lib') == 'started' then
    local textuiShown = nil

    CreateThread(function()
        while true do
            local nearest = getNearestShop()

            if nearest ~= textuiShown then
                if textuiShown then
                    lib.hideTextUI()
                    textuiShown = nil
                end

                if nearest and not isOpen then
                    local shop = Config.Shops[nearest]
                    lib.showTextUI('[E] ' .. shop.label, {
                        icon = shop.icon or 'fas fa-store',
                    })
                    textuiShown = nearest
                end
            end

            if textuiShown and not isOpen and IsControlJustPressed(0, 38) then
                openEditor(textuiShown)
            end

            Wait(textuiShown and 0 or 1500)
        end
    end)
end

-- ── Wardrobe locations ──────────────────────────────────────────────────────

local WARDROBE_RADIUS = 3.0
local activeWardrobeMenu = nil

local function canAccessWardrobe(wardrobe)
    if not wardrobe.job then return true end
    local PlayerData = QBCore.Functions.GetPlayerData()
    return PlayerData.job and PlayerData.job.name == wardrobe.job
end

local function getNearestWardrobe()
    local ped    = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local best, bestDist = nil, WARDROBE_RADIUS
    for i, w in ipairs(Config.Wardrobes or {}) do
        local loc  = w.location
        local dist = #(coords - vector3(loc.x, loc.y, loc.z))
        if dist < bestDist and canAccessWardrobe(w) then
            bestDist = dist
            best     = i
        end
    end
    return best
end

if not useOxInteraction then
    CreateThread(function()
        while true do
            local nearest = getNearestWardrobe()

            if nearest ~= activeWardrobeMenu then
                if activeWardrobeMenu then
                    exports['core_focus']:RemoveContextMenu('appearance_wardrobe')
                    activeWardrobeMenu = nil
                end

                if nearest and not isOpen then
                    local w = Config.Wardrobes[nearest]
                    exports['core_focus']:AddContextMenu('appearance_wardrobe', {
                        enabled = true,
                        label   = w.label,
                        icon    = w.icon or 'fas fa-shirt',
                        options = {
                            {
                                label  = 'Open Wardrobe',
                                icon   = w.icon or 'fas fa-shirt',
                                action = function()
                                    openEditor(nil, 'wardrobe')
                                end,
                            },
                        },
                    })
                    activeWardrobeMenu = nearest
                end
            end

            Wait(nearest and 500 or 1500)
        end
    end)
end

if Config.UseOxTarget and GetResourceState('ox_target') == 'started' then
    for i, w in ipairs(Config.Wardrobes or {}) do
        local loc = w.location
        exports.ox_target:addSphereZone({
            coords = vec3(loc.x, loc.y, loc.z),
            radius = WARDROBE_RADIUS,
            debug  = false,
            options = {
                {
                    name  = 'wardrobe_' .. i,
                    icon  = w.icon or 'fas fa-shirt',
                    label = 'Open ' .. w.label,
                    canInteract = function()
                        return canAccessWardrobe(w)
                    end,
                    onSelect = function()
                        openEditor(nil, 'wardrobe')
                    end,
                },
            },
        })
    end
end

if Config.UseOxRadial and GetResourceState('ox_lib') == 'started' then
    local wardrobeRadialActive = nil

    CreateThread(function()
        while true do
            local nearest = getNearestWardrobe()

            if nearest ~= wardrobeRadialActive then
                if wardrobeRadialActive then
                    lib.removeRadialItem('appearance_wardrobe')
                    wardrobeRadialActive = nil
                end

                if nearest and not isOpen then
                    local w = Config.Wardrobes[nearest]
                    lib.addRadialItem({
                        id       = 'appearance_wardrobe',
                        icon     = w.icon or 'fas fa-shirt',
                        label    = w.label,
                        onSelect = function()
                            openEditor(nil, 'wardrobe')
                        end,
                    })
                    wardrobeRadialActive = nearest
                end
            end

            Wait(nearest and 500 or 1500)
        end
    end)
end

if Config.UseOxTextUI and GetResourceState('ox_lib') == 'started' then
    local wardrobeTextuiShown = nil

    CreateThread(function()
        while true do
            local nearest = getNearestWardrobe()

            if nearest ~= wardrobeTextuiShown then
                if wardrobeTextuiShown then
                    lib.hideTextUI()
                    wardrobeTextuiShown = nil
                end

                if nearest and not isOpen then
                    local w = Config.Wardrobes[nearest]
                    lib.showTextUI('[E] ' .. w.label, {
                        icon = w.icon or 'fas fa-shirt',
                    })
                    wardrobeTextuiShown = nearest
                end
            end

            if wardrobeTextuiShown and not isOpen and IsControlJustPressed(0, 38) then
                openEditor(nil, 'wardrobe')
            end

            Wait(wardrobeTextuiShown and 0 or 1500)
        end
    end)
end

-- ── Cleanup ──────────────────────────────────────────────────────────────────

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    if isOpen then closeEditor() end
    if Config.UseOxTextUI then pcall(lib.hideTextUI) end
    if Config.UseOxRadial then
        pcall(lib.removeRadialItem, 'appearance_shop')
        pcall(lib.removeRadialItem, 'appearance_wardrobe')
    end
end)
