# -*- coding: utf-8 -*-
with open(r'\\192.168.129.202\c$\UCS\R Keeper 7 Cash\FoodPicasso Plugin\FARCARDS.INI.bak_20260817_190700', 'rb') as f:
    lines = f.read().decode('cp1251').splitlines(keepends=True)

new_lines = []
for line in lines:
    if line.strip().lower().startswith('url='):
        # Заменяем только строку Url
        new_lines.append('Url=https://api-uz18.posterix.pro/points\r\n')
    elif line.strip().lower().startswith('authendpointurl='):
        # Заменяем только строку AuthEndpointUrl
        new_lines.append('AuthEndpointUrl=https://api-uz18.posterix.pro/points/security/oauth/token\r\n')
    else:
        # Все остальные строки оставляем 1 в 1 как в оригинале
        new_lines.append(line)

target = r'\\192.168.129.202\c$\UCS\R Keeper 7 Cash\FoodPicasso Plugin\FARCARDS.INI'
with open(target, 'wb') as f:
    f.write(''.join(new_lines).encode('cp1251'))

print('Strict line-by-line updated for 192.168.129.202!')
