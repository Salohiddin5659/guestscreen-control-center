import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.0.0.111', username='root', password='123', timeout=5)

# Trigger docker pull and up in the background
stdin, stdout, stderr = client.exec_command('nohup sh -c "cd /opt/monitoring && docker compose up -d" > /opt/monitoring/deploy.log 2>&1 &')
print("Triggered deploy in background!")

# Check current status
stdin, stdout, stderr = client.exec_command('docker ps --format "{{.Names}} - {{.Status}}"')
print("Current containers:")
print(stdout.read().decode('utf-8'))
