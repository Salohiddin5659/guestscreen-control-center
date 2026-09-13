#!/usr/bin/env python3
"""
GuestScreen Server User Management CLI
Allows system administrators to list, create, update, and manage users directly from the server shell.

Usage:
  gs-users list
  gs-users create <username> <password> [--role ADMINISTRATOR|OPERATOR|AUDITOR] [--fullname "Full Name"]
  gs-users reset-password <username> <new_password>
  gs-users delete <username> [--force]
  gs-users set-role <username> <ADMINISTRATOR|OPERATOR|AUDITOR>
  gs-users toggle-active <username>
"""

import sys
import argparse
import asyncio
from datetime import datetime, timezone
from sqlmodel import select
from app.db.session import async_session_factory
from app.models.security import User
from app.core.security import get_password_hash

VALID_ROLES = {"ADMINISTRATOR", "OPERATOR", "AUDITOR"}


async def list_users():
    async with async_session_factory() as session:
        result = await session.exec(select(User).order_by(User.created_at.asc()))
        users = result.all()

        if not users:
            print("В базе данных нет пользователей.")
            return

        print("\n" + "=" * 95)
        print(f"{'USERNAME':<18} | {'FULL NAME':<24} | {'ROLE':<15} | {'STATUS':<10} | {'CREATED AT':<20}")
        print("=" * 95)

        for u in users:
            status_str = "ACTIVE" if u.is_active else "DISABLED"
            fullname_str = u.full_name or "-"
            created_str = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "-"
            print(f"{u.username:<18} | {fullname_str:<24} | {u.role:<15} | {status_str:<10} | {created_str:<20}")

        print("=" * 95)
        print(f"Всего пользователей: {len(users)}\n")


async def create_user(username: str, password: str, role: str, fullname: str | None):
    username = username.strip()
    role = role.strip().upper()
    fullname = fullname.strip() if fullname else None

    if len(username) < 3:
        print("ОШИБКА: Имя пользователя должно содержать минимум 3 символа.", file=sys.stderr)
        sys.exit(1)

    if len(password) < 6:
        print("ОШИБКА: Пароль должен содержать минимум 6 символов.", file=sys.stderr)
        sys.exit(1)

    if role not in VALID_ROLES:
        print(f"ОШИБКА: Недопустимая роль '{role}'. Допустимые роли: {', '.join(VALID_ROLES)}", file=sys.stderr)
        sys.exit(1)

    async with async_session_factory() as session:
        existing = (await session.exec(select(User).where(User.username == username))).first()
        if existing:
            print(f"ОШИБКА: Пользователь с логином '{username}' уже существует.", file=sys.stderr)
            sys.exit(1)

        user = User(
            username=username,
            password_hash=get_password_hash(password),
            full_name=fullname,
            role=role,
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        print(f"\n[OK] Пользователь успешно создан:")
        print(f"     ID:       {user.id}")
        print(f"     Логин:    {user.username}")
        print(f"     ФИО:      {user.full_name or '-'}")
        print(f"     Роль:     {user.role}")
        print(f"     Статус:   АКТИВЕН\n")


async def reset_password(username: str, new_password: str):
    username = username.strip()

    if len(new_password) < 6:
        print("ОШИБКА: Новый пароль должен содержать минимум 6 символов.", file=sys.stderr)
        sys.exit(1)

    async with async_session_factory() as session:
        user = (await session.exec(select(User).where(User.username == username))).first()
        if not user:
            print(f"ОШИБКА: Пользователь '{username}' не найден.", file=sys.stderr)
            sys.exit(1)

        user.password_hash = get_password_hash(new_password)
        session.add(user)
        await session.commit()

        print(f"\n[OK] Пароль пользователя '{username}' успешно обновлен.\n")


async def delete_user(username: str, force: bool):
    username = username.strip()

    async with async_session_factory() as session:
        user = (await session.exec(select(User).where(User.username == username))).first()
        if not user:
            print(f"ОШИБКА: Пользователь '{username}' не найден.", file=sys.stderr)
            sys.exit(1)

        # Check if this is the only ADMINISTRATOR
        if user.role == "ADMINISTRATOR":
            admins = (await session.exec(select(User).where(User.role == "ADMINISTRATOR"))).all()
            if len(admins) <= 1 and not force:
                print("ОШИБКА: Нельзя удалить единственного администратора в системе без флага --force.", file=sys.stderr)
                sys.exit(1)

        await session.delete(user)
        await session.commit()

        print(f"\n[OK] Пользователь '{username}' удален из системы.\n")


async def set_role(username: str, new_role: str):
    username = username.strip()
    new_role = new_role.strip().upper()

    if new_role not in VALID_ROLES:
        print(f"ОШИБКА: Недопустимая роль '{new_role}'. Допустимые: {', '.join(VALID_ROLES)}", file=sys.stderr)
        sys.exit(1)

    async with async_session_factory() as session:
        user = (await session.exec(select(User).where(User.username == username))).first()
        if not user:
            print(f"ОШИБКА: Пользователь '{username}' не найден.", file=sys.stderr)
            sys.exit(1)

        user.role = new_role
        session.add(user)
        await session.commit()

        print(f"\n[OK] Роль пользователя '{username}' изменена на '{new_role}'.\n")


async def toggle_active(username: str):
    username = username.strip()

    async with async_session_factory() as session:
        user = (await session.exec(select(User).where(User.username == username))).first()
        if not user:
            print(f"ОШИБКА: Пользователь '{username}' не найден.", file=sys.stderr)
            sys.exit(1)

        user.is_active = not user.is_active
        session.add(user)
        await session.commit()

        new_status = "АКТИВЕН" if user.is_active else "ОТКЛЮЧЕН"
        print(f"\n[OK] Статус пользователя '{username}' изменен на: {new_status}\n")


def main():
    parser = argparse.ArgumentParser(
        prog="gs-users",
        description="GuestScreen Central Server User Management CLI"
    )
    subparsers = parser.add_subparsers(dest="command", required=True, help="Команды управления пользователями")

    # list
    subparsers.add_parser("list", help="Вывести список всех зарегистрированных пользователей")

    # create
    create_p = subparsers.add_parser("create", help="Создать нового пользователя")
    create_p.add_argument("username", help="Логин пользователя (уникальный, мин. 3 символа)")
    create_p.add_argument("password", help="Пароль пользователя (мин. 6 символов)")
    create_p.add_argument("--role", default="OPERATOR", choices=["ADMINISTRATOR", "OPERATOR", "AUDITOR"],
                          help="Роль пользователя (по умолчанию: OPERATOR)")
    create_p.add_argument("--fullname", default=None, help="Полное имя / ФИО пользователя")

    # reset-password
    pwd_p = subparsers.add_parser("reset-password", help="Сбросить пароль пользователя")
    pwd_p.add_argument("username", help="Логин пользователя")
    pwd_p.add_argument("new_password", help="Новый пароль")

    # delete
    del_p = subparsers.add_parser("delete", help="Удалить пользователя")
    del_p.add_argument("username", help="Логин пользователя для удаления")
    del_p.add_argument("--force", action="store_true", help="Принудительное удаление (даже если единственный администратор)")

    # set-role
    role_p = subparsers.add_parser("set-role", help="Изменить роль пользователя")
    role_p.add_argument("username", help="Логин пользователя")
    role_p.add_argument("role", choices=["ADMINISTRATOR", "OPERATOR", "AUDITOR"], help="Новая роль")

    # toggle-active
    toggle_p = subparsers.add_parser("toggle-active", help="Включить / отключить активность аккаунта")
    toggle_p.add_argument("username", help="Логин пользователя")

    args = parser.parse_args()

    if args.command == "list":
        asyncio.run(list_users())
    elif args.command == "create":
        asyncio.run(create_user(args.username, args.password, args.role, args.fullname))
    elif args.command == "reset-password":
        asyncio.run(reset_password(args.username, args.new_password))
    elif args.command == "delete":
        asyncio.run(delete_user(args.username, args.force))
    elif args.command == "set-role":
        asyncio.run(set_role(args.username, args.role))
    elif args.command == "toggle-active":
        asyncio.run(toggle_active(args.username))


if __name__ == "__main__":
    main()
