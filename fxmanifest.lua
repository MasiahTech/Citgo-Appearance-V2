fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'citgo_AppearanceV2'
author 'Citgo'
description 'Self-contained character appearance editor with outfit management'
version '2.0.0'

ui_page 'html/build/index.html'

files {
    'html/build/index.html',
    'html/build/**/*',
}

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
    'shared/tattoos.lua',
}

client_scripts {
    'client/constants.lua',
    'client/appearance.lua',
    'client/main.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/database/database.lua',
    'server/database/playerskins.lua',
    'server/database/playeroutfits.lua',
    'server/database/playeroutfitcodes.lua',
    'server/database/managementoutfits.lua',
    'server/framework.lua',
    'server/util.lua',
    'server/main.lua',
}

dependencies {
    'qb-core',
    'oxmysql',
    'ox_lib',
    'uz_AutoShot',
}
