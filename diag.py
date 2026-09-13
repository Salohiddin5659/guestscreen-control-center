import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.0.0.111', username='root', password='123', timeout=5)

print('--- DOCKER PS ---')
stdin, stdout, stderr = client.exec_command('docker ps')
print(stdout.read().decode('utf-8'))

print('--- LOCAL CURL GRAFANA ---')
stdin, stdout, stderr = client.exec_command('curl -s -I http://localhost:3000')
print(stdout.read().decode('utf-8'))

print('--- FIREWALL UFW ---')
stdin, stdout, stderr = client.exec_command('ufw status')
print(stdout.read().decode('utf-8'))
