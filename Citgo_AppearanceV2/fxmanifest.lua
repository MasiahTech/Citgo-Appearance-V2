fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'citgo_AppearanceV2'
author 'Citgo'
description 'Character appearance editor — uz_AutoShot photo thumbnails, illenium-appearance backend'
version '1.0.0'

ui_page 'html/build/index.html'

files {
    'html/build/index.html',
    'html/build/**/*',
}

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
    'shared/tattoos_loader.lua',
}

client_scripts {
    'client/main.lua',
}

server_scripts {
    'server/main.lua',
}

dependencies {
    'illenium-appearance',
    'uz_AutoShot',
    'qb-core',
}
