#!/usr/bin/env python3
import http.server
import json
import logging
import os
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

LOG_FILE = "/var/log/jira_failover.log"
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

MASTER_URL = os.getenv("MASTER_URL", "https://jira.zeko.uz")
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "10"))  # Check every 10 seconds
TIMEOUT = int(os.getenv("CHECK_TIMEOUT", "6"))
FAIL_THRESHOLD = int(os.getenv("FAIL_THRESHOLD", "5"))   # 5 failed checks (~50s) triggers failover
RECOVERY_THRESHOLD = int(os.getenv("RECOVERY_THRESHOLD", "3")) # 3 stable checks (~30s) triggers recovery
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "5005"))

TG_BOT_TOKEN = os.getenv("BOT_TOKEN", "8496317230:AAFu5zpCmbR0Tx3Dp27DJA1OiSldrOTkGLc")
TG_TARGET_CHATS = [-1003034942566, 364227737]

state = {
    "master_url": MASTER_URL,
    "master_status": "UNKNOWN",
    "last_check_time": None,
    "consecutive_failures": 0,
    "consecutive_successes": 0,
    "failover_active": False,
    "last_failover_time": None,
    "last_recovery_time": None
}
state_lock = threading.RLock()

def send_telegram(text: str):
    if not TG_BOT_TOKEN or not TG_TARGET_CHATS:
        return
    def _send():
        for chat_id in TG_TARGET_CHATS:
            url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }
            try:
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    pass
            except Exception as e:
                logging.error(f"Failed to send Telegram alert to {chat_id}: {e}")
    threading.Thread(target=_send, daemon=True).start()

def is_local_jira_running():
    try:
        res = subprocess.run(
            ["docker", "ps", "-q", "-f", "name=jira-monitor-auth"],
            capture_output=True, text=True, timeout=5
        )
        return bool(res.stdout.strip())
    except Exception as e:
        logging.error(f"Error checking docker status: {e}")
        return False

def start_local_jira(reason="Master is DOWN"):
    logging.warning(f"!!! [TRIGGER START] Starting local Jira monitoring: {reason} !!!")
    try:
        try:
            subprocess.run(["docker", "start", "jira-postgres", "jira-monitor-auth"], check=True, timeout=30)
        except Exception:
            subprocess.run(["docker", "compose", "-f", "/opt/jira/Jira_auth/docker-compose.yml", "up", "-d"], check=True, timeout=60)
        
        with state_lock:
            state["failover_active"] = True
            state["last_failover_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        logging.info("[STARTED] Local Jira monitoring is now RUNNING on 10.0.0.111:5001")
        
        tg_text = (
            "🚨 <b>ВНИМАНИЕ: Авария основного сервера!</b>\n\n"
            f"Сервер <code>{MASTER_URL}</code> не отвечает.\n"
            f"<b>Причина:</b> {reason}\n\n"
            "✅ <b>Локальный сервис на 10.0.0.111:5001 автоматически ЗАПУЩЕН!</b>\n"
            "Мониторинг тикетов перехвачен резервным сервером."
        )
        send_telegram(tg_text)
        return True
    except Exception as e:
        logging.error(f"[ERROR] Failed to start local Jira monitoring: {e}")
        return False

def stop_local_jira(reason="Master is ONLINE"):
    logging.info(f"--- [TRIGGER STOP] Stopping local Jira monitoring: {reason} ---")
    try:
        subprocess.run(["docker", "stop", "-t", "3", "jira-monitor-auth", "jira-postgres"], check=True, timeout=30)
        with state_lock:
            state["failover_active"] = False
            state["last_recovery_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
            
        logging.info("[STOPPED] Local Jira monitoring is now STOPPED to prevent split-brain.")
        
        tg_text = (
            "🟢 <b>Основной сервер восстановил работу!</b>\n\n"
            f"Сервер <code>{MASTER_URL}</code> снова доступен и стабилен.\n\n"
            "⏸ <b>Локальный сервис на 10.0.0.111:5001 переведен в режим ожидания.</b>"
        )
        send_telegram(tg_text)
        return True
    except Exception as e:
        logging.error(f"[ERROR] Failed to stop local Jira monitoring: {e}")
        return False

def check_master():
    req = urllib.request.Request(
        MASTER_URL,
        headers={"User-Agent": "JiraFailoverWatchdog/2.0"},
        method="HEAD"
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        if e.code in [200, 301, 302, 401, 403]:
            return True, e.code
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)

def watchdog_loop():
    logging.info(f"Watchdog loop active. Target: {MASTER_URL} (interval: {CHECK_INTERVAL}s, fail_limit: {FAIL_THRESHOLD})")
    while True:
        try:
            ok, status_detail = check_master()
            now_str = time.strftime("%Y-%m-%d %H:%M:%S")
            
            action_needed = None
            action_reason = ""
            
            with state_lock:
                state["last_check_time"] = now_str
                if ok:
                    state["consecutive_successes"] += 1
                    state["consecutive_failures"] = 0
                    if state["consecutive_successes"] >= RECOVERY_THRESHOLD:
                        if state["master_status"] != "UP":
                            logging.info(f"[HEALTH OK] {MASTER_URL} confirmed UP (status: {status_detail}).")
                            state["master_status"] = "UP"
                        if state["failover_active"] or is_local_jira_running():
                            action_needed = "stop"
                            action_reason = f"{MASTER_URL} is confirmed online"
                else:
                    state["consecutive_failures"] += 1
                    state["consecutive_successes"] = 0
                    logging.warning(f"[HEALTH WARN] {MASTER_URL} check failed ({state['consecutive_failures']}/{FAIL_THRESHOLD}): {status_detail}")
                    
                    if state["consecutive_failures"] >= FAIL_THRESHOLD:
                        if state["master_status"] != "DOWN":
                            logging.critical(f"[ALERT] {MASTER_URL} is confirmed DOWN!")
                            state["master_status"] = "DOWN"
                        if not state["failover_active"] and not is_local_jira_running():
                            action_needed = "start"
                            action_reason = f"{MASTER_URL} failed {state['consecutive_failures']} consecutive checks ({status_detail})"

            # Execute actions OUTSIDE of the state_lock to avoid blocking and deadlocks
            if action_needed == "start":
                start_local_jira(action_reason)
            elif action_needed == "stop":
                stop_local_jira(action_reason)

        except Exception as ex:
            logging.error(f"Unexpected error in watchdog loop: {ex}")
            
        time.sleep(CHECK_INTERVAL)

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def do_GET(self):
        if self.path in ["/status", "/"]:
            with state_lock:
                data = dict(state)
            data["local_jira_running"] = is_local_jira_running()
            self._send_json(data)
        else:
            self._send_json({"error": "Not Found"}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8", errors="replace") if content_length > 0 else ""
        
        if self.path == "/webhook":
            logging.info(f"[WEBHOOK RECEIVED] {body}")
            is_down = False
            is_up = False
            try:
                j = json.loads(body)
                if "heartbeat" in j:
                    st = j["heartbeat"].get("status")
                    if st == 0: is_down = True
                    elif st == 1: is_up = True
                elif "alertType" in j:
                    if str(j["alertType"]) == "1": is_down = True
                    elif str(j["alertType"]) == "2": is_up = True
            except Exception:
                lower = body.lower()
                if "down" in lower or "alerttype=1" in lower: is_down = True
                elif "up" in lower or "alerttype=2" in lower: is_up = True
            
            if is_down:
                start_local_jira("Webhook trigger: DOWN")
                self._send_json({"status": "ok", "action": "started_local_jira"})
            elif is_up:
                stop_local_jira("Webhook trigger: UP")
                self._send_json({"status": "ok", "action": "stopped_local_jira"})
            else:
                self._send_json({"status": "ignored", "message": "Unknown status in webhook"})

        elif self.path == "/start":
            start_local_jira("Manual API trigger")
            self._send_json({"status": "ok", "action": "started_local_jira"})
        elif self.path == "/stop":
            stop_local_jira("Manual API trigger")
            self._send_json({"status": "ok", "action": "stopped_local_jira"})
        else:
            self._send_json({"error": "Not Found"}, 404)

def run_server():
    server = http.server.ThreadingHTTPServer(("0.0.0.0", WEBHOOK_PORT), WebhookHandler)
    logging.info(f"Webhook HTTP server listening on port {WEBHOOK_PORT}")
    server.serve_forever()

if __name__ == "__main__":
    t_server = threading.Thread(target=run_server, daemon=True)
    t_server.start()
    watchdog_loop()
