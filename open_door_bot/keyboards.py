from telegram import InlineKeyboardMarkup, InlineKeyboardButton
from config import DEVICES

def get_main_keyboard(is_admin: bool = False) -> InlineKeyboardMarkup:
    """Bosh menyu klaviaturasi - tezkor bir marta bosishda ochish"""
    keyboard = [
        [
            InlineKeyboardButton(f"🟢 {DEVICES['1']['name']}", callback_data="quick_open:1"),
            InlineKeyboardButton(f"🟢 {DEVICES['1/1']['name']}", callback_data="quick_open:1/1"),
        ],
        [
            InlineKeyboardButton(f"🟢 {DEVICES['2']['name']}", callback_data="quick_open:2"),
            InlineKeyboardButton(f"🟢 {DEVICES['2/2']['name']}", callback_data="quick_open:2/2"),
        ],
        [
            InlineKeyboardButton("⚡ Barchasini ochish (Hammasi)", callback_data="quick_open_all"),
        ],
        [
            InlineKeyboardButton("⚙️ Sozlamalar / Rejimlar", callback_data="menu_manage"),
            InlineKeyboardButton("🔄 Yangilash / Status", callback_data="refresh_status"),
        ]
    ]
    if is_admin:
        keyboard.append([
            InlineKeyboardButton("👑 Ma'muriyat paneli (Admin)", callback_data="admin_menu")
        ])
    return InlineKeyboardMarkup(keyboard)

def get_manage_keyboard() -> InlineKeyboardMarkup:
    """Kengaytirilgan boshqaruv uchun eshikni tanlash menyusi"""
    keyboard = [
        [
            InlineKeyboardButton(f"🚪 {DEVICES['1']['name']}", callback_data="door_detail:1"),
            InlineKeyboardButton(f"🚪 {DEVICES['1/1']['name']}", callback_data="door_detail:1/1"),
        ],
        [
            InlineKeyboardButton(f"🚪 {DEVICES['2']['name']}", callback_data="door_detail:2"),
            InlineKeyboardButton(f"🚪 {DEVICES['2/2']['name']}", callback_data="door_detail:2/2"),
        ],
        [
            InlineKeyboardButton("◀️ Bosh menyuga qaytish", callback_data="main_menu"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_door_actions_keyboard(door_id: str) -> InlineKeyboardMarkup:
    """Alohida eshik uchun barcha ISAPI buyruqlari"""
    keyboard = [
        [
            InlineKeyboardButton("🟢 Bir martalik ochish", callback_data=f"act:{door_id}:open"),
            InlineKeyboardButton("🔒 Qulflash (Normal)", callback_data=f"act:{door_id}:close"),
        ],
        [
            InlineKeyboardButton("🔓 Erkin o'tish (Doimiy ochiq)", callback_data=f"act:{door_id}:alwaysOpen"),
        ],
        [
            InlineKeyboardButton("⛔ Bloklash (Doimiy yopiq)", callback_data=f"act:{door_id}:alwaysClose"),
        ],
        [
            InlineKeyboardButton("🔄 Holat", callback_data=f"door_detail:{door_id}"),
            InlineKeyboardButton("◀️ Orqaga", callback_data="menu_manage"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_admin_menu_keyboard() -> InlineKeyboardMarkup:
    """Admin boshqaruv paneli menyusi"""
    keyboard = [
        [
            InlineKeyboardButton("👥 Foydalanuvchilar ro'yxati", callback_data="admin_users:0"),
        ],
        [
            InlineKeyboardButton("➕ Yangi foydalanuvchi qo'shish", callback_data="admin_add_user"),
        ],
        [
            InlineKeyboardButton("◀️ Asosiy menyuga qaytish", callback_data="main_menu"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_users_list_keyboard(users: list[dict], page: int = 0, per_page: int = 6) -> InlineKeyboardMarkup:
    """Foydalanuvchilar ro'yxati sahifalash bilan"""
    total = len(users)
    start_idx = page * per_page
    end_idx = start_idx + per_page
    page_users = users[start_idx:end_idx]

    keyboard = []
    for u in page_users:
        uid = u["user_id"]
        name = u["name"]
        is_adm = (u.get("role") == "admin")
        is_act = (u.get("is_active", 1) == 1)
        
        status_icon = "👑 " if is_adm else ("🟢 " if is_act else "🔴 ")
        role_label = " (Admin)" if is_adm else ""
        button_text = f"{status_icon}{name}{role_label}"
        
        keyboard.append([
            InlineKeyboardButton(button_text, callback_data=f"admin_view_user:{uid}")
        ])

    # Pagination buttons
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton("⬅️ Oldingi", callback_data=f"admin_users:{page - 1}"))
    if end_idx < total:
        nav_row.append(InlineKeyboardButton("Keyingi ➡️", callback_data=f"admin_users:{page + 1}"))
    if nav_row:
        keyboard.append(nav_row)

    keyboard.append([
        InlineKeyboardButton("➕ Yangi qo'shish", callback_data="admin_add_user"),
        InlineKeyboardButton("◀️ Admin panel", callback_data="admin_menu")
    ])
    return InlineKeyboardMarkup(keyboard)

def get_user_manage_keyboard(target_user: dict) -> InlineKeyboardMarkup:
    """Tanlangan foydalanuvchini boshqarish tugmalari"""
    uid = target_user["user_id"]
    is_adm = (target_user.get("role") == "admin")
    is_act = (target_user.get("is_active", 1) == 1)
    is_super = (uid == 364227737)

    keyboard = [
        [
            InlineKeyboardButton("✏️ Ismni o'zgartirish", callback_data=f"admin_rename_user:{uid}")
        ]
    ]

    if not is_super:
        role_btn_text = "👤 User roliga tushirish" if is_adm else "👑 Admin qilish"
        new_role = "user" if is_adm else "admin"
        
        active_btn_text = "⛔ Ruxsatni to'xtatish (Bloklash)" if is_act else "🟢 Ruxsatni tiklash (Faollashtirish)"
        
        keyboard.append([
            InlineKeyboardButton(role_btn_text, callback_data=f"admin_role_user:{uid}:{new_role}")
        ])
        keyboard.append([
            InlineKeyboardButton(active_btn_text, callback_data=f"admin_toggle_user:{uid}")
        ])
        keyboard.append([
            InlineKeyboardButton("🗑 Ro'yxatdan butunlay o'chirish", callback_data=f"admin_del_confirm:{uid}")
        ])

    keyboard.append([
        InlineKeyboardButton("◀️ Foydalanuvchilar ro'yxatiga", callback_data="admin_users:0")
    ])
    return InlineKeyboardMarkup(keyboard)

def get_confirm_delete_keyboard(user_id: int) -> InlineKeyboardMarkup:
    """O'chirishni tasdiqlash klaviaturasi"""
    keyboard = [
        [
            InlineKeyboardButton("⚠️ Ha, butunlay o'chirilsin", callback_data=f"admin_del_execute:{user_id}")
        ],
        [
            InlineKeyboardButton("❌ Bekor qilish", callback_data=f"admin_view_user:{user_id}")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_cancel_keyboard(back_callback: str = "admin_menu") -> InlineKeyboardMarkup:
    """Bekor qilish tugmasi"""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("❌ Bekor qilish", callback_data=back_callback)]
    ])
