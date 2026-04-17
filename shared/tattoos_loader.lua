if not Config then Config = {} end

local tattooFile = LoadResourceFile('illenium-appearance', 'shared/tattoos.lua')
if tattooFile then
    local fn, err = load(tattooFile, '@illenium-appearance/shared/tattoos.lua', 't', _ENV)
    if fn then
        local ok, runErr = pcall(fn)
        if ok then
            print('[citgo_AppearanceV2] Loaded ' .. (Config.Tattoos and 'tattoo data successfully' or 'tattoos.lua but Config.Tattoos is nil'))
        else
            print('^1[citgo_AppearanceV2] Runtime error in tattoos.lua: ' .. tostring(runErr) .. '^7')
        end
    else
        print('^1[citgo_AppearanceV2] Failed to parse tattoos.lua: ' .. tostring(err) .. '^7')
    end
else
    print('^1[citgo_AppearanceV2] Could not load illenium-appearance/shared/tattoos.lua^7')
end
