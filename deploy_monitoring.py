import paramiko
import time

DOCKER_COMPOSE_YML = """
networks:
  zbx_net:
    driver: bridge

services:
  postgres-server:
    image: postgres:15
    container_name: postgres-server
    restart: unless-stopped
    command: postgres -c shared_buffers=1024MB -c max_connections=300 -c work_mem=16MB -c maintenance_work_mem=256MB -c effective_cache_size=2GB
    environment:
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_db_pass
      - POSTGRES_DB=zabbix
    volumes:
      - /opt/monitoring/pg_data:/var/lib/postgresql/data
    networks:
      - zbx_net

  zabbix-server:
    image: zabbix/zabbix-server-pgsql:ubuntu-7.0-latest
    container_name: zabbix-server
    restart: unless-stopped
    environment:
      - DB_SERVER_HOST=postgres-server
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_db_pass
      - POSTGRES_DB=zabbix
      - ZBX_CACHESIZE=512M
      - ZBX_HISTORYCACHESIZE=512M
      - ZBX_TRENDCACHESIZE=128M
      - ZBX_VALUECACHESIZE=256M
      - ZBX_STARTPOLLERS=20
      - ZBX_STARTTRAPPERS=10
    ports:
      - "10051:10051"
    depends_on:
      - postgres-server
    networks:
      - zbx_net

  zabbix-web:
    image: zabbix/zabbix-web-nginx-pgsql:ubuntu-7.0-latest
    container_name: zabbix-web
    restart: unless-stopped
    environment:
      - DB_SERVER_HOST=postgres-server
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_db_pass
      - POSTGRES_DB=zabbix
      - ZBX_SERVER_HOST=zabbix-server
      - PHP_TZ=Asia/Tashkent
    ports:
      - "8081:8080" # Порт 8080 занят filebrowser, используем 8081
    depends_on:
      - postgres-server
      - zabbix-server
    networks:
      - zbx_net

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_INSTALL_PLUGINS=alexanderzobnin-zabbix-app
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3000:3000"
    volumes:
      - /opt/monitoring/grafana_data:/var/lib/grafana
    networks:
      - zbx_net
"""

def deploy():
    print("[*] Connecting to 10.0.0.111...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('10.0.0.111', username='root', password='123', timeout=5)

    print("[*] Creating directories...")
    client.exec_command('mkdir -p /opt/monitoring/pg_data /opt/monitoring/grafana_data')
    client.exec_command('chmod 777 /opt/monitoring/grafana_data')

    print("[*] Writing docker-compose.yml...")
    sftp = client.open_sftp()
    with sftp.file('/opt/monitoring/docker-compose.yml', 'w') as f:
        f.write(DOCKER_COMPOSE_YML)
    sftp.close()

    print("[*] Launching containers (docker compose up -d)...")
    stdin, stdout, stderr = client.exec_command('cd /opt/monitoring && docker compose up -d')
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    
    if exit_status == 0:
        print("[+] Containers started successfully!")
        print(out)
    else:
        print("[-] Error starting containers:")
        print(out)
        print(err)

if __name__ == "__main__":
    deploy()
