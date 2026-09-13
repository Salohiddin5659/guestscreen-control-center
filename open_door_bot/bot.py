import asyncio
import datetime
import logging
import re
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters
)

from config import BOT_TOKEN, DEVICES
import db
from hikvision import (
    send_door_command,
    check_all_health,
    check_device_health,
    COMMAND_TITLES
)
from keyboards import (
    get_main_keyboard,
    get_manage_keyboard,
    get_door_actions_keyboard,
    get_admin_menu_keyboard,
    get_users_list_keyboard,
    get_user_manage_keyboard,
    get_confirm_delete_keyboard,
    get_cancel_keyboard
)

logging.basicConfig(
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("OpenDoorBot")

def get_user_display(user) -> str:
    db_user = db.get_user(user.id)
    if db_user and db_user.get("name"):
        return db_user["name"]
    if user.username:
        return f"@{user.username}"
    if user.first_name:
        return user.first_name
    return str(user.id)

def current_time_str() -> str:
    return datetime.datetime.now().strftime("%H:%M:%S")

async def build_main_dashboard_text(last_action: str = None) -> str:
    health = await check_all_health()
    
    text = "🏢 <b>OQTEPA — ESHIKLAR VA TURNIKETLAR BOSHQARUVI</b>\n"
    text += "━━━━━━━━━━━━━━━━━━━━━━\n"
    
    if last_action:
        text += f"{last_action}\n"
        text += "━━━━━━━━━━━━━━━━━━━━━━\n"
        
    text += "📊 <b>Terminallar holati (СКУД):</b>\n"
    for dev_id, dev in DEVICES.items():
        h = health.get(dev_id, {})
        if h.get("online"):
            status_str = f"🟢 Online (<code>{h.get('latency', 0):.1f} ms</code>)"
        else:
            status_str = "🔴 Aloqa yo'q (Offline)"
        text += f"• {dev['icon']} <b>{dev['name']}</b>: {status_str}\n"
        
    text += "━━━━━━━━━━━━━━━━━━━━━━\n"
    text += "👇 <i>Tezkor ochish uchun eshik tugmasini bosing:</i>"
    return text

# ==================== HANDLERS: START & HELP ====================

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    context.user_data.clear()

    if not db.is_user_allowed(user.id):
        logger.warning(f"Unauthorized access attempt by {user.id} ({user.full_name})")
        await update.message.reply_text(
            f"⛔ <b>Kirish taqiqlangan / Доступ запрещен</b>\n\n"
            f"Sizning Telegram ID: <code>{user.id}</code>\n"
            f"Foydalanuvchi: {user.full_name}\n\n"
            f"<i>Ushbu bot faqat ruxsat etilgan ma'murlar uchun mo'ljallangan. "
            f"Ruxsat olish uchun tizim ma'muriga murojaat qiling.</i>",
            parse_mode=ParseMode.HTML
        )
        return

    is_admin = db.is_user_admin(user.id)
    logger.info(f"User {get_user_display(user)} ({user.id}) started the bot. Admin={is_admin}")
    
    wait_msg = await update.message.reply_text("🔄 <i>Terminallar tekshirilmoqda...</i>", parse_mode=ParseMode.HTML)
    dashboard_text = await build_main_dashboard_text()
    await wait_msg.edit_text(
        dashboard_text,
        reply_markup=get_main_keyboard(is_admin=is_admin),
        parse_mode=ParseMode.HTML
    )

async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not db.is_user_allowed(user.id):
        return
    text = (
        "ℹ️ <b>Boshqaruv bo'yicha qo'llanma:</b>\n\n"
        "🟢 <b>Tezkor ochish:</b> Asosiy menyudagi eshik tugmasi bir martalik impuls (5 soniya) beradi.\n"
        "⚡ <b>Barchasini ochish:</b> Barcha 4 ta eshikni parallel ochadi.\n"
        "🔓 <b>Erkin o'tish:</b> Eshikni doimiy ochiq rejimga o'tkazadi.\n"
        "⛔ <b>Bloklash:</b> Eshikni doimiy yopiq rejimga o'tkazadi.\n"
        "🔒 <b>Qulflash:</b> Eshikni oddiy ishchi (yopiq) holatiga qaytaradi.\n\n"
    )
    if db.is_user_admin(user.id):
        text += (
            "👑 <b>Admin buyruqlari:</b>\n"
            "• <code>/add &lt;id&gt; &lt;ism&gt;</code> — Yangi foydalanuvchi qo'shish\n"
            "• <code>/delete &lt;id&gt;</code> — Foydalanuvchini o'chirish\n"
            "• <code>/users</code> — Barcha foydalanuvchilar ro'yxati\n\n"
        )
    text += "Muammo yuzaga kelsa, /start buyrug'ini yuboring."
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)

# ==================== ADMIN TEXT & COMMAND HANDLERS ====================

async def admin_users_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not db.is_user_admin(user.id):
        return
    users = db.get_all_users()
    text = (
        "👥 <b>FOYDALANUVCHILAR RO'YXATI</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Jami: <b>{len(users)}</b> ta foydalanuvchi\n"
        "Boshqarish uchun quyidagi ro'yxatdan foydalanuvchini tanlang:"
    )
    await update.message.reply_text(
        text,
        reply_markup=get_users_list_keyboard(users, page=0),
        parse_mode=ParseMode.HTML
    )

async def admin_add_user_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not db.is_user_admin(user.id):
        return
    
    args = context.args
    if not args or len(args) < 2:
        await update.message.reply_text(
            "ℹ️ <b>Foydalanish:</b> <code>/add &lt;Telegram_ID&gt; &lt;Ism/Lavozim&gt;</code>\n"
            "<i>Masalan:</i> <code>/add 123456789 Ali Valiyev</code>",
            parse_mode=ParseMode.HTML
        )
        return
        
    try:
        new_id = int(args[0])
    except ValueError:
        await update.message.reply_text("❌ Xatolik: Telegram ID faqat raqamlardan iborat bo'lishi kerak!")
        return
        
    name = " ".join(args[1:]).strip()
    ok, msg = db.add_user(new_id, name, role="user", added_by=user.id)
    if ok:
        await update.message.reply_text(
            f"✅ <b>Foydalanuvchi qo'shildi!</b>\n\n"
            f"🆔 ID: <code>{new_id}</code>\n"
            f"👤 Ism: <b>{name}</b>\n"
            f"🎭 Rol: User\n"
            f"📊 Holat: 🟢 Faol",
            parse_mode=ParseMode.HTML
        )
    else:
        await update.message.reply_text(f"❌ Xatolik: {msg}")

async def admin_del_user_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not db.is_user_admin(user.id):
        return
        
    args = context.args
    if not args:
        await update.message.reply_text(
            "ℹ️ <b>Foydalanish:</b> <code>/delete &lt;Telegram_ID&gt;</code>\n"
            "<i>Masalan:</i> <code>/delete 123456789</code>",
            parse_mode=ParseMode.HTML
        )
        return
        
    try:
        del_id = int(args[0])
    except ValueError:
        await update.message.reply_text("❌ Xatolik: Telegram ID faqat raqamlardan iborat bo'lishi kerak!")
        return
        
    if del_id == 364227737:
        await update.message.reply_text("⛔ Asosiy tizim administratorini o'chirish mumkin emas!")
        return
        
    target = db.get_user(del_id)
    if not target:
        await update.message.reply_text(f"❌ ID <code>{del_id}</code> bo'yicha foydalanuvchi topilmadi!", parse_mode=ParseMode.HTML)
        return
        
    db.delete_user(del_id)
    await update.message.reply_text(f"✅ Foydalanuvchi <b>{target['name']}</b> (<code>{del_id}</code>) o'chirildi!", parse_mode=ParseMode.HTML)

async def text_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not db.is_user_admin(user.id):
        return

    text = update.message.text.strip()
    admin_state = context.user_data.get("admin_state")

    # 1. State: Waiting for user ID to add
    if admin_state == "WAITING_ADD_ID":
        # Check if user sent both ID and Name in one line (e.g. "123456789 Ali Kassa")
        parts = text.split(maxsplit=1)
        if len(parts) >= 2 and parts[0].isdigit():
            new_id = int(parts[0])
            name = parts[1].strip()
            db.add_user(new_id, name, role="user", added_by=user.id)
            context.user_data.clear()
            await update.message.reply_text(
                f"✅ <b>Yangi foydalanuvchi muvaffaqiyatli qo'shildi!</b>\n\n"
                f"🆔 ID: <code>{new_id}</code>\n"
                f"👤 Ism: <b>{name}</b>\n"
                f"🎭 Rol: User\n"
                f"📊 Holat: 🟢 Faol",
                reply_markup=get_admin_menu_keyboard(),
                parse_mode=ParseMode.HTML
            )
            return

        if not text.isdigit():
            await update.message.reply_text(
                "❌ <b>Noto'g'ri format!</b>\n"
                "Iltimos, faqat raqamlardan iborat Telegram ID yuboring yoki bekor qiling:\n"
                "<i>(Masalan: <code>5047209164</code>)</i>",
                reply_markup=get_cancel_keyboard(),
                parse_mode=ParseMode.HTML
            )
            return

        context.user_data["new_user_id"] = int(text)
        context.user_data["admin_state"] = "WAITING_ADD_NAME"
        await update.message.reply_text(
            f"🆔 Qabul qilindi: <code>{text}</code>\n\n"
            "Endi ushbu foydalanuvchining <b>ism-familiyasi</b> yoki <b>lavozimini</b> yuboring:\n"
            "<i>(Masalan: <code>Rustam Oqtepa Kassa</code>)</i>",
            reply_markup=get_cancel_keyboard(),
            parse_mode=ParseMode.HTML
        )
        return

    # 2. State: Waiting for user Name to add
    if admin_state == "WAITING_ADD_NAME":
        new_id = context.user_data.get("new_user_id")
        name = text
        db.add_user(new_id, name, role="user", added_by=user.id)
        context.user_data.clear()
        await update.message.reply_text(
            f"✅ <b>Yangi foydalanuvchi muvaffaqiyatli qo'shildi!</b>\n\n"
            f"🆔 ID: <code>{new_id}</code>\n"
            f"👤 Ism: <b>{name}</b>\n"
            f"🎭 Rol: Oddiy foydalanuvchi (User)\n"
            f"📊 Holat: 🟢 Faol",
            reply_markup=get_admin_menu_keyboard(),
            parse_mode=ParseMode.HTML
        )
        return

    # 3. State: Renaming user
    if admin_state and admin_state.startswith("WAITING_RENAME_"):
        target_uid = int(admin_state.replace("WAITING_RENAME_", ""))
        new_name = text
        db.update_user_name(target_uid, new_name)
        context.user_data.clear()
        
        target = db.get_user(target_uid)
        await update.message.reply_text(
            f"✅ <b>Ism muvaffaqiyatli o'zgartirildi!</b>\n\n"
            f"🆔 ID: <code>{target_uid}</code>\n"
            f"👤 Yangi ism: <b>{new_name}</b>",
            reply_markup=get_user_manage_keyboard(target),
            parse_mode=ParseMode.HTML
        )
        return

# ==================== CALLBACK ROUTER ====================

async def callback_router(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user = query.from_user
    
    if not db.is_user_allowed(user.id):
        await query.answer("⛔ Ruxsat berilmagan / Доступ запрещен", show_alert=True)
        return

    data = query.data
    user_name = get_user_display(user)
    is_admin = db.is_user_admin(user.id)

    # 1. Main menu
    if data == "main_menu":
        await query.answer()
        context.user_data.clear()
        text = await build_main_dashboard_text()
        await query.edit_message_text(
            text,
            reply_markup=get_main_keyboard(is_admin=is_admin),
            parse_mode=ParseMode.HTML
        )
        return

    # 2. Refresh status
    if data == "refresh_status":
        await query.answer("🔄 Holat yangilanmoqda...")
        text = await build_main_dashboard_text()
        await query.edit_message_text(
            text,
            reply_markup=get_main_keyboard(is_admin=is_admin),
            parse_mode=ParseMode.HTML
        )
        return

    # 3. Quick Open Single Door
    if data.startswith("quick_open:"):
        door_id = data.split(":")[1]
        dev = DEVICES.get(door_id)
        if not dev:
            await query.answer("Noma'lum eshik", show_alert=True)
            return
            
        logger.info(f"[ACTION] {user_name} -> Quick Open {dev['name']} ({dev['ip']})")
        ok, msg = await send_door_command(dev["ip"], "open")
        
        if ok:
            await query.answer(f"🔓 {dev['name']} ochildi!", show_alert=False)
            last_action = (
                f"⚡ <b>So'nggi amal:</b> 🔓 <b>{dev['name']}</b> ochildi!\n"
                f"👤 <b>Foydalanuvchi:</b> {user_name}\n"
                f"⏰ <b>Vaqt:</b> {current_time_str()}"
            )
        else:
            await query.answer(f"❌ Xatolik: {msg}", show_alert=True)
            last_action = (
                f"⚠️ <b>So'nggi amal:</b> ❌ <b>{dev['name']}</b> ochilmadi!\n"
                f"ℹ️ <b>Sabab:</b> {msg}\n"
                f"👤 <b>Foydalanuvchi:</b> {user_name} | ⏰ {current_time_str()}"
            )
            
        text = await build_main_dashboard_text(last_action)
        try:
            await query.edit_message_text(
                text,
                reply_markup=get_main_keyboard(is_admin=is_admin),
                parse_mode=ParseMode.HTML
            )
        except Exception:
            pass
        return

    # 4. Quick Open ALL Doors
    if data == "quick_open_all":
        logger.info(f"[ACTION] {user_name} -> Quick Open ALL DOORS")
        await query.answer("⚡ Barcha eshiklar ochilmoqda...", show_alert=False)
        
        tasks = [send_door_command(d["ip"], "open") for d in DEVICES.values()]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for ok, _ in results if ok)
        total = len(DEVICES)
        
        last_action = (
            f"⚡ <b>So'nggi amal:</b> 🔓 <b>BARCHA ESHIKLAR OCHILDI!</b> ({success_count}/{total})\n"
            f"👤 <b>Foydalanuvchi:</b> {user_name}\n"
            f"⏰ <b>Vaqt:</b> {current_time_str()}"
        )
        
        text = await build_main_dashboard_text(last_action)
        try:
            await query.edit_message_text(
                text,
                reply_markup=get_main_keyboard(is_admin=is_admin),
                parse_mode=ParseMode.HTML
            )
        except Exception:
            pass
        return

    # 5. Advanced Manage Menu
    if data == "menu_manage":
        await query.answer()
        text = (
            "⚙️ <b>KENGAYTIRILGAN ESHIKLAR BOSHQARUVI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "Quyidagi eshiklardan birini tanlang. Har bir eshik uchun:\n"
            "• 🟢 <b>Ochish:</b> Bir martalik impuls (5 soniya)\n"
            "• 🔒 <b>Qulflash:</b> Normal yopiq holatga qaytarish\n"
            "• 🔓 <b>Erkin o'tish:</b> Doimiy ochiq qoldirish\n"
            "• ⛔ <b>Bloklash:</b> Doimiy yopiq (xavfsizlik rejimi)\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "👇 <i>Eshikni tanlang:</i>"
        )
        await query.edit_message_text(text, reply_markup=get_manage_keyboard(), parse_mode=ParseMode.HTML)
        return

    # 6. Door Detail Screen
    if data.startswith("door_detail:"):
        door_id = data.split(":")[1]
        dev = DEVICES.get(door_id)
        if not dev:
            await query.answer("Noma'lum eshik", show_alert=True)
            return
            
        await query.answer()
        h = await check_device_health(dev["ip"])
        status_line = f"🟢 Online (<code>{h.get('latency', 0):.1f} ms</code>)" if h.get("online") else "🔴 Offline"
        
        text = (
            f"🚪 <b>ESHIK SOZLAMASI: {dev['name']}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🌐 <b>IP-manzil:</b> <code>{dev['ip']}</code>\n"
            f"📊 <b>Aloqa:</b> {status_line}\n"
            f"📝 <b>Tavsif:</b> {dev['desc']}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👇 <i>Kerakli buyruq yoki rejimni tanlang:</i>"
        )
        await query.edit_message_text(text, reply_markup=get_door_actions_keyboard(door_id), parse_mode=ParseMode.HTML)
        return

    # 7. Execute Specific Command on Specific Door
    if data.startswith("act:"):
        _, door_id, cmd = data.split(":")
        dev = DEVICES.get(door_id)
        if not dev:
            await query.answer("Noma'lum eshik", show_alert=True)
            return

        cmd_title = COMMAND_TITLES.get(cmd, cmd)
        logger.info(f"[ACTION] {user_name} -> {dev['name']} ({dev['ip']}) CMD={cmd}")
        
        ok, msg = await send_door_command(dev["ip"], cmd)
        
        if ok:
            if cmd == "open":
                alert_text = f"🔓 {dev['name']} ochildi!"
                is_modal = False
            elif cmd == "close":
                alert_text = f"🔒 {dev['name']} qulflandi (Normal rejim)"
                is_modal = False
            elif cmd == "alwaysOpen":
                alert_text = f"🔓 {dev['name']}: Erkin o'tish (Doim ochiq) rejimi yoqildi!"
                is_modal = True
            elif cmd == "alwaysClose":
                alert_text = f"⛔ {dev['name']}: Bloklash (Doim yopiq) rejimi yoqildi!"
                is_modal = True
            else:
                alert_text = f"✅ Buyruq bajarildi: {cmd_title}"
                is_modal = False
            await query.answer(alert_text, show_alert=is_modal)
        else:
            await query.answer(f"❌ Xatolik: {msg}", show_alert=True)
            
        h = await check_device_health(dev["ip"])
        status_line = f"🟢 Online (<code>{h.get('latency', 0):.1f} ms</code>)" if h.get("online") else "🔴 Offline"
        result_symbol = "✅" if ok else "❌"
        
        text = (
            f"🚪 <b>ESHIK SOZLAMASI: {dev['name']}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{result_symbol} <b>Oxirgi buyruq:</b> {cmd_title}\n"
            f"👤 <b>Kim tomonidan:</b> {user_name} (⏰ {current_time_str()})\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🌐 <b>IP-manzil:</b> <code>{dev['ip']}</code>\n"
            f"📊 <b>Aloqa:</b> {status_line}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👇 <i>Keyingi buyruqni tanlang:</i>"
        )
        try:
            await query.edit_message_text(text, reply_markup=get_door_actions_keyboard(door_id), parse_mode=ParseMode.HTML)
        except Exception:
            pass
        return

    # ==================== ADMIN CALLBACKS ====================

    if not is_admin:
        await query.answer("⛔ Ushbu amal faqat administratorlar uchun!", show_alert=True)
        return

    # Admin Panel Main Screen
    if data == "admin_menu":
        await query.answer()
        context.user_data.clear()
        users = db.get_all_users()
        active_count = sum(1 for u in users if u.get("is_active") == 1)
        admins_count = sum(1 for u in users if u.get("role") == "admin")
        
        text = (
            "👑 <b>MA'MURIYAT PANELI (ADMIN PANEL)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👥 Jami ro'yxatda: <b>{len(users)}</b> ta foydalanuvchi\n"
            f"🟢 Faol ruxsatga ega: <b>{active_count}</b> ta\n"
            f"👑 Administratorlar: <b>{admins_count}</b> ta\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "Kerakli bo'limni tanlang:"
        )
        await query.edit_message_text(text, reply_markup=get_admin_menu_keyboard(), parse_mode=ParseMode.HTML)
        return

    # Admin Users List (Pagination)
    if data.startswith("admin_users:"):
        page = int(data.split(":")[1])
        await query.answer()
        context.user_data.clear()
        users = db.get_all_users()
        
        text = (
            "👥 <b>FOYDALANUVCHILAR RO'YXATI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Jami: <b>{len(users)}</b> ta foydalanuvchi\n"
            "<i>Foydalanuvchi ustiga bosib, uning ma'lumotlarini o'zgartirishingiz, "
            "rolini o'zgartirishingiz yoki o'chirishingiz mumkin:</i>"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_users_list_keyboard(users, page=page),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin View Specific User Card
    if data.startswith("admin_view_user:"):
        target_uid = int(data.split(":")[1])
        await query.answer()
        context.user_data.clear()
        target = db.get_user(target_uid)
        if not target:
            await query.answer("Foydalanuvchi topilmadi", show_alert=True)
            return

        role_str = "👑 Administrator" if target.get("role") == "admin" else "👤 Oddiy foydalanuvchi (User)"
        status_str = "🟢 Faol (Ruxsat berilgan)" if target.get("is_active") == 1 else "🔴 Bloklangan (Ruxsat yo'q)"
        created_str = target.get("created_at", "—")
        
        text = (
            "👤 <b>FOYDALANUVCHI MA'LUMOTLARI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 <b>Telegram ID:</b> <code>{target['user_id']}</code>\n"
            f"🏷 <b>Ism / Izoh:</b> <b>{target['name']}</b>\n"
            f"🎭 <b>Roli:</b> {role_str}\n"
            f"📊 <b>Holati:</b> {status_str}\n"
            f"📅 <b>Qo'shilgan vaqti:</b> {created_str}\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "👇 <i>Kerakli amalni tanlang:</i>"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_user_manage_keyboard(target),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin Add User Prompt
    if data == "admin_add_user":
        await query.answer()
        context.user_data["admin_state"] = "WAITING_ADD_ID"
        text = (
            "➕ <b>YANGI FOYDALANUVCHI QO'SHISH</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "Iltimos, yangi foydalanuvchining <b>Telegram ID</b> raqamini yuboring:\n"
            "<i>(Masalan: <code>123456789</code>)</i>\n\n"
            "💡 <i>Yoki bir qatorda ID va ismni yuboring:</i>\n"
            "<code>123456789 Ali Valiyev</code>"
        )
        await query.edit_message_text(text, reply_markup=get_cancel_keyboard(), parse_mode=ParseMode.HTML)
        return

    # Admin Rename User Prompt
    if data.startswith("admin_rename_user:"):
        target_uid = int(data.split(":")[1])
        await query.answer()
        target = db.get_user(target_uid)
        if not target:
            await query.answer("Foydalanuvchi topilmadi", show_alert=True)
            return
            
        context.user_data["admin_state"] = f"WAITING_RENAME_{target_uid}"
        text = (
            "✏️ <b>FOYDALANUVCHI ISMINI O'ZGARTIRISH</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 ID: <code>{target_uid}</code>\n"
            f"Hozirgi ism: <b>{target['name']}</b>\n\n"
            "Iltimos, yangi ism yoki lavozimni yozib yuboring:"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_cancel_keyboard(f"admin_view_user:{target_uid}"),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin Toggle Role (admin <-> user)
    if data.startswith("admin_role_user:"):
        _, target_uid_str, new_role = data.split(":")
        target_uid = int(target_uid_str)
        if target_uid == 364227737:
            await query.answer("⛔ Asosiy tizim administratorini o'zgartirish mumkin emas!", show_alert=True)
            return

        db.update_user_role(target_uid, new_role)
        await query.answer(f"✅ Rol o'zgartirildi: {new_role}")
        
        target = db.get_user(target_uid)
        role_str = "👑 Administrator" if target.get("role") == "admin" else "👤 Oddiy foydalanuvchi (User)"
        status_str = "🟢 Faol (Ruxsat berilgan)" if target.get("is_active") == 1 else "🔴 Bloklangan (Ruxsat yo'q)"
        
        text = (
            "👤 <b>FOYDALANUVCHI MA'LUMOTLARI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 <b>Telegram ID:</b> <code>{target['user_id']}</code>\n"
            f"🏷 <b>Ism / Izoh:</b> <b>{target['name']}</b>\n"
            f"🎭 <b>Roli:</b> {role_str}\n"
            f"📊 <b>Holati:</b> {status_str}\n"
            f"📅 <b>Qo'shilgan vaqti:</b> {target.get('created_at', '—')}\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "👇 <i>Kerakli amalni tanlang:</i>"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_user_manage_keyboard(target),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin Toggle Active Status (block / unblock)
    if data.startswith("admin_toggle_user:"):
        target_uid = int(data.split(":")[1])
        if target_uid == 364227737:
            await query.answer("⛔ Asosiy tizim administratorini bloklash mumkin emas!", show_alert=True)
            return

        db.toggle_user_active(target_uid)
        target = db.get_user(target_uid)
        new_status = "Faollashtirildi" if target.get("is_active") == 1 else "Ruxsat to'xtatildi"
        await query.answer(f"✅ {new_status}")

        role_str = "👑 Administrator" if target.get("role") == "admin" else "👤 Oddiy foydalanuvchi (User)"
        status_str = "🟢 Faol (Ruxsat berilgan)" if target.get("is_active") == 1 else "🔴 Bloklangan (Ruxsat yo'q)"
        
        text = (
            "👤 <b>FOYDALANUVCHI MA'LUMOTLARI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 <b>Telegram ID:</b> <code>{target['user_id']}</code>\n"
            f"🏷 <b>Ism / Izoh:</b> <b>{target['name']}</b>\n"
            f"🎭 <b>Roli:</b> {role_str}\n"
            f"📊 <b>Holati:</b> {status_str}\n"
            f"📅 <b>Qo'shilgan vaqti:</b> {target.get('created_at', '—')}\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "👇 <i>Kerakli amalni tanlang:</i>"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_user_manage_keyboard(target),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin Delete Confirmation Screen
    if data.startswith("admin_del_confirm:"):
        target_uid = int(data.split(":")[1])
        if target_uid == 364227737:
            await query.answer("⛔ Asosiy tizim administratorini o'chirish mumkin emas!", show_alert=True)
            return

        target = db.get_user(target_uid)
        if not target:
            await query.answer("Foydalanuvchi topilmadi", show_alert=True)
            return

        await query.answer()
        text = (
            "⚠️ <b>FOYDALANUVCHINI BUTUNLAY O'CHIRISH</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Haqiqatan ham <b>{target['name']}</b> (<code>{target_uid}</code>) ni bazadan o'chirmoqchimisiz?\n\n"
            "<i>Ushbu foydalanuvchi bot orqali eshiklarni boshqara olmay qoladi.</i>"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_confirm_delete_keyboard(target_uid),
            parse_mode=ParseMode.HTML
        )
        return

    # Admin Delete Execution
    if data.startswith("admin_del_execute:"):
        target_uid = int(data.split(":")[1])
        if target_uid == 364227737:
            await query.answer("⛔ Asosiy tizim administratorini o'chirish mumkin emas!", show_alert=True)
            return

        target = db.get_user(target_uid)
        name = target["name"] if target else str(target_uid)
        db.delete_user(target_uid)
        logger.info(f"User {target_uid} ({name}) deleted by admin {user.id}")
        
        await query.answer(f"🗑 {name} butunlay o'chirildi!", show_alert=True)
        users = db.get_all_users()
        text = (
            "👥 <b>FOYDALANUVCHILAR RO'YXATI</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"✅ <b>{name}</b> muvaffaqiyatli o'chirildi.\n\n"
            f"Qolgan foydalanuvchilar soni: <b>{len(users)}</b> ta:"
        )
        await query.edit_message_text(
            text,
            reply_markup=get_users_list_keyboard(users, page=0),
            parse_mode=ParseMode.HTML
        )
        return

def main():
    logger.info("Initializing OpenDoorBot Database...")
    db.init_db()
    
    logger.info("Initializing OpenDoorBot Application...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("users", admin_users_cmd))
    app.add_handler(CommandHandler("add", admin_add_user_cmd))
    app.add_handler(CommandHandler("delete", admin_del_user_cmd))
    
    app.add_handler(CallbackQueryHandler(callback_router))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_message_handler))
    
    logger.info("Bot successfully started in Polling mode with Admin Panel.")
    app.run_polling()

if __name__ == "__main__":
    main()
